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
const LLM_EVENT_LOG_FILE = path.join(LOGS_DIR, "llm-events.log");

export type LLMProvider = "claude" | "openrouter" | "simulated";

export interface HttpLogEntry {
  requestId: string;
  method: string;
  path: string;
  statusCode: number;
  durationMs: number;
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
  runtimeConfig?: Record<string, unknown>;
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
  const event = {
    event: "http_request",
    at: entry.at,
    request_id: entry.requestId,
    method: entry.method,
    path: sanitizeTelemetryPath(entry.path),
    status_code: entry.statusCode,
    duration_ms: Math.round(entry.durationMs)
  };
  const line = `${JSON.stringify(event)}\n`;

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
  const line = `${JSON.stringify({ event: "server_error", at, request_id: requestId, category: errorCategory(error) })}\n`;

  console.error(line.trim());

  try {
    await ensureLogsDir();
    await appendFile(ERROR_LOG_FILE, line, "utf-8");
  } catch (appendError) {
    console.warn("Falha ao persistir errors.log:", normalizeError(appendError));
  }
}

export async function logValidationFailure(requestId: string, details: unknown): Promise<void> {
  const issues = sanitizeSchemaValidationIssues(details);
  const event = {
    event: "validation_failure",
    at: new Date().toISOString(),
    request_id: requestId,
    code: issues.length > 0 ? "schema_validation_failed" : "validation_failed",
    issue_count: issues.length,
    issues,
  };
  const line = `${JSON.stringify(event)}\n`;
  console.error(line.trim());
  try {
    await ensureLogsDir();
    await appendFile(ERROR_LOG_FILE, line, "utf-8");
  } catch (appendError) {
    console.warn("Falha ao persistir falha de validacao:", normalizeError(appendError));
  }
}

export function sanitizeSchemaValidationIssues(details: unknown): Array<{ path: string; keyword: string }> {
  const root = asRecord(details);
  const source = Array.isArray(root?.schemaIssues) ? root.schemaIssues : [];
  return source.slice(0, 20).flatMap((item) => {
    const issue = asRecord(item);
    const path = issue?.path;
    const keyword = issue?.keyword;
    if (typeof path !== "string" || typeof keyword !== "string") return [];
    const safePath = path.slice(0, 240);
    if (!/^\/(?:[A-Za-z0-9_.~-]+\/?)*$/.test(safePath) && safePath !== "/[redacted]") return [];
    if (!/^[a-zA-Z][a-zA-Z0-9_]{0,39}$/.test(keyword)) return [];
    return [{ path: safePath, keyword }];
  });
}

export async function logLLMExecution(entry: ClaudeExecutionEntry): Promise<string> {
  await ensureLogsDir();
  const brandPresenceDiscovery = sanitizeBrandPresenceDiscovery(entry.runtimeConfig);
  const researchDocumentDiscovery = sanitizeResearchDocumentDiscovery(entry.runtimeConfig);
  const sourceTrustBootstrap = sanitizeSourceTrustBootstrap(entry.runtimeConfig);
  const documentReader = sanitizeDocumentReader(entry.runtimeConfig);
  const openRouterPasses = sanitizeOpenRouterPassTelemetry(entry.runtimeConfig);
  const event = {
    event: "llm_execution",
    at: entry.finishedAt,
    request_id: entry.executionId,
    provider: entry.provider,
    model: sanitizeModelName(entry.model),
    duration_ms: safeDuration(entry.startedAt, entry.finishedAt),
    max_turns: entry.maxTurns,
    outcome: entry.error ? "error" : "success",
    ...(brandPresenceDiscovery ? { brand_presence_discovery: brandPresenceDiscovery } : {}),
    ...(researchDocumentDiscovery ? { research_document_discovery: researchDocumentDiscovery } : {}),
    ...(sourceTrustBootstrap ? { source_trust_bootstrap: sourceTrustBootstrap } : {}),
    ...(documentReader ? { document_reader: documentReader } : {}),
    ...(openRouterPasses ? { openrouter_passes: openRouterPasses } : {})
  };
  await appendFile(LLM_EVENT_LOG_FILE, `${JSON.stringify(event)}\n`, "utf-8");
  return LLM_EVENT_LOG_FILE;
}

