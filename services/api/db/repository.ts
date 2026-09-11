import { createHash } from "node:crypto";
import { and, asc, count, desc, eq, ilike, ne, or, sql } from "drizzle-orm";
import { createCatalogSlug, createDeterministicAliases, normalizeCatalogText } from "../catalog";
import { readTechnicalSearchFacetPolicy, type TechnicalSearchFacetPolicy } from "../runtime-assets";
import { projectTechnicalSearchFacets } from "../technical-search-facets";
import { getDatabase } from "./client";
import { auditEvents, collectionRuns, schemaContracts, sources, technicalSheetSearchFacets, technicalSheetSources, technicalSheetVersions, usageEvents, vehicleConfigurationAliases, vehicleConfigurations } from "./schema";
import { HttpError, type CatalogCandidate, type CatalogEntryResult, type CatalogSearchResult, type FichaTecnicaHistoryItem, type FichaTecnicaResponse, type TechnicalCatalogSearchResult, type TechnicalSearchFilters, type VehicleInput } from "../types";
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
  const facetPolicy = await readTechnicalSearchFacetPolicy();
  await db.transaction(async (tx) => persistTechnicalSheetInTransaction(tx, input, facetPolicy));
}

export async function persistTechnicalSheetsAtomically(inputs: PersistTechnicalSheetInput[]): Promise<void> {
  const db = getDatabase();
  if (!db) throw new HttpError(503, "Persistencia PostgreSQL indisponivel.");
  const facetPolicy = await readTechnicalSearchFacetPolicy();
  await db.transaction(async (tx) => {
    for (const input of inputs) await persistTechnicalSheetInTransaction(tx, input, facetPolicy);
  });
}

