import { createHash } from "node:crypto";
import { desc, eq } from "drizzle-orm";
import { getDatabase } from "./client";
import { collectionRuns, schemaContracts, sources, technicalSheetSources, technicalSheetVersions, vehicleConfigurations } from "./schema";
import type { FichaTecnicaHistoryItem, FichaTecnicaResponse, VehicleInput } from "../types";
import type { LLMProvider } from "../logger";

const RUNTIME_SCHEMA_PATH = "packages/agent-runtime/assets/schema.json";

interface PersistTechnicalSheetInput {
  requestId: string;
  provider: LLMProvider;
  vehicle: VehicleInput;
  response: FichaTecnicaResponse;
  outputSchema: unknown;
  finalPrompt: string;
}

export async function persistTechnicalSheet(input: PersistTechnicalSheetInput): Promise<void> {
  const db = getDatabase();
  if (!db) return;
  const now = new Date();
  const schemaHash = sha256(input.outputSchema);

  await db.transaction(async (tx) => {
    const [vehicle] = await tx.insert(vehicleConfigurations).values({ brand: input.vehicle.marca, model: input.vehicle.modelo, trim: input.vehicle.versao, modelYear: input.vehicle.ano_modelo, market: input.vehicle.mercado, updatedAt: now }).onConflictDoUpdate({ target: [vehicleConfigurations.brand, vehicleConfigurations.model, vehicleConfigurations.trim, vehicleConfigurations.modelYear, vehicleConfigurations.market], set: { updatedAt: now } }).returning();
    const [schemaContract] = await tx.insert(schemaContracts).values({ sha256: schemaHash, runtimeAssetPath: RUNTIME_SCHEMA_PATH }).onConflictDoUpdate({ target: schemaContracts.sha256, set: { runtimeAssetPath: RUNTIME_SCHEMA_PATH } }).returning();
    const [lastVersion] = await tx.select({ versionNumber: technicalSheetVersions.versionNumber }).from(technicalSheetVersions).where(eq(technicalSheetVersions.vehicleConfigurationId, vehicle.id)).orderBy(desc(technicalSheetVersions.versionNumber)).limit(1);
    const [run] = await tx.insert(collectionRuns).values({ requestId: input.requestId, vehicleConfigurationId: vehicle.id, provider: input.provider, modelName: resolveModel(input.provider), status: "succeeded", schemaContractId: schemaContract.id, promptSha256: sha256(input.finalPrompt), startedAt: now, finishedAt: now }).returning();
    const [sheet] = await tx.insert(technicalSheetVersions).values({ collectionRunId: run.id, vehicleConfigurationId: vehicle.id, schemaContractId: schemaContract.id, versionNumber: (lastVersion?.versionNumber ?? 0) + 1, payload: input.response, completenessSummary: input.response.resumo_completude, payloadSha256: sha256(input.response) }).returning();

    for (const source of input.response.fontes_utilizadas) {
      const [storedSource] = await tx.insert(sources).values({ canonicalUrl: source.url, title: source.titulo, sourceType: source.tipo }).onConflictDoUpdate({ target: sources.canonicalUrl, set: { title: source.titulo, sourceType: source.tipo } }).returning();
      await tx.insert(technicalSheetSources).values({ technicalSheetVersionId: sheet.id, sourceId: storedSource.id, sourceRef: source.id });
    }
  });
}

export async function readLatestTechnicalSheet(): Promise<unknown | null> {
  const db = getDatabase();
  if (!db) return null;
  const [sheet] = await db.select({ payload: technicalSheetVersions.payload }).from(technicalSheetVersions).orderBy(desc(technicalSheetVersions.createdAt), desc(technicalSheetVersions.id)).limit(1);
  return sheet?.payload ?? null;
}

export async function readTechnicalSheetHistory(limit: number): Promise<FichaTecnicaHistoryItem[]> {
  const db = getDatabase();
  if (!db) return [];
  const rows = await db.select({ id: collectionRuns.requestId, finishedAt: collectionRuns.finishedAt, provider: collectionRuns.provider, model: collectionRuns.modelName, brand: vehicleConfigurations.brand, modelName: vehicleConfigurations.model, trim: vehicleConfigurations.trim, modelYear: vehicleConfigurations.modelYear, market: vehicleConfigurations.market, response: technicalSheetVersions.payload }).from(technicalSheetVersions).innerJoin(collectionRuns, eq(technicalSheetVersions.collectionRunId, collectionRuns.id)).innerJoin(vehicleConfigurations, eq(technicalSheetVersions.vehicleConfigurationId, vehicleConfigurations.id)).orderBy(desc(technicalSheetVersions.createdAt), desc(technicalSheetVersions.id)).limit(limit);
  return rows.map((row) => ({ id: row.id, finishedAt: row.finishedAt.toISOString(), provider: asProvider(row.provider), model: row.model, vehicle: { marca: row.brand, modelo: row.modelName, versao: row.trim, ano_modelo: row.modelYear, mercado: row.market }, response: row.response, isValid: true }));
}

function sha256(value: unknown): string { return createHash("sha256").update(JSON.stringify(value)).digest("hex"); }
function resolveModel(provider: LLMProvider): string { if (provider === "claude") return process.env.CLAUDE_MODEL ?? "claude-sonnet-4-5"; if (provider === "openrouter") return process.env.OPENROUTER_MODEL ?? "google/gemini-2.5-flash"; return "mock-response"; }
function asProvider(value: string): LLMProvider { return value === "claude" || value === "openrouter" ? value : "simulated"; }
