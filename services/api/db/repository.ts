import { createHash } from "node:crypto";
import { and, asc, count, desc, eq, ilike, inArray, ne, or, sql } from "drizzle-orm";
import { createCatalogSlug, createDeterministicAliases, normalizeCatalogText } from "../catalog";
import { readFieldStatePolicy, readTechnicalSearchFacetPolicy, readTechnicalSheetGovernancePolicy, type TechnicalSearchFacetPolicy } from "../runtime-assets";
import { projectFieldState } from "../field-state";
import { readManualTags, readPrimarySheetId } from "../technical-sheet-governance";
import { projectTechnicalSearchFacets } from "../technical-search-facets";
import { getDatabase } from "./client";
import { auditEvents, collectionRuns, fieldEvidence, fieldResolutionAlternatives, fieldResolutions, schemaContracts, sources, technicalSheets, technicalSheetSearchFacets, technicalSheetSources, technicalSheetVersions, usageEvents, vehicleConfigurationAliases, vehicleConfigurations } from "./schema";
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
  technicalSheetId?: string;
  expectedBaseRevisionId?: string;
}

export async function persistTechnicalSheet(input: PersistTechnicalSheetInput): Promise<void> {
  const db = getDatabase();
  if (!db) return;
  const [facetPolicy, fieldStatePolicy] = await Promise.all([readTechnicalSearchFacetPolicy(), readFieldStatePolicy()]);
  await db.transaction(async (tx) => persistTechnicalSheetInTransaction(tx, input, facetPolicy, fieldStatePolicy));
}

export async function persistTechnicalSheetsAtomically(inputs: PersistTechnicalSheetInput[]): Promise<void> {
  const db = getDatabase();
  if (!db) throw new HttpError(503, "Persistencia PostgreSQL indisponivel.");
  const [facetPolicy, fieldStatePolicy] = await Promise.all([readTechnicalSearchFacetPolicy(), readFieldStatePolicy()]);
  await db.transaction(async (tx) => {
    for (const input of inputs) await persistTechnicalSheetInTransaction(tx, input, facetPolicy, fieldStatePolicy);
  });
}

