import { appendFile, copyFile, mkdir, readdir, readFile, rename, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import type { VehicleInput } from "./types";

const LOGS_DIR = path.resolve(process.cwd(), "var", "logs");
const LLM_LOG_DIR = path.join(LOGS_DIR, "llm-responses");
const LEGACY_CLAUDE_LOG_DIR = path.join(LOGS_DIR, "claude-responses");
const LEGACY_OPENROUTER_LOG_DIR = path.join(LOGS_DIR, "openrouter-responses");
const DATA_DIR = path.resolve(process.cwd(), "var", "data");
const LLM_DATA_DIR = path.join(DATA_DIR, "llm-responses");
const LEGACY_CLAUDE_DATA_DIR = path.join(DATA_DIR, "claude-responses");
const LEGACY_OPENROUTER_DATA_DIR = path.join(DATA_DIR, "openrouter-responses");
const HTTP_LOG_FILE = path.join(LOGS_DIR, "http-requests.log");
const ERROR_LOG_FILE = path.join(LOGS_DIR, "errors.log");

export type LLMProvider = "claude" | "openrouter" | "simulated";

interface HttpLogEntry {
  requestId: string;
  method: string;
  path: string;
  statusCode: number;
  durationMs: number;
  ip: string;
  at: string;
}

interface ClaudeExecutionEntry {
  executionId: string;
  startedAt: string;
  finishedAt: string;
  vehicle: VehicleInput;
  model: string;
  maxTurns: number;
  provider: LLMProvider;
  promptSha256: string;
  finalPromptPreview: string;
  turns: unknown[];
  result?: unknown;
  error?: {
    message: string;
    details?: unknown;
  };
}

interface ClaudeSnapshotEntry {
  savedAt: string;
  executionId: string;
  provider: LLMProvider;
  vehicle: VehicleInput;
  response: unknown;
}

export interface ClaudeExecutionReadItem {
  id: string;
  finishedAt: string;
  provider: LLMProvider;
  model: string;
  vehicle: VehicleInput | null;
  response: unknown;
}

export async function logHttpRequest(entry: HttpLogEntry): Promise<void> {
  const line =
    `[${entry.at}] id=${entry.requestId} ${entry.method} ${entry.path} ` +
    `status=${entry.statusCode} duration=${entry.durationMs.toFixed(1)}ms ip=${entry.ip}\n`;

  console.log(line.trim());

  try {
    await ensureLogsDir();
    await appendFile(HTTP_LOG_FILE, line, "utf-8");
  } catch (error) {
    console.warn("Falha ao persistir http-requests.log:", normalizeError(error));
  }
}

export async function logServerError(requestId: string, error: unknown): Promise<void> {
  const at = new Date().toISOString();
  const normalized = normalizeError(error);
  const line = `[${at}] id=${requestId} ${normalized}\n`;

  console.error(line.trim());

  try {
    await ensureLogsDir();
    await appendFile(ERROR_LOG_FILE, line, "utf-8");
  } catch (appendError) {
    console.warn("Falha ao persistir errors.log:", normalizeError(appendError));
  }
}

export async function logLLMExecution(entry: ClaudeExecutionEntry): Promise<string> {
  await ensureLogsDir();
  await mkdir(LLM_LOG_DIR, { recursive: true });
  await migrateLegacyLLMLogs();

  const safeVehicle = `${sanitize(entry.vehicle.marca)}-${sanitize(entry.vehicle.modelo)}-${entry.vehicle.ano_modelo}`;
  const modelSlug = sanitizeModelName(entry.model);
  const localTimestamp = toSaoPauloTimestampFilePart(entry.finishedAt);
  const filename =
    `${localTimestamp}--${sanitize(entry.provider)}--${modelSlug}` +
    `--${safeVehicle}.json`;
  const category = classifyLLMExecutionCategory(entry);
  const targetDir = resolveLogDir(entry.provider, entry.model, category);
  const filePath = path.join(targetDir, filename);

  await mkdir(targetDir, { recursive: true });
  await writeFile(filePath, JSON.stringify(entry, null, 2), "utf-8");
  console.log(`${entry.provider} execution salva em: ${filePath}`);

  return filePath;
}

export async function saveLLMResponseSnapshot(
  executionId: string,
  provider: LLMProvider,
  vehicle: VehicleInput,
  response: unknown
): Promise<string> {
  await mkdir(LLM_DATA_DIR, { recursive: true });
  await migrateLegacyLLMSnapshots();

  const now = new Date().toISOString();
  const safeVehicle = `${sanitize(vehicle.marca)}-${sanitize(vehicle.modelo)}-${vehicle.ano_modelo}`;
  const model = resolveModelByProvider(provider);
  const modelSlug = sanitizeModelName(model);
  const localTimestamp = toSaoPauloTimestampFilePart(now);
  const filename =
    `${localTimestamp}--${sanitize(provider)}--${modelSlug}` +
    `--${safeVehicle}.json`;
  const filePath = path.join(resolveDataDir(provider, model), filename);

  const entry: ClaudeSnapshotEntry = {
    savedAt: now,
    executionId,
    provider,
    vehicle,
    response
  };

  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, JSON.stringify(entry, null, 2), "utf-8");
  return filePath;
}