export function sanitizeDocumentReader(runtimeConfig: Record<string, unknown> | undefined): {
  state: "skipped" | "completed" | "degraded";
  attempted: number;
  downloaded: number;
  parsed: number;
  rejected: number;
  total_bytes: number;
  total_pages: number;
  provider_files_attached: number;
  provider_parser_attempted: number;
  provider_parser_parsed: number;
  provider_parser_rejected: number;
  provider_parser_last_http_status: number;
  rejection_counts: Record<string, number>;
  provider_parser_rejection_counts: Record<string, number>;
} | null {
  const value = asRecord(runtimeConfig?.documentReader);
  if (!value) return null;
  const state = value.state;
  const attempted = value.attempted;
  const downloaded = value.downloaded;
  const parsed = value.parsed;
  const rejected = value.rejected;
  const totalBytes = value.totalBytes;
  const totalPages = value.totalPages;
  const providerFilesAttached = value.providerFilesAttached;
  const providerParserAttempted = value.providerParserAttempted;
  const providerParserParsed = value.providerParserParsed;
  const providerParserRejected = value.providerParserRejected;
  const providerParserLastHttpStatus = value.providerParserLastHttpStatus;
  const rejectionCounts = sanitizeDocumentReaderRejectionCounts(value.rejectionCounts);
  const providerParserRejectionCounts = sanitizeProviderParserRejectionCounts(value.providerParserRejectionCounts);
  if (
    (state !== "skipped" && state !== "completed" && state !== "degraded") ||
    !isNonNegativeInteger(attempted) || !isNonNegativeInteger(downloaded) ||
    !isNonNegativeInteger(parsed) || !isNonNegativeInteger(rejected) ||
    !isNonNegativeInteger(totalBytes) || !isNonNegativeInteger(totalPages) ||
    !isNonNegativeInteger(providerFilesAttached) ||
    !isNonNegativeInteger(providerParserAttempted) || !isNonNegativeInteger(providerParserParsed) ||
    !isNonNegativeInteger(providerParserRejected) || !isNonNegativeInteger(providerParserLastHttpStatus)
  ) return null;
  return {
    state,
    attempted,
    downloaded,
    parsed,
    rejected,
    total_bytes: totalBytes,
    total_pages: totalPages,
    provider_files_attached: providerFilesAttached,
    provider_parser_attempted: providerParserAttempted,
    provider_parser_parsed: providerParserParsed,
    provider_parser_rejected: providerParserRejected,
    provider_parser_last_http_status: providerParserLastHttpStatus,
    rejection_counts: rejectionCounts,
    provider_parser_rejection_counts: providerParserRejectionCounts,
  };
}

function sanitizeDocumentReaderRejectionCounts(value: unknown): Record<string, number> {
  const source = asRecord(value);
  if (!source) return {};
  const allowed = new Set([
    "document_without_extractable_text",
    "document_redirect_limit",
    "document_http_status",
    "document_content_type_not_allowed",
    "document_pdf_magic_invalid",
    "document_host_not_public",
    "document_too_large",
    "document_timeout",
    "document_url_not_safe",
    "document_domain_not_allowed",
    "document_tls_error",
    "document_request_or_parse_error",
  ]);
  const sanitized: Record<string, number> = {};
  for (const [key, count] of Object.entries(source)) {
    if (allowed.has(key) && isNonNegativeInteger(count)) sanitized[key] = count;
  }
  return sanitized;
}

function sanitizeProviderParserRejectionCounts(value: unknown): Record<string, number> {
  const source = asRecord(value);
  if (!source) return {};
  const allowed = new Set([
    "provider_parser_no_annotations",
    "provider_parser_http_error",
    "provider_parser_without_extractable_text",
    "provider_parser_request_error",
  ]);
  const sanitized: Record<string, number> = {};
  for (const [key, count] of Object.entries(source)) {
    if (allowed.has(key) && isNonNegativeInteger(count)) sanitized[key] = count;
  }
  return sanitized;
}

export function sanitizeBrandPresenceDiscovery(runtimeConfig: Record<string, unknown> | undefined): { state: "skipped" | "completed" | "degraded"; observed: number; candidate_host_count: number } | null {
  const value = asRecord(runtimeConfig?.brandPresenceDiscovery);
  if (!value) return null;
  const state = value.state;
  const observed = value.observed;
  const candidateHostCount = value.candidateHostCount;
  if ((state !== "skipped" && state !== "completed" && state !== "degraded") || !isNonNegativeInteger(observed) || !isNonNegativeInteger(candidateHostCount)) return null;
  return { state, observed, candidate_host_count: candidateHostCount };
}