export async function persistTechnicalSheetInTransaction(tx: any, input: PersistTechnicalSheetInput, facetPolicy: TechnicalSearchFacetPolicy, fieldStatePolicy: Awaited<ReturnType<typeof readFieldStatePolicy>>): Promise<void> {
  if (!input.actor) throw new HttpError(401, "Sessao indisponivel.");
  const now = new Date();
  const schemaHash = sha256(input.outputSchema);
  const [vehicle] = await tx.insert(vehicleConfigurations).values({ brand: input.vehicle.marca, model: input.vehicle.modelo, trim: input.vehicle.versao, modelYear: input.vehicle.ano_modelo, market: input.vehicle.mercado, catalogSlug: createCatalogSlug(input.vehicle), updatedAt: now }).onConflictDoUpdate({ target: [vehicleConfigurations.brand, vehicleConfigurations.model, vehicleConfigurations.trim, vehicleConfigurations.modelYear, vehicleConfigurations.market], set: { catalogSlug: createCatalogSlug(input.vehicle), updatedAt: now } }).returning();
  await tx.insert(vehicleConfigurationAliases).values(createDeterministicAliases(input.vehicle).map((alias) => ({ vehicleConfigurationId: vehicle.id, aliasNormalized: alias.normalized, aliasDisplay: alias.display, kind: alias.kind }))).onConflictDoNothing();
  const [schemaContract] = await tx.insert(schemaContracts).values({ sha256: schemaHash, runtimeAssetPath: RUNTIME_SCHEMA_PATH }).onConflictDoUpdate({ target: schemaContracts.sha256, set: { runtimeAssetPath: RUNTIME_SCHEMA_PATH } }).returning();
  let [technicalSheet] = await tx.select().from(technicalSheets).where(input.technicalSheetId ? and(eq(technicalSheets.id, input.technicalSheetId), eq(technicalSheets.vehicleConfigurationId, vehicle.id), eq(technicalSheets.organizationId, input.actor.organizationId), eq(technicalSheets.state, "active")) : and(eq(technicalSheets.vehicleConfigurationId, vehicle.id), eq(technicalSheets.organizationId, input.actor.organizationId), eq(technicalSheets.state, "active"), eq(technicalSheets.isDefault, true))).orderBy(asc(technicalSheets.createdAt)).limit(1);
  if (!technicalSheet && input.technicalSheetId) throw new HttpError(409, "Ficha tecnica indisponivel para persistencia.");
  if (!technicalSheet) {
    await tx.update(technicalSheets).set({ isDefault: false, updatedAt: now }).where(and(eq(technicalSheets.vehicleConfigurationId, vehicle.id), eq(technicalSheets.organizationId, input.actor.organizationId), eq(technicalSheets.isDefault, true), sql`${technicalSheets.state} <> 'active'`));
    const created = await tx.insert(technicalSheets).values({ vehicleConfigurationId: vehicle.id, organizationId: input.actor.organizationId, createdByMemberId: input.actor.memberId, state: "active", isDefault: true, updatedAt: now }).onConflictDoNothing().returning();
    technicalSheet = created[0] ?? (await tx.select().from(technicalSheets).where(and(eq(technicalSheets.vehicleConfigurationId, vehicle.id), eq(technicalSheets.organizationId, input.actor.organizationId), eq(technicalSheets.state, "active"), eq(technicalSheets.isDefault, true))).orderBy(asc(technicalSheets.createdAt)).limit(1))[0];
  }
  if (!technicalSheet) throw new HttpError(409, "Ficha tecnica indisponivel para persistencia.");
  await tx.execute(sql`select "id" from "technical_sheets" where "id" = ${technicalSheet.id} for update`);
  if (input.expectedBaseRevisionId) { const [latest] = await tx.select({ id: technicalSheetVersions.id }).from(technicalSheetVersions).where(eq(technicalSheetVersions.technicalSheetId, technicalSheet.id)).orderBy(desc(technicalSheetVersions.createdAt), desc(technicalSheetVersions.id)).limit(1); if (!latest || latest.id !== input.expectedBaseRevisionId) throw new HttpError(409, "Revisao-base desatualizada."); }
  const [lastVersion] = await tx.select({ versionNumber: technicalSheetVersions.versionNumber }).from(technicalSheetVersions).where(eq(technicalSheetVersions.technicalSheetId, technicalSheet.id)).orderBy(desc(technicalSheetVersions.versionNumber)).limit(1);
  const [run] = await tx.insert(collectionRuns).values({ requestId: input.requestId, vehicleConfigurationId: vehicle.id, technicalSheetId: technicalSheet.id, organizationId: input.actor.organizationId, accountId: input.actor.accountId, memberId: input.actor.memberId, provider: input.provider, modelName: resolveModel(input.provider), status: "succeeded", schemaContractId: schemaContract.id, promptSha256: sha256(input.finalPrompt), startedAt: now, finishedAt: now }).returning();
  const [sheet] = await tx.insert(technicalSheetVersions).values({ collectionRunId: run.id, technicalSheetId: technicalSheet.id, vehicleConfigurationId: vehicle.id, schemaContractId: schemaContract.id, versionNumber: (lastVersion?.versionNumber ?? 0) + 1, payload: input.response, completenessSummary: input.response.resumo_completude, payloadSha256: sha256(input.response) }).returning();
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
  const sourceIds = new Map<string, string>();
  for (const source of input.response.fontes_utilizadas) {
    const [storedSource] = await tx.insert(sources).values({ canonicalUrl: source.url, title: source.titulo, sourceType: source.tipo }).onConflictDoUpdate({ target: sources.canonicalUrl, set: { title: source.titulo, sourceType: source.tipo } }).returning();
    await tx.insert(technicalSheetSources).values({ technicalSheetVersionId: sheet.id, sourceId: storedSource.id, sourceRef: source.id });
    sourceIds.set(source.id, storedSource.id);
  }
  for (const field of flattenFieldResolutions(input.response.ficha_tecnica)) {
    const state = projectFieldState(field.value, fieldStatePolicy);
    const [resolution] = await tx.insert(fieldResolutions).values({ technicalSheetVersionId: sheet.id, path: field.path, value: field.value.valor ?? null, status: field.value.status ?? "unknown", stateVersion: state.stateVersion, resolutionState: state.state, explanationReasons: state.reasonCodes, evidenceRefs: field.value.fonte_ref ?? [], resolutionKind: field.value.status === "conflitante" ? "conflict_preserved" : field.value.status === "nao_encontrado" || field.value.status === "nao_aplicavel" ? "unknown_preserved" : "published" }).returning({ id: fieldResolutions.id });
    const alternatives = Array.isArray(field.value.alternativas) ? field.value.alternativas.filter((alternative: unknown): alternative is Record<string, unknown> => Boolean(alternative) && typeof alternative === "object" && !Array.isArray(alternative)) : [];
    if (resolution && alternatives.length) await tx.insert(fieldResolutionAlternatives).values(alternatives.map((alternative, ordinal) => ({ fieldResolutionId: resolution.id, ordinal: ordinal + 1, value: alternative.valor ?? null, evidenceRefs: Array.isArray(alternative.fonte_ref) ? alternative.fonte_ref : [] })));
    const refs = Array.isArray(field.value.fonte_ref) ? field.value.fonte_ref : [];
    const evidence = refs.flatMap((sourceRef) => { const sourceId = sourceIds.get(sourceRef); return sourceId ? [{ technicalSheetVersionId: sheet.id, sourceId, sourceRef, path: field.path, observationMethod: "published_response", observedAt: now }] : []; });
    if (evidence.length) await tx.insert(fieldEvidence).values(evidence).onConflictDoNothing();
  }
}