export async function readLatestLLMResponseSnapshot(): Promise<unknown | null> {
  try {
    await migrateLegacyLLMSnapshots();
    const filePaths = await listLLMSnapshotFiles();
    const latest = filePaths.at(0);
    if (!latest) {
      return null;
    }

    const raw = await readFile(latest, "utf-8");
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return parsed.response ?? null;
  } catch {
    return null;
  }
}

export async function readRecentLLMResponses(limit = 2): Promise<ClaudeExecutionReadItem[]> {
  const safeLimit = Number.isInteger(limit) && limit > 0 ? limit : 2;

  try {
    await migrateLegacyLLMLogs();
    const filePaths = await listLLMExecutionFiles();
    const items = await Promise.all(
      filePaths.map(async (filePath) => {
        const raw = await readFile(filePath, "utf-8");
        const parsed = JSON.parse(raw) as Record<string, unknown>;
        const fileName = path.basename(filePath);

        const executionId =
          typeof parsed.executionId === "string" && parsed.executionId.trim().length > 0
            ? parsed.executionId
            : fileName.replace(/\.json$/i, "");
        const finishedAt =
          typeof parsed.finishedAt === "string" && parsed.finishedAt.trim().length > 0
            ? parsed.finishedAt
            : "";
        const vehicle = isVehicleInput(parsed.vehicle) ? parsed.vehicle : null;
        const provider = isProvider(parsed.provider) ? parsed.provider : inferProviderFromPath(filePath);
        const model =
          typeof parsed.model === "string" && parsed.model.trim().length > 0
            ? parsed.model
            : resolveModelByProvider(provider);

        return {
          id: executionId,
          finishedAt,
          provider,
          model,
          vehicle,
          response: parsed.result ?? null
        } satisfies ClaudeExecutionReadItem;
      })
    );

    const deduped = new Map<string, ClaudeExecutionReadItem>();
    for (const item of items) {
      const key = `${item.id}|${item.finishedAt}|${item.provider}`;
      if (!deduped.has(key)) {
        deduped.set(key, item);
      }
    }

    return Array.from(deduped.values()).slice(0, safeLimit);
  } catch {
    return [];
  }
}

export async function logClaudeExecution(entry: Omit<ClaudeExecutionEntry, "provider">): Promise<string> {
  return logLLMExecution({ ...entry, provider: "claude" });
}

export async function saveClaudeResponseSnapshot(
  executionId: string,
  vehicle: VehicleInput,
  response: unknown
): Promise<string> {
  return saveLLMResponseSnapshot(executionId, "claude", vehicle, response);
}

export async function readLatestClaudeResponseSnapshot(): Promise<unknown | null> {
  return readLatestLLMResponseSnapshot();
}

export async function readRecentClaudeResponses(limit = 2): Promise<ClaudeExecutionReadItem[]> {
  return readRecentLLMResponses(limit);
}

export function createRequestId(): string {
  const now = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 8);
  return `${now}-${random}`;
}

function toSaoPauloTimestampFilePart(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return `invalid-date`;
  }

  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  });

  const partMap = new Map<string, string>();
  for (const part of formatter.formatToParts(date)) {
    partMap.set(part.type, part.value);
  }

  const year = partMap.get("year") ?? "0000";
  const month = partMap.get("month") ?? "00";
  const day = partMap.get("day") ?? "00";
  const hour = partMap.get("hour") ?? "00";
  const minute = partMap.get("minute") ?? "00";
  const second = partMap.get("second") ?? "00";
  const millis = String(date.getMilliseconds()).padStart(3, "0");

  return `${year}-${month}-${day}T${hour}-${minute}-${second}-${millis}BRT`;
}