function sanitizeResearchDocumentDiscovery(runtimeConfig: Record<string, unknown> | undefined): { state: "skipped" | "completed" | "degraded"; configured_official_domain_count: number; observed: number; eligible: number } | null {
  const value = asRecord(runtimeConfig?.officialDocumentDiscovery);
  if (!value) return null;
  const state = value.state;
  const configuredOfficialDomainCount = value.configuredOfficialDomainCount;
  const observed = value.observed;
  const eligible = value.eligible;
  if ((state !== "skipped" && state !== "completed" && state !== "degraded") || !isNonNegativeInteger(configuredOfficialDomainCount) || !isNonNegativeInteger(observed) || !isNonNegativeInteger(eligible)) return null;
  return { state, configured_official_domain_count: configuredOfficialDomainCount, observed, eligible };
}

export function sanitizeSourceTrustBootstrap(runtimeConfig: Record<string, unknown> | undefined): { state: "skipped" | "completed" | "degraded"; learned_anchor_count: number; discovered_candidate_count: number; candidate_document_observed: number; candidate_document_eligible: number; candidate_document_rejection_counts: Record<string, number> } | null {
  const value = asRecord(runtimeConfig?.sourceTrustBootstrap);
  if (!value) return null;
  const state = value.state;
  const learnedAnchorCount = value.learnedAnchorCount;
  const discoveredCandidateCount = value.discoveredCandidateCount;
  const candidateDocumentObserved = value.candidateDocumentObserved;
  const candidateDocumentEligible = value.candidateDocumentEligible;
  const candidateDocumentRejectionCounts = sanitizeRejectionCounts(value.candidateDocumentRejectionCounts);
  if ((state !== "skipped" && state !== "completed" && state !== "degraded") || !isNonNegativeInteger(learnedAnchorCount) || !isNonNegativeInteger(discoveredCandidateCount) || !isNonNegativeInteger(candidateDocumentObserved) || !isNonNegativeInteger(candidateDocumentEligible)) return null;
  return { state, learned_anchor_count: learnedAnchorCount, discovered_candidate_count: discoveredCandidateCount, candidate_document_observed: candidateDocumentObserved, candidate_document_eligible: candidateDocumentEligible, candidate_document_rejection_counts: candidateDocumentRejectionCounts };
}

function sanitizeRejectionCounts(value: unknown): Record<string, number> {
  const source = asRecord(value);
  if (!source) return {};
  const allowed = new Set([
    "marca_ou_modelo_nao_comprovado",
    "versao_ou_motorizacao_nao_comprovada",
    "ano_modelo_nao_comprovado",
    "ano_modelo_divergente",
    "mercado_nao_comprovado",
    "mercado_divergente",
    "url_nao_observada_no_provider",
    "url_nao_https_ou_insegura",
    "status_ambigua",
    "status_divergente",
    "status_nao_verificada",
  ]);
  const sanitized: Record<string, number> = {};
  for (const [key, count] of Object.entries(source)) {
    if (allowed.has(key) && isNonNegativeInteger(count)) sanitized[key] = count;
  }
  return sanitized;
}

type SanitizedOpenRouterPassTelemetry = {
  pass: "quick" | "refine" | "conflict_resolver";
  request_count: number;
  required_tool_turns: number;
  tool_only_turns: number;
  finalization_without_tools_turns: number;
  observed_source_count: number;
  inherited_evidence_count: number;
  authority_removed_source_count: number;
  adherence_removed_source_count: number;
  document_attachment_fallback_count: number;
  provider_error_count: number;
  last_provider_error_status: number;
  terminal_state: "in_progress" | "provider_error" | "empty_finalization" | "invalid_json" | "missing_web_evidence" | "valid_json" | "turn_limit";
};