function flattenFieldResolutions(root: Record<string, unknown>): Array<{ path: string; value: Record<string, any> }> { const result: Array<{ path: string; value: Record<string, any> }> = []; const visit = (value: unknown, path: string) => { if (!value || typeof value !== "object" || Array.isArray(value)) return; const record = value as Record<string, any>; if ("status" in record || "valor" in record) { result.push({ path, value: record }); return; } for (const [key, nested] of Object.entries(record)) visit(nested, path ? `${path}.${key}` : key); }; visit(root, ""); return result; }

export async function readLatestTechnicalSheet(actor: AuthContext): Promise<unknown | null> {
  const db = getDatabase();
  if (!db) return null;
  const [sheet] = await db.select({ payload: technicalSheetVersions.payload }).from(technicalSheetVersions).innerJoin(collectionRuns, eq(technicalSheetVersions.collectionRunId, collectionRuns.id)).where(eq(collectionRuns.organizationId, actor.organizationId)).orderBy(desc(technicalSheetVersions.createdAt), desc(technicalSheetVersions.id)).limit(1);
  return sheet?.payload ?? null;
}

export async function readTechnicalSheetExport(versionId: string, actor: AuthContext): Promise<unknown | null> {
  const db = requireCatalogDatabase();
  const [row] = await db.select({ id: technicalSheetVersions.id, versionNumber: technicalSheetVersions.versionNumber, createdAt: technicalSheetVersions.createdAt, payload: technicalSheetVersions.payload, brand: vehicleConfigurations.brand, model: vehicleConfigurations.model, trim: vehicleConfigurations.trim, modelYear: vehicleConfigurations.modelYear, market: vehicleConfigurations.market }).from(technicalSheetVersions).innerJoin(collectionRuns, eq(technicalSheetVersions.collectionRunId, collectionRuns.id)).innerJoin(vehicleConfigurations, eq(technicalSheetVersions.vehicleConfigurationId, vehicleConfigurations.id)).where(and(eq(technicalSheetVersions.id, versionId), eq(collectionRuns.organizationId, actor.organizationId))).limit(1);
  if (!row) return null;
  const payload = row.payload as FichaTecnicaResponse;
  return { export_contract_version: "technical-export-v1", kind: "technical_sheet", generated_at: new Date().toISOString(), technical_sheet: { version_id: row.id, version_number: row.versionNumber, generated_at: row.createdAt.toISOString(), vehicle: { marca: row.brand, modelo: row.model, versao: row.trim, ano_modelo: row.modelYear, mercado: row.market }, completeness: payload.resumo_completude, data: payload.ficha_tecnica, sources: payload.fontes_utilizadas } };
}