function sanitize(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

function normalizeError(error: unknown): string {
  if (error instanceof Error) {
    return `${error.name}: ${error.message}${error.stack ? `\n${error.stack}` : ""}`;
  }
  return String(error);
}

async function ensureLogsDir(): Promise<void> {
  await mkdir(LOGS_DIR, { recursive: true });
}

async function listLLMExecutionFiles(): Promise<string[]> {
  const dirs = [LLM_LOG_DIR, LEGACY_CLAUDE_LOG_DIR, LEGACY_OPENROUTER_LOG_DIR];
  const files = await collectJsonFilesFromDirs(dirs);
  return files.sort((a, b) => path.basename(b).localeCompare(path.basename(a)));
}

async function listLLMSnapshotFiles(): Promise<string[]> {
  const dirs = [LLM_DATA_DIR, LEGACY_CLAUDE_DATA_DIR, LEGACY_OPENROUTER_DATA_DIR];
  const files = await collectJsonFilesFromDirs(dirs);
  return files.sort((a, b) => path.basename(b).localeCompare(path.basename(a)));
}

async function collectJsonFilesFromDirs(dirs: string[]): Promise<string[]> {
  const files: string[] = [];

  for (const dir of dirs) {
    try {
      files.push(...(await collectJsonFilesRecursive(dir)));
    } catch {
      // ignore missing provider dirs
    }
  }

  return files;
}

async function collectJsonFilesRecursive(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectJsonFilesRecursive(fullPath)));
      continue;
    }

    if (entry.isFile() && entry.name.toLowerCase().endsWith(".json")) {
      files.push(fullPath);
    }
  }

  return files;
}

function classifyLLMExecutionCategory(entry: ClaudeExecutionEntry): "erro" | "sem-web-search" | "padrao" {
  if (entry.error) {
    return "erro";
  }

  const webSearchRequests = countWebSearchRequests(entry.turns);
  if (webSearchRequests <= 0) {
    return "sem-web-search";
  }

  return "padrao";
}

function resolveLogDir(
  provider: LLMProvider,
  model: string,
  category: "erro" | "sem-web-search" | "padrao"
): string {
  const providerSlug = sanitize(provider);
  const modelSlug = sanitizeModelName(model);
  const categorySlug = category === "padrao" ? "ok" : category;
  return path.join(LLM_LOG_DIR, providerSlug, modelSlug, categorySlug);
}

function resolveDataDir(provider: LLMProvider, model: string): string {
  const providerSlug = sanitize(provider);
  const modelSlug = sanitizeModelName(model);
  return path.join(LLM_DATA_DIR, providerSlug, modelSlug);
}

function inferProviderFromPath(filePath: string): LLMProvider {
  const normalized = filePath.toLowerCase();
  if (normalized.includes(path.sep + "openrouter" + path.sep)) {
    return "openrouter";
  }
  if (normalized.includes("openrouter-responses")) {
    return "openrouter";
  }
  if (normalized.includes(path.sep + "claude" + path.sep)) {
    return "claude";
  }
  if (normalized.includes("claude-responses")) {
    return "claude";
  }
  return "simulated";
}

function resolveModelByProvider(provider: LLMProvider): string {
  if (provider === "claude") {
    return process.env.CLAUDE_MODEL ?? "claude-sonnet-4-5";
  }
  if (provider === "openrouter") {
    return process.env.OPENROUTER_MODEL ?? "google/gemini-2.5-flash";
  }
  return "simulated";
}

function sanitizeModelName(model: string): string {
  return model
    .trim()
    .toLowerCase()
    .replace(/[\/\\:]+/g, "-")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9._-]/g, "-")
    .replace(/-+/g, "-");
}

async function migrateLegacyLLMLogs(): Promise<void> {
  const legacyDirs = [LEGACY_CLAUDE_LOG_DIR, LEGACY_OPENROUTER_LOG_DIR];

  for (const legacyDir of legacyDirs) {
    const filePaths = await collectJsonFilesFromDirs([legacyDir]);
    for (const filePath of filePaths) {
      try {
        const raw = await readFile(filePath, "utf-8");
        const parsed = JSON.parse(raw) as Record<string, unknown>;
        const provider = isProvider(parsed.provider) ? parsed.provider : inferProviderFromPath(filePath);
        const model = typeof parsed.model === "string" && parsed.model.trim().length > 0
          ? parsed.model
          : resolveModelByProvider(provider);
        const finishedAt = typeof parsed.finishedAt === "string" && parsed.finishedAt.trim().length > 0
          ? parsed.finishedAt
          : new Date().toISOString();
        const vehicle = isVehicleInput(parsed.vehicle)
          ? parsed.vehicle
          : { marca: "unknown", modelo: "unknown", versao: "unknown", ano_modelo: 0, mercado: "unknown" };
        const category = parsed.error ? "erro" : countWebSearchRequests(Array.isArray(parsed.turns) ? parsed.turns : []) <= 0
          ? "sem-web-search"
          : "padrao";

        const safeVehicle = `${sanitize(vehicle.marca)}-${sanitize(vehicle.modelo)}-${vehicle.ano_modelo}`;
        const localTimestamp = toSaoPauloTimestampFilePart(finishedAt);
        const fileName =
          `${localTimestamp}--${sanitize(provider)}--${sanitizeModelName(model)}` +
          `--${safeVehicle}.json`;
        const targetDir = resolveLogDir(provider, model, category);
        const targetPath = path.join(targetDir, fileName);

        if (path.resolve(filePath) === path.resolve(targetPath)) {
          continue;
        }

        await mkdir(targetDir, { recursive: true });
        if (await pathExists(targetPath)) {
          continue;
        }

        await safeMoveFile(filePath, targetPath);
      } catch {
        // keep legacy file when parsing/migration fails
      }
    }
  }
}

