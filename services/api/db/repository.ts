import { createHash } from "node:crypto";
import { and, asc, count, desc, eq, ilike, or, sql } from "drizzle-orm";
import { createCatalogSlug, createDeterministicAliases, normalizeCatalogText } from "../catalog";
import { getDatabase } from "./client";
import { auditEvents, collectionRuns, schemaContracts, sources, technicalSheetSources, technicalSheetVersions, usageEvents, vehicleConfigurationAliases, vehicleConfigurations } from "./schema";
import { HttpError, type CatalogCandidate, type CatalogEntryResult, type CatalogSearchResult, type FichaTecnicaHistoryItem, type FichaTecnicaResponse, type VehicleInput } from "../types";
import type { LLMProvider } from "../logger";
import type { AuthContext } from "../authentication";
import type { AuditAction } from "../audit";

const RUNTIME_SCHEMA_PATH = "packages/agent-runtime/assets/schema.json";

interface PersistTechnicalSheetInput {
  requestId: string;
  provider: LLMProvider;
  vehicle: VehicleInput;
  response: FichaTecnicaResponse;
  outputSchema: unknown;
  finalPrompt: string;
  actor?: AuthContext;
  auditAction?: AuditAction;
}

export async function persistTechnicalSheet(input: PersistTechnicalSheetInput): Promise<void> {
  const db = getDatabase();
  if (!db) return;
  await db.transaction(async (tx) => persistTechnicalSheetInTransaction(tx, input));
}

export async function persistTechnicalSheetsAtomically(inputs: PersistTechnicalSheetInput[]): Promise<void> {
  const db = getDatabase();
  if (!db) throw new HttpError(503, "Persistencia PostgreSQL indisponivel.");
  await db.transaction(async (tx) => {
    for (const input of inputs) await persistTechnicalSheetInTransaction(tx, input);
  });
}