export async function readTechnicalSheetHistory(limit: number, actor: AuthContext): Promise<FichaTecnicaHistoryItem[]> {
  const db = getDatabase();
  if (!db) return [];
  const rows = await db.select({ id: collectionRuns.requestId, finishedAt: collectionRuns.finishedAt, provider: collectionRuns.provider, model: collectionRuns.modelName, brand: vehicleConfigurations.brand, modelName: vehicleConfigurations.model, trim: vehicleConfigurations.trim, modelYear: vehicleConfigurations.modelYear, market: vehicleConfigurations.market, response: technicalSheetVersions.payload }).from(technicalSheetVersions).innerJoin(collectionRuns, eq(technicalSheetVersions.collectionRunId, collectionRuns.id)).innerJoin(vehicleConfigurations, eq(technicalSheetVersions.vehicleConfigurationId, vehicleConfigurations.id)).where(eq(collectionRuns.organizationId, actor.organizationId)).orderBy(desc(technicalSheetVersions.createdAt), desc(technicalSheetVersions.id)).limit(limit);
  return rows.map((row) => ({ id: row.id, finishedAt: row.finishedAt.toISOString(), provider: asProvider(row.provider), model: row.model, vehicle: { marca: row.brand, modelo: row.modelName, versao: row.trim, ano_modelo: row.modelYear, mercado: row.market }, response: row.response, isValid: true }));
}

export async function listOrganizationVehicleWorkspaces(actor: AuthContext): Promise<Array<{ id: string; marca: string; modelo: string; versao: string; ano_modelo: number; mercado: string; technical_sheet_count: number }>> {
  const db = getDatabase();
  if (!db) throw new HttpError(503, "Persistencia PostgreSQL indisponivel.");
  const rows = await db.select({
    id: vehicleConfigurations.id,
    brand: vehicleConfigurations.brand,
    model: vehicleConfigurations.model,
    trim: vehicleConfigurations.trim,
    modelYear: vehicleConfigurations.modelYear,
    market: vehicleConfigurations.market
  }).from(technicalSheets).innerJoin(vehicleConfigurations, eq(technicalSheets.vehicleConfigurationId, vehicleConfigurations.id)).where(eq(technicalSheets.organizationId, actor.organizationId)).orderBy(asc(vehicleConfigurations.brand), asc(vehicleConfigurations.model), asc(vehicleConfigurations.trim), asc(vehicleConfigurations.modelYear), asc(vehicleConfigurations.market));
  const grouped = new Map<string, { id: string; marca: string; modelo: string; versao: string; ano_modelo: number; mercado: string; technical_sheet_count: number }>();
  for (const row of rows) {
    const current = grouped.get(row.id);
    if (current) current.technical_sheet_count += 1;
    else grouped.set(row.id, { id: row.id, marca: row.brand, modelo: row.model, versao: row.trim, ano_modelo: row.modelYear, mercado: row.market, technical_sheet_count: 1 });
  }
  return [...grouped.values()];
}