async function migrateLegacyLLMSnapshots(): Promise<void> {
  const legacyDirs = [LEGACY_CLAUDE_DATA_DIR, LEGACY_OPENROUTER_DATA_DIR];

  for (const legacyDir of legacyDirs) {
    const filePaths = await collectJsonFilesFromDirs([legacyDir]);
    for (const filePath of filePaths) {
      try {
        const raw = await readFile(filePath, "utf-8");
        const parsed = JSON.parse(raw) as Record<string, unknown>;
        const provider = isProvider(parsed.provider) ? parsed.provider : inferProviderFromPath(filePath);
        const model = resolveModelByProvider(provider);
        const savedAt = typeof parsed.savedAt === "string" && parsed.savedAt.trim().length > 0
          ? parsed.savedAt
          : new Date().toISOString();
        const vehicle = isVehicleInput(parsed.vehicle)
          ? parsed.vehicle
          : { marca: "unknown", modelo: "unknown", versao: "unknown", ano_modelo: 0, mercado: "unknown" };
        const safeVehicle = `${sanitize(vehicle.marca)}-${sanitize(vehicle.modelo)}-${vehicle.ano_modelo}`;
        const localTimestamp = toSaoPauloTimestampFilePart(savedAt);
        const fileName =
          `${localTimestamp}--${sanitize(provider)}--${sanitizeModelName(model)}` +
          `--${safeVehicle}.json`;
        const targetDir = resolveDataDir(provider, model);
        const targetPath = path.join(targetDir, fileName);

        if (path.resolve(filePath) === path.resolve(targetPath)) {
          continue;
        }

        await mkdir(targetDir, { recursive: true });
        if (await pathExists(targetPath)) {
          continue;
        }

        await safeMoveFile(filePath, targetPath);
      } catch {
        // keep legacy snapshot when parsing/migration fails
      }
    }
  }
}

async function safeMoveFile(source: string, target: string): Promise<void> {
  try {
    await rename(source, target);
  } catch {
    await copyFile(source, target);
    await unlink(source);
  }
}

async function pathExists(filePath: string): Promise<boolean> {
  try {
    await readFile(filePath);
    return true;
  } catch {
    return false;
  }
}

function isProvider(value: unknown): value is LLMProvider {
  return value === "claude" || value === "openrouter" || value === "simulated";
}

function countWebSearchRequests(turns: unknown[]): number {
  let total = 0;

  for (const turn of turns) {
    const turnObj = asRecord(turn);
    if (!turnObj) {
      continue;
    }

    const responseObj = asRecord(turnObj.response);
    if (!responseObj) {
      continue;
    }

    const usageObj = asRecord(responseObj.usage);
    const serverToolUseObj = asRecord(usageObj?.server_tool_use);
    const usageWebSearchRequests = serverToolUseObj?.web_search_requests;
    if (typeof usageWebSearchRequests === "number" && Number.isFinite(usageWebSearchRequests)) {
      total += usageWebSearchRequests;
      continue;
    }

    const content = Array.isArray(responseObj.content) ? responseObj.content : [];
    for (const block of content) {
      const blockObj = asRecord(block);
      if (!blockObj) {
        continue;
      }

      if (blockObj.type === "server_tool_use" && blockObj.name === "web_search") {
        total += 1;
      }
    }

    total += countUrlCitations(responseObj);
  }

  return total;
}

function countUrlCitations(node: unknown): number {
  if (Array.isArray(node)) {
    return node.reduce((acc, item) => acc + countUrlCitations(item), 0);
  }

  const obj = asRecord(node);
  if (!obj) {
    return 0;
  }

  let total = 0;
  if (obj.type === "url_citation" && typeof obj.url === "string") {
    total += 1;
  }

  for (const value of Object.values(obj)) {
    total += countUrlCitations(value);
  }

  return total;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }

  return value as Record<string, unknown>;
}

function isVehicleInput(value: unknown): value is VehicleInput {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.marca === "string" &&
    typeof candidate.modelo === "string" &&
    typeof candidate.versao === "string" &&
    typeof candidate.ano_modelo === "number" &&
    typeof candidate.mercado === "string"
  );
}