export async function persistTechnicalSheetInTransaction(tx: any, input: PersistTechnicalSheetInput): Promise<void> {
  const now = new Date();
  const schemaHash = sha256(input.outputSchema);
  const [vehicle] = await tx.insert(vehicleConfigurations).values({ brand: input.vehicle.marca, model: input.vehicle.modelo, trim: input.vehicle.versao, modelYear: input.vehicle.ano_modelo, market: input.vehicle.mercado, catalogSlug: createCatalogSlug(input.vehicle), updatedAt: now }).onConflictDoUpdate({ target: [vehicleConfigurations.brand, vehicleConfigurations.model, vehicleConfigurations.trim, vehicleConfigurations.modelYear, vehicleConfigurations.market], set: { catalogSlug: createCatalogSlug(input.vehicle), updatedAt: now } }).returning();
  await tx.insert(vehicleConfigurationAliases).values(createDeterministicAliases(input.vehicle).map((alias) => ({ vehicleConfigurationId: vehicle.id, aliasNormalized: alias.normalized, aliasDisplay: alias.display, kind: alias.kind }))).onConflictDoNothing();
  const [schemaContract] = await tx.insert(schemaContracts).values({ sha256: schemaHash, runtimeAssetPath: RUNTIME_SCHEMA_PATH }).onConflictDoUpdate({ target: schemaContracts.sha256, set: { runtimeAssetPath: RUNTIME_SCHEMA_PATH } }).returning();
  const [lastVersion] = await tx.select({ versionNumber: technicalSheetVersions.versionNumber }).from(technicalSheetVersions).where(eq(technicalSheetVersions.vehicleConfigurationId, vehicle.id)).orderBy(desc(technicalSheetVersions.versionNumber)).limit(1);
  const [run] = await tx.insert(collectionRuns).values({ requestId: input.requestId, vehicleConfigurationId: vehicle.id, organizationId: input.actor?.organizationId, accountId: input.actor?.accountId, memberId: input.actor?.memberId, provider: input.provider, modelName: resolveModel(input.provider), status: "succeeded", schemaContractId: schemaContract.id, promptSha256: sha256(input.finalPrompt), startedAt: now, finishedAt: now }).returning();
  const [sheet] = await tx.insert(technicalSheetVersions).values({ collectionRunId: run.id, vehicleConfigurationId: vehicle.id, schemaContractId: schemaContract.id, versionNumber: (lastVersion?.versionNumber ?? 0) + 1, payload: input.response, completenessSummary: input.response.resumo_completude, payloadSha256: sha256(input.response) }).returning();
  if (input.actor) {
    await tx.insert(usageEvents).values({ organizationId: input.actor.organizationId, accountId: input.actor.accountId, memberId: input.actor.memberId, collectionRunId: run.id, action: "technical_sheet_persisted", outcome: "succeeded", units: 1, requestId: input.requestId });
  }
  if (input.actor && input.auditAction) {
    await tx.insert(auditEvents).values({ organizationId: input.actor.organizationId, accountId: input.actor.accountId, memberId: input.actor.memberId, action: input.auditAction, resourceType: "technical_sheet", resourceId: sheet.id, outcome: "allowed", requestId: input.requestId });
  }
  for (const source of input.response.fontes_utilizadas) {
    const [storedSource] = await tx.insert(sources).values({ canonicalUrl: source.url, title: source.titulo, sourceType: source.tipo }).onConflictDoUpdate({ target: sources.canonicalUrl, set: { title: source.titulo, sourceType: source.tipo } }).returning();
    await tx.insert(technicalSheetSources).values({ technicalSheetVersionId: sheet.id, sourceId: storedSource.id, sourceRef: source.id });
  }
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

export async function searchCatalog(input: { query: string; page: number; pageSize: number }): Promise<CatalogSearchResult> {
  const db = requireCatalogDatabase();
  const query = normalizeCatalogText(input.query);
  const like = `%${query}%`;
  const match = query
    ? or(
        ilike(vehicleConfigurations.brand, like),
        ilike(vehicleConfigurations.model, like),
        ilike(vehicleConfigurations.trim, like),
        ilike(vehicleConfigurations.catalogSlug, like),
        sql`exists (select 1 from ${vehicleConfigurationAliases} where ${vehicleConfigurationAliases.vehicleConfigurationId} = ${vehicleConfigurations.id} and ${vehicleConfigurationAliases.aliasNormalized} like ${like})`
      )
    : undefined;
  const latestVersion = sql<number | null>`(select ${technicalSheetVersions.versionNumber} from ${technicalSheetVersions} where ${technicalSheetVersions.vehicleConfigurationId} = ${vehicleConfigurations.id} order by ${technicalSheetVersions.versionNumber} desc limit 1)`;
  const latestAt = sql<Date | null>`(select ${technicalSheetVersions.createdAt} from ${technicalSheetVersions} where ${technicalSheetVersions.vehicleConfigurationId} = ${vehicleConfigurations.id} order by ${technicalSheetVersions.versionNumber} desc limit 1)`;
  const latestTechnicalSheetVersionId = sql<string | null>`(select ${technicalSheetVersions.id} from ${technicalSheetVersions} where ${technicalSheetVersions.vehicleConfigurationId} = ${vehicleConfigurations.id} order by ${technicalSheetVersions.versionNumber} desc, ${technicalSheetVersions.id} desc limit 1)`;
  const where = match ? and(match) : undefined;
  const [{ total }] = await db.select({ total: count() }).from(vehicleConfigurations).where(where);
  const rows = await db.select({ id: vehicleConfigurations.id, slug: vehicleConfigurations.catalogSlug, brand: vehicleConfigurations.brand, model: vehicleConfigurations.model, trim: vehicleConfigurations.trim, modelYear: vehicleConfigurations.modelYear, market: vehicleConfigurations.market, latestVersion, latestAt, latestTechnicalSheetVersionId }).from(vehicleConfigurations).where(where).orderBy(asc(vehicleConfigurations.brand), asc(vehicleConfigurations.model), asc(vehicleConfigurations.trim), asc(vehicleConfigurations.modelYear), asc(vehicleConfigurations.market), asc(vehicleConfigurations.id)).limit(input.pageSize).offset((input.page - 1) * input.pageSize);
  const entries = rows.map((row) => toCatalogCandidate(row));
  return { state: entries.length > 0 ? "found" : "not_registered", page: input.page, pageSize: input.pageSize, total, entries };
}

export async function readCatalogEntryExact(id: string, vehicle: VehicleInput): Promise<CatalogEntryResult> {
  const db = requireCatalogDatabase();
  const [storedById] = await db.select({ id: vehicleConfigurations.id, slug: vehicleConfigurations.catalogSlug, brand: vehicleConfigurations.brand, model: vehicleConfigurations.model, trim: vehicleConfigurations.trim, modelYear: vehicleConfigurations.modelYear, market: vehicleConfigurations.market }).from(vehicleConfigurations).where(eq(vehicleConfigurations.id, id)).limit(1);
  if (!storedById) return { state: "not_registered" };
  if (storedById.brand !== vehicle.marca || storedById.model !== vehicle.modelo || storedById.trim !== vehicle.versao || storedById.modelYear !== vehicle.ano_modelo || storedById.market !== vehicle.mercado) return { state: "incompatible" };
  const [sheet] = await db.select({ versionNumber: technicalSheetVersions.versionNumber, createdAt: technicalSheetVersions.createdAt, payload: technicalSheetVersions.payload }).from(technicalSheetVersions).where(eq(technicalSheetVersions.vehicleConfigurationId, id)).orderBy(desc(technicalSheetVersions.versionNumber), desc(technicalSheetVersions.id)).limit(1);
  if (!sheet) return { state: "not_registered" };
  return { state: "found", entry: { ...toCatalogCandidate({ ...storedById, latestVersion: sheet.versionNumber, latestAt: sheet.createdAt }), response: sheet.payload as FichaTecnicaResponse } };
}

function requireCatalogDatabase() {
  const db = getDatabase();
  if (!db) throw new HttpError(503, "Catalogo requer persistencia PostgreSQL ativa.");
  return db;
}

function toCatalogCandidate(row: { id: string; slug: string; brand: string; model: string; trim: string; modelYear: number; market: string; latestVersion: number | null; latestAt: Date | null; latestTechnicalSheetVersionId?: string | null }): CatalogCandidate {
  return { id: row.id, slug: row.slug, vehicle: { marca: row.brand, modelo: row.model, versao: row.trim, ano_modelo: row.modelYear, mercado: row.market }, latestVersion: row.latestVersion, latestAt: row.latestAt?.toISOString() ?? null, latestTechnicalSheetVersionId: row.latestTechnicalSheetVersionId ?? null };
}

function sha256(value: unknown): string { return createHash("sha256").update(JSON.stringify(value)).digest("hex"); }
function resolveModel(provider: LLMProvider): string { if (provider === "claude") return process.env.CLAUDE_MODEL ?? "claude-sonnet-4-5"; if (provider === "openrouter") return process.env.OPENROUTER_MODEL ?? "google/gemini-2.5-flash"; return "mock-response"; }
function asProvider(value: string): LLMProvider { return value === "claude" || value === "openrouter" ? value : "simulated"; }