export async function readVehicleWorkspace(vehicleConfigurationId: string, actor: AuthContext): Promise<unknown | null> {
  const db = getDatabase();
  if (!db) throw new HttpError(503, "Persistencia PostgreSQL indisponivel.");
  const [vehicle] = await db.select({ id: vehicleConfigurations.id, brand: vehicleConfigurations.brand, model: vehicleConfigurations.model, trim: vehicleConfigurations.trim, modelYear: vehicleConfigurations.modelYear, market: vehicleConfigurations.market }).from(vehicleConfigurations).where(eq(vehicleConfigurations.id, vehicleConfigurationId)).limit(1);
  if (!vehicle) return null;

  const sheets = await db.select({ id: technicalSheets.id, state: technicalSheets.state, isDefault: technicalSheets.isDefault, createdAt: technicalSheets.createdAt, originRevisionId: technicalSheets.originRevisionId }).from(technicalSheets).where(and(eq(technicalSheets.vehicleConfigurationId, vehicle.id), eq(technicalSheets.organizationId, actor.organizationId))).orderBy(desc(technicalSheets.createdAt), desc(technicalSheets.id));
  const sheetIds = sheets.map((sheet) => sheet.id);
  const versions = sheetIds.length === 0 ? [] : await db.select({ sheetId: technicalSheetVersions.technicalSheetId, id: technicalSheetVersions.id, versionNumber: technicalSheetVersions.versionNumber, createdAt: technicalSheetVersions.createdAt, completenessSummary: technicalSheetVersions.completenessSummary }).from(technicalSheetVersions).innerJoin(collectionRuns, eq(technicalSheetVersions.collectionRunId, collectionRuns.id)).where(and(inArray(technicalSheetVersions.technicalSheetId, sheetIds), eq(collectionRuns.organizationId, actor.organizationId))).orderBy(desc(technicalSheetVersions.createdAt), desc(technicalSheetVersions.id));
  const latestRevisionBySheet = new Map<string, typeof versions[number]>();
  for (const version of versions) if (version.sheetId && !latestRevisionBySheet.has(version.sheetId)) latestRevisionBySheet.set(version.sheetId, version);
  const [manualTags, primaryId, governancePolicy] = await Promise.all([readManualTags(sheetIds, actor), readPrimarySheetId(vehicle.id, actor), readTechnicalSheetGovernancePolicy()]);
  const canWrite = actor.role === "analyst" || actor.role === "admin";

  return {
    workspace_contract_version: "vehicle-workspace-v2",
    vehicle: { id: vehicle.id, marca: vehicle.brand, modelo: vehicle.model, versao: vehicle.trim, ano_modelo: vehicle.modelYear, mercado: vehicle.market },
    latest_kind: "temporal",
    recommended: { state: "not_available", reason: "selection_policy_not_configured" },
    primary: primaryId ? { technical_sheet_id: primaryId, scope: "organization" } : null,
    available_actions: { create_sheet: canWrite, continue_research: canWrite, manage_primary: actor.role === "admin", manage_lifecycle: actor.role === "admin" },
    sheets: sheets.map((sheet) => {
      const latest = latestRevisionBySheet.get(sheet.id);
      const summary = latest?.completenessSummary && typeof latest.completenessSummary === "object" ? latest.completenessSummary as Record<string, unknown> : {};
      const ageDays = latest ? Math.max(0, (Date.now() - latest.createdAt.getTime()) / 86400000) : null;
      const derivedTags = [
        ...(versions[0]?.sheetId === sheet.id ? [{ tag: "latest", origin: "derived", reason: "latest_revision_temporal" }] : []),
        ...(sheet.state === "archived" ? [{ tag: "archived", origin: "derived", reason: "lifecycle_archived" }] : []),
        ...(typeof summary.conflitantes === "number" && summary.conflitantes > 0 ? [{ tag: "has_conflicts", origin: "derived", reason: "conflicts_preserved" }] : []),
        ...(typeof summary.nao_encontradas === "number" && summary.nao_encontradas > 0 ? [{ tag: "incomplete", origin: "derived", reason: "missing_fields" }] : []),
        ...(ageDays !== null && ageDays > governancePolicy.staleAfterDays ? [{ tag: "outdated", origin: "derived", reason: "freshness_policy" }] : [])
      ];
      return { id: sheet.id, state: sheet.state, is_default: sheet.isDefault, is_primary: primaryId === sheet.id, origin_revision_id: sheet.originRevisionId, created_at: sheet.createdAt.toISOString(), tags: [...derivedTags, ...(manualTags.get(sheet.id) ?? [])], latest_revision: latest ? { id: latest.id, number: latest.versionNumber, created_at: latest.createdAt.toISOString() } : null };
    })
  };
}