export function sanitizeOpenRouterPassTelemetry(runtimeConfig: Record<string, unknown> | undefined): SanitizedOpenRouterPassTelemetry[] | null {
  const value = runtimeConfig?.openRouterPassTelemetry;
  if (!Array.isArray(value)) return null;
  const passes = value.slice(0, 3).flatMap((item) => {
    const pass = asRecord(item);
    const passName = pass?.pass;
    const terminalState = pass?.terminalState;
    const requestCount = pass?.requestCount;
    const requiredToolTurns = pass?.requiredToolTurns;
    const toolOnlyTurns = pass?.toolOnlyTurns;
    const finalizationWithoutToolsTurns = pass?.finalizationWithoutToolsTurns;
    const observedSourceCount = pass?.observedSourceCount;
    const inheritedEvidenceCount = pass?.inheritedEvidenceCount;
    const authorityRemovedSourceCount = pass?.authorityRemovedSourceCount;
    const adherenceRemovedSourceCount = pass?.adherenceRemovedSourceCount;
    const documentAttachmentFallbackCount = pass?.documentAttachmentFallbackCount ?? 0;
    const providerErrorCount = pass?.providerErrorCount ?? 0;
    const lastProviderErrorStatus = pass?.lastProviderErrorStatus ?? 0;
    if (
      !isOpenRouterPassName(passName) ||
      !isOpenRouterPassTerminalState(terminalState) ||
      !isNonNegativeInteger(requestCount) ||
      !isNonNegativeInteger(requiredToolTurns) ||
      !isNonNegativeInteger(toolOnlyTurns) ||
      !isNonNegativeInteger(finalizationWithoutToolsTurns) ||
      !isNonNegativeInteger(observedSourceCount)
      || !isNonNegativeInteger(inheritedEvidenceCount)
      || !isNonNegativeInteger(authorityRemovedSourceCount)
      || !isNonNegativeInteger(adherenceRemovedSourceCount)
      || !isNonNegativeInteger(documentAttachmentFallbackCount)
      || !isNonNegativeInteger(providerErrorCount)
      || !isNonNegativeInteger(lastProviderErrorStatus)
    ) return [];
    return [{
      pass: passName,
      request_count: requestCount,
      required_tool_turns: requiredToolTurns,
      tool_only_turns: toolOnlyTurns,
      finalization_without_tools_turns: finalizationWithoutToolsTurns,
      observed_source_count: observedSourceCount,
      inherited_evidence_count: inheritedEvidenceCount,
      authority_removed_source_count: authorityRemovedSourceCount,
      adherence_removed_source_count: adherenceRemovedSourceCount,
      document_attachment_fallback_count: documentAttachmentFallbackCount,
      provider_error_count: providerErrorCount,
      last_provider_error_status: lastProviderErrorStatus,
      terminal_state: terminalState,
    }];
  });
  return passes.length > 0 ? passes : null;
}

function isOpenRouterPassName(value: unknown): value is SanitizedOpenRouterPassTelemetry["pass"] {
  return value === "quick" || value === "refine" || value === "conflict_resolver";
}

function isOpenRouterPassTerminalState(value: unknown): value is SanitizedOpenRouterPassTelemetry["terminal_state"] {
  return value === "in_progress" || value === "provider_error" ||
    value === "empty_finalization" || value === "invalid_json" ||
    value === "missing_web_evidence" || value === "valid_json" || value === "turn_limit";
}

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0;
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
    await migrateLegacyLLMSnapshots();
    const filePaths = await listLLMSnapshotFiles();
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
          typeof parsed.savedAt === "string" && parsed.savedAt.trim().length > 0
            ? parsed.savedAt
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
          response: parsed.response ?? null
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

export function sanitizeTelemetryPath(value: string): string {
  const withoutQuery = value.split("?", 1)[0] ?? "/";
  return withoutQuery.replace(/\/(?:[A-Za-z0-9_-]{20,})(?=\/|$)/g, "/[redacted]");
}

function errorCategory(error: unknown): "http_error" | "internal_error" {
  return error && typeof error === "object" && "statusCode" in error ? "http_error" : "internal_error";
}

function safeDuration(startedAt: string, finishedAt: string): number {
  const start = Date.parse(startedAt);
  const finish = Date.parse(finishedAt);
  return Number.isFinite(start) && Number.isFinite(finish) && finish >= start ? finish - start : 0;
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

export function countUrlCitations(node: unknown): number {
  if (Array.isArray(node)) {
    return node.reduce((acc, item) => acc + countUrlCitations(item), 0);
  }

  const obj = asRecord(node);
  if (!obj) {
    return 0;
  }

  let total = 0;
  if (obj.type === "url_citation") {
    const nested = asRecord(obj.url_citation);
    if (typeof obj.url === "string" || typeof nested?.url === "string") {
      total += 1;
    }
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