export async function persistTechnicalSheetInTransaction(tx: any, input: PersistTechnicalSheetInput, facetPolicy: TechnicalSearchFacetPolicy): Promise<void> {
  const now = new Date();
  const schemaHash = sha256(input.outputSchema);
  const [vehicle] = await tx.insert(vehicleConfigurations).values({ brand: input.vehicle.marca, model: input.vehicle.modelo, trim: input.vehicle.versao, modelYear: input.vehicle.ano_modelo, market: input.vehicle.mercado, catalogSlug: createCatalogSlug(input.vehicle), updatedAt: now }).onConflictDoUpdate({ target: [vehicleConfigurations.brand, vehicleConfigurations.model, vehicleConfigurations.trim, vehicleConfigurations.modelYear, vehicleConfigurations.market], set: { catalogSlug: createCatalogSlug(input.vehicle), updatedAt: now } }).returning();
  await tx.insert(vehicleConfigurationAliases).values(createDeterministicAliases(input.vehicle).map((alias) => ({ vehicleConfigurationId: vehicle.id, aliasNormalized: alias.normalized, aliasDisplay: alias.display, kind: alias.kind }))).onConflictDoNothing();
  const [schemaContract] = await tx.insert(schemaContracts).values({ sha256: schemaHash, runtimeAssetPath: RUNTIME_SCHEMA_PATH }).onConflictDoUpdate({ target: schemaContracts.sha256, set: { runtimeAssetPath: RUNTIME_SCHEMA_PATH } }).returning();
  const [lastVersion] = await tx.select({ versionNumber: technicalSheetVersions.versionNumber }).from(technicalSheetVersions).where(eq(technicalSheetVersions.vehicleConfigurationId, vehicle.id)).orderBy(desc(technicalSheetVersions.versionNumber)).limit(1);
  const [run] = await tx.insert(collectionRuns).values({ requestId: input.requestId, vehicleConfigurationId: vehicle.id, organizationId: input.actor?.organizationId, accountId: input.actor?.accountId, memberId: input.actor?.memberId, provider: input.provider, modelName: resolveModel(input.provider), status: "succeeded", schemaContractId: schemaContract.id, promptSha256: sha256(input.finalPrompt), startedAt: now, finishedAt: now }).returning();
  const [sheet] = await tx.insert(technicalSheetVersions).values({ collectionRunId: run.id, vehicleConfigurationId: vehicle.id, schemaContractId: schemaContract.id, versionNumber: (lastVersion?.versionNumber ?? 0) + 1, payload: input.response, completenessSummary: input.response.resumo_completude, payloadSha256: sha256(input.response) }).returning();
  const facets = projectTechnicalSearchFacets(input.response, facetPolicy);
  if (facets.length > 0) {
    await tx.insert(technicalSheetSearchFacets).values(facets.map((facet) => ({
      technicalSheetVersionId: sheet.id,
      vehicleConfigurationId: vehicle.id,
      facetKey: facet.facetKey,
      valueText: facet.valueText,
      valueNumber: facet.valueNumber,
      unit: facet.unit,
      sourceRefs: facet.sourceRefs,
      policyVersion: facet.policyVersion
    })));
  }
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

export async function readTechnicalSheetExport(versionId: string): Promise<unknown | null> {
  const db = requireCatalogDatabase();
  const [row] = await db.select({ id: technicalSheetVersions.id, versionNumber: technicalSheetVersions.versionNumber, createdAt: technicalSheetVersions.createdAt, payload: technicalSheetVersions.payload, brand: vehicleConfigurations.brand, model: vehicleConfigurations.model, trim: vehicleConfigurations.trim, modelYear: vehicleConfigurations.modelYear, market: vehicleConfigurations.market }).from(technicalSheetVersions).innerJoin(vehicleConfigurations, eq(technicalSheetVersions.vehicleConfigurationId, vehicleConfigurations.id)).where(eq(technicalSheetVersions.id, versionId)).limit(1);
  if (!row) return null;
  const payload = row.payload as FichaTecnicaResponse;
  return { export_contract_version: "technical-export-v1", kind: "technical_sheet", generated_at: new Date().toISOString(), technical_sheet: { version_id: row.id, version_number: row.versionNumber, generated_at: row.createdAt.toISOString(), vehicle: { marca: row.brand, modelo: row.model, versao: row.trim, ano_modelo: row.modelYear, mercado: row.market }, completeness: payload.resumo_completude, data: payload.ficha_tecnica, sources: payload.fontes_utilizadas } };
}

export async function readTechnicalSheetHistory(limit: number): Promise<FichaTecnicaHistoryItem[]> {
  const db = getDatabase();
  if (!db) return [];
  const rows = await db.select({ id: collectionRuns.requestId, finishedAt: collectionRuns.finishedAt, provider: collectionRuns.provider, model: collectionRuns.modelName, brand: vehicleConfigurations.brand, modelName: vehicleConfigurations.model, trim: vehicleConfigurations.trim, modelYear: vehicleConfigurations.modelYear, market: vehicleConfigurations.market, response: technicalSheetVersions.payload }).from(technicalSheetVersions).innerJoin(collectionRuns, eq(technicalSheetVersions.collectionRunId, collectionRuns.id)).innerJoin(vehicleConfigurations, eq(technicalSheetVersions.vehicleConfigurationId, vehicleConfigurations.id)).orderBy(desc(technicalSheetVersions.createdAt), desc(technicalSheetVersions.id)).limit(limit);
  return rows.map((row) => ({ id: row.id, finishedAt: row.finishedAt.toISOString(), provider: asProvider(row.provider), model: row.model, vehicle: { marca: row.brand, modelo: row.modelName, versao: row.trim, ano_modelo: row.modelYear, mercado: row.market }, response: row.response, isValid: true }));
}

export async function searchCatalog(input: { query: string; page: number; pageSize: number; sort: "recent" | "alphabetical"; scope: "latest" | "all_versions"; brand?: string; model?: string; modelYear?: number; market?: string }): Promise<CatalogSearchResult> {
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
  const filters = [
    match,
    input.brand ? sql`lower(${vehicleConfigurations.brand}) = lower(${input.brand})` : undefined,
    input.model ? sql`lower(${vehicleConfigurations.model}) = lower(${input.model})` : undefined,
    input.modelYear ? eq(vehicleConfigurations.modelYear, input.modelYear) : undefined,
    input.market ? sql`lower(${vehicleConfigurations.market}) = lower(${input.market})` : undefined
  ].filter(Boolean);
  const where = and(...filters);
  if (input.scope === "all_versions") {
    const [{ total }] = await db.select({ total: count() }).from(technicalSheetVersions).innerJoin(vehicleConfigurations, eq(technicalSheetVersions.vehicleConfigurationId, vehicleConfigurations.id)).where(where);
    const alphabeticalOrder = [asc(vehicleConfigurations.brand), asc(vehicleConfigurations.model), asc(vehicleConfigurations.trim), asc(vehicleConfigurations.modelYear), asc(vehicleConfigurations.market), desc(technicalSheetVersions.versionNumber), desc(technicalSheetVersions.id)];
    const order = input.sort === "recent" ? [desc(technicalSheetVersions.createdAt), ...alphabeticalOrder] : alphabeticalOrder;
    const rows = await db.select({ id: vehicleConfigurations.id, slug: vehicleConfigurations.catalogSlug, brand: vehicleConfigurations.brand, model: vehicleConfigurations.model, trim: vehicleConfigurations.trim, modelYear: vehicleConfigurations.modelYear, market: vehicleConfigurations.market, latestVersion: technicalSheetVersions.versionNumber, latestAt: technicalSheetVersions.createdAt, latestTechnicalSheetVersionId: technicalSheetVersions.id }).from(technicalSheetVersions).innerJoin(vehicleConfigurations, eq(technicalSheetVersions.vehicleConfigurationId, vehicleConfigurations.id)).where(where).orderBy(...order).limit(input.pageSize).offset((input.page - 1) * input.pageSize);
    const entries = rows.map((row) => toCatalogCandidate(row));
    return { state: entries.length > 0 ? "found" : "not_registered", scope: input.scope, page: input.page, pageSize: input.pageSize, total, entries };
  }
  const { latestVersion, latestAt, latestTechnicalSheetVersionId } = latestTechnicalSheetFields();
  const latestWhere = and(where, sql`exists (select 1 from ${technicalSheetVersions} where ${technicalSheetVersions.vehicleConfigurationId} = ${vehicleConfigurations.id})`);
  const [{ total }] = await db.select({ total: count() }).from(vehicleConfigurations).where(latestWhere);
  const alphabeticalOrder = [asc(vehicleConfigurations.brand), asc(vehicleConfigurations.model), asc(vehicleConfigurations.trim), asc(vehicleConfigurations.modelYear), asc(vehicleConfigurations.market), asc(vehicleConfigurations.id)];
  const order = input.sort === "recent" ? [desc(latestAt), ...alphabeticalOrder] : alphabeticalOrder;
  const rows = await db.select({ id: vehicleConfigurations.id, slug: vehicleConfigurations.catalogSlug, brand: vehicleConfigurations.brand, model: vehicleConfigurations.model, trim: vehicleConfigurations.trim, modelYear: vehicleConfigurations.modelYear, market: vehicleConfigurations.market, latestVersion, latestAt, latestTechnicalSheetVersionId }).from(vehicleConfigurations).where(latestWhere).orderBy(...order).limit(input.pageSize).offset((input.page - 1) * input.pageSize);
  const entries = rows.map((row) => toCatalogCandidate(row));
  return { state: entries.length > 0 ? "found" : "not_registered", scope: input.scope, page: input.page, pageSize: input.pageSize, total, entries };
}

export async function searchTechnicalCatalog(input: TechnicalSearchFilters & { page: number; pageSize: number }): Promise<TechnicalCatalogSearchResult> {
  const db = requireCatalogDatabase();
  const { latestVersion, latestAt, latestTechnicalSheetVersionId } = latestTechnicalSheetFields();
  const hasFacet = (facetKey: "tipo_carroceria" | "motor_tipo" | "potencia_cv", clause: ReturnType<typeof sql>) => sql`exists (select 1 from ${technicalSheetSearchFacets} where ${technicalSheetSearchFacets.technicalSheetVersionId} = (${latestTechnicalSheetVersionId}) and ${technicalSheetSearchFacets.facetKey} = ${facetKey} and ${clause})`;
  const filters = [
    input.tipoCarroceria ? hasFacet("tipo_carroceria", sql`${technicalSheetSearchFacets.valueText} = ${input.tipoCarroceria}`) : undefined,
    input.motorTipo ? hasFacet("motor_tipo", sql`${technicalSheetSearchFacets.valueText} = ${input.motorTipo}`) : undefined,
    input.potenciaMinCv !== undefined ? hasFacet("potencia_cv", sql`${technicalSheetSearchFacets.valueNumber} >= ${input.potenciaMinCv}`) : undefined,
    input.potenciaMaxCv !== undefined ? hasFacet("potencia_cv", sql`${technicalSheetSearchFacets.valueNumber} <= ${input.potenciaMaxCv}`) : undefined,
    input.modelYear ? eq(vehicleConfigurations.modelYear, input.modelYear) : undefined,
    input.market ? sql`lower(${vehicleConfigurations.market}) = lower(${input.market})` : undefined
  ].filter(Boolean);
  const where = and(...filters);
  const [{ total }] = await db.select({ total: count() }).from(vehicleConfigurations).where(where);
  const rows = await db.select({ id: vehicleConfigurations.id, slug: vehicleConfigurations.catalogSlug, brand: vehicleConfigurations.brand, model: vehicleConfigurations.model, trim: vehicleConfigurations.trim, modelYear: vehicleConfigurations.modelYear, market: vehicleConfigurations.market, latestVersion, latestAt, latestTechnicalSheetVersionId }).from(vehicleConfigurations).where(where).orderBy(asc(vehicleConfigurations.brand), asc(vehicleConfigurations.model), asc(vehicleConfigurations.trim), asc(vehicleConfigurations.modelYear), asc(vehicleConfigurations.market), asc(vehicleConfigurations.id)).limit(input.pageSize).offset((input.page - 1) * input.pageSize);
  const { page, pageSize, ...appliedFilters } = input;
  const entries = rows.map((row) => toCatalogCandidate(row));
  return { state: entries.length > 0 ? "found" : "not_registered", scope: "latest", page, pageSize, total, entries, appliedFilters };
}

export async function readCatalogRecommendations(id: string, vehicle: VehicleInput): Promise<{ state: "found"; entries: CatalogCandidate[] } | { state: "not_registered" } | { state: "incompatible" }> {
  const db = requireCatalogDatabase();
  const [stored] = await db.select({ id: vehicleConfigurations.id, brand: vehicleConfigurations.brand, model: vehicleConfigurations.model, trim: vehicleConfigurations.trim, modelYear: vehicleConfigurations.modelYear, market: vehicleConfigurations.market }).from(vehicleConfigurations).where(eq(vehicleConfigurations.id, id)).limit(1);
  if (!stored) return { state: "not_registered" };
  if (stored.brand !== vehicle.marca || stored.model !== vehicle.modelo || stored.trim !== vehicle.versao || stored.modelYear !== vehicle.ano_modelo || stored.market !== vehicle.mercado) return { state: "incompatible" };
  const { latestVersion, latestAt, latestTechnicalSheetVersionId } = latestTechnicalSheetFields();
  const where = and(eq(vehicleConfigurations.brand, stored.brand), eq(vehicleConfigurations.model, stored.model), eq(vehicleConfigurations.modelYear, stored.modelYear), eq(vehicleConfigurations.market, stored.market), ne(vehicleConfigurations.id, stored.id), sql`exists (select 1 from ${technicalSheetVersions} where ${technicalSheetVersions.vehicleConfigurationId} = ${vehicleConfigurations.id})`);
  const rows = await db.select({ id: vehicleConfigurations.id, slug: vehicleConfigurations.catalogSlug, brand: vehicleConfigurations.brand, model: vehicleConfigurations.model, trim: vehicleConfigurations.trim, modelYear: vehicleConfigurations.modelYear, market: vehicleConfigurations.market, latestVersion, latestAt, latestTechnicalSheetVersionId }).from(vehicleConfigurations).where(where).orderBy(desc(latestAt), asc(vehicleConfigurations.trim), asc(vehicleConfigurations.id)).limit(6);
  return { state: "found", entries: rows.map((row) => toCatalogCandidate(row)) };
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

function latestTechnicalSheetFields() {
  return {
    latestVersion: sql<number | null>`(select "latest_technical_sheet"."version_number" from "technical_sheet_versions" as "latest_technical_sheet" where "latest_technical_sheet"."vehicle_configuration_id" = "vehicle_configurations"."id" order by "latest_technical_sheet"."version_number" desc limit 1)`,
    latestAt: sql<Date | null>`(select "latest_technical_sheet"."created_at" from "technical_sheet_versions" as "latest_technical_sheet" where "latest_technical_sheet"."vehicle_configuration_id" = "vehicle_configurations"."id" order by "latest_technical_sheet"."version_number" desc limit 1)`,
    latestTechnicalSheetVersionId: sql<string | null>`(select "latest_technical_sheet"."id" from "technical_sheet_versions" as "latest_technical_sheet" where "latest_technical_sheet"."vehicle_configuration_id" = "vehicle_configurations"."id" order by "latest_technical_sheet"."version_number" desc, "latest_technical_sheet"."id" desc limit 1)`
  };
}

function toCatalogCandidate(row: { id: string; slug: string; brand: string; model: string; trim: string; modelYear: number; market: string; latestVersion: number | null; latestAt: Date | string | null; latestTechnicalSheetVersionId?: string | null }): CatalogCandidate {
  return { id: row.id, slug: row.slug, vehicle: { marca: row.brand, modelo: row.model, versao: row.trim, ano_modelo: row.modelYear, mercado: row.market }, latestVersion: row.latestVersion, latestAt: row.latestAt ? new Date(row.latestAt).toISOString() : null, latestTechnicalSheetVersionId: row.latestTechnicalSheetVersionId ?? null };
}

function sha256(value: unknown): string { return createHash("sha256").update(JSON.stringify(value)).digest("hex"); }
function resolveModel(provider: LLMProvider): string { if (provider === "claude") return process.env.CLAUDE_MODEL ?? "claude-sonnet-4-5"; if (provider === "openrouter") return process.env.OPENROUTER_MODEL ?? "google/gemini-2.5-flash"; return "mock-response"; }
function asProvider(value: string): LLMProvider { return value === "claude" || value === "openrouter" ? value : "simulated"; }