export async function createWorkspaceSheet(vehicleConfigurationId: string, actor: AuthContext, fromRevisionId?: string): Promise<{ id: string; vehicle_configuration_id: string; origin_revision_id: string | null }> {
  const db = getDatabase();
  if (!db) throw new HttpError(503, "Persistencia PostgreSQL indisponivel.");
  const [vehicle] = await db.select({ id: vehicleConfigurations.id }).from(vehicleConfigurations).where(eq(vehicleConfigurations.id, vehicleConfigurationId)).limit(1);
  if (!vehicle) throw new HttpError(404, "Configuracao indisponivel.");
  if (fromRevisionId) {
    const [base] = await db.select({ id: technicalSheetVersions.id }).from(technicalSheetVersions).innerJoin(collectionRuns, eq(technicalSheetVersions.collectionRunId, collectionRuns.id)).where(and(eq(technicalSheetVersions.id, fromRevisionId), eq(collectionRuns.organizationId, actor.organizationId))).limit(1);
    if (!base) throw new HttpError(404, "Revisao indisponivel.");
  }
  const [created] = await db.insert(technicalSheets).values({ vehicleConfigurationId, organizationId: actor.organizationId, createdByMemberId: actor.memberId, state: "active", isDefault: false, originRevisionId: fromRevisionId ?? null }).returning({ id: technicalSheets.id, originRevisionId: technicalSheets.originRevisionId });
  if (!created) throw new HttpError(409, "Ficha indisponivel.");
  return { id: created.id, vehicle_configuration_id: vehicle.id, origin_revision_id: created.originRevisionId };
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
    const alphabeticalOrder = [asc(vehicleConfigurations.brand), asc(vehicleConfigurations.model), asc(vehicleConfigurations.trim), asc(vehicleConfigurations.modelYear), asc(vehicleConfigurations.market), desc(technicalSheetVersions.createdAt), desc(technicalSheetVersions.id)];
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
  const [sheet] = await db.select({ versionNumber: technicalSheetVersions.versionNumber, createdAt: technicalSheetVersions.createdAt, payload: technicalSheetVersions.payload }).from(technicalSheetVersions).where(eq(technicalSheetVersions.vehicleConfigurationId, id)).orderBy(desc(technicalSheetVersions.createdAt), desc(technicalSheetVersions.id)).limit(1);
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
    latestVersion: sql<number | null>`(select "latest_technical_sheet"."version_number" from "technical_sheet_versions" as "latest_technical_sheet" where "latest_technical_sheet"."vehicle_configuration_id" = "vehicle_configurations"."id" order by "latest_technical_sheet"."created_at" desc, "latest_technical_sheet"."id" desc limit 1)`,
    latestAt: sql<Date | null>`(select "latest_technical_sheet"."created_at" from "technical_sheet_versions" as "latest_technical_sheet" where "latest_technical_sheet"."vehicle_configuration_id" = "vehicle_configurations"."id" order by "latest_technical_sheet"."created_at" desc, "latest_technical_sheet"."id" desc limit 1)`,
    latestTechnicalSheetVersionId: sql<string | null>`(select "latest_technical_sheet"."id" from "technical_sheet_versions" as "latest_technical_sheet" where "latest_technical_sheet"."vehicle_configuration_id" = "vehicle_configurations"."id" order by "latest_technical_sheet"."created_at" desc, "latest_technical_sheet"."id" desc limit 1)`
  };
}

function toCatalogCandidate(row: { id: string; slug: string; brand: string; model: string; trim: string; modelYear: number; market: string; latestVersion: number | null; latestAt: Date | string | null; latestTechnicalSheetVersionId?: string | null }): CatalogCandidate {
  return { id: row.id, slug: row.slug, vehicle: { marca: row.brand, modelo: row.model, versao: row.trim, ano_modelo: row.modelYear, mercado: row.market }, latestVersion: row.latestVersion, latestAt: row.latestAt ? new Date(row.latestAt).toISOString() : null, latestTechnicalSheetVersionId: row.latestTechnicalSheetVersionId ?? null };
}

function sha256(value: unknown): string { return createHash("sha256").update(JSON.stringify(value)).digest("hex"); }
function resolveModel(provider: LLMProvider): string { if (provider === "claude") return process.env.CLAUDE_MODEL ?? "claude-sonnet-4-5"; if (provider === "openrouter") return process.env.OPENROUTER_MODEL ?? "google/gemini-2.5-flash"; return "mock-response"; }
function asProvider(value: string): LLMProvider { return value === "claude" || value === "openrouter" ? value : "simulated"; }
