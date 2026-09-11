import { createHash } from "node:crypto";
import { and, desc, eq, inArray } from "drizzle-orm";
import type { AuthContext } from "./authentication";
import { getDatabase } from "./db/client";
import { auditEvents, savedComparisons, technicalSheetVersions, vehicleConfigurations } from "./db/schema";
import { HttpError, type FichaTecnicaResponse, type VehicleInput } from "./types";

const CONTRACT_VERSION = "comparison-contract-v2";

export interface ComparisonField { path: string; label: string; left: ComparisonCell | null; right: ComparisonCell | null; difference: "equal" | "different" | "missing_on_left" | "missing_on_right" | "conflicting" | "not_applicable"; }
export interface ComparisonCell { value: unknown; unit: string | null; status: string; source_refs: string[]; observation: string | null; }
export interface ComparisonWarning { code: "market_mismatch" | "motorization_mismatch" | "motorization_not_confirmed"; message: string; }
export interface TechnicalComparison { contract_version: string; result_sha256: string; compatibility_warnings: ComparisonWarning[]; left: ComparisonVersion; right: ComparisonVersion; fields: ComparisonField[]; }
export interface ComparisonVersion { technical_sheet_version_id: string; version_number: number; vehicle: VehicleInput; sources: Array<{ id: string; title: string; type: string }>; }

interface StoredVersion { id: string; versionNumber: number; vehicle: VehicleInput; payload: FichaTecnicaResponse; }

export async function createSavedComparison(actor: AuthContext, ids: [string, string], requestId: string): Promise<{ id: string; created_at: string; comparison: TechnicalComparison }> {
  const [leftId, rightId] = [...ids].sort() as [string, string];
  const comparison = await createTechnicalComparison(leftId, rightId);
  const db = requireDb();
  const [saved] = await db.transaction(async (tx) => {
    const [row] = await tx.insert(savedComparisons).values({ organizationId: actor.organizationId, accountId: actor.accountId, createdByMemberId: actor.memberId, leftTechnicalSheetVersionId: leftId, rightTechnicalSheetVersionId: rightId, comparisonContractVersion: CONTRACT_VERSION, resultSha256: comparison.result_sha256 }).onConflictDoUpdate({ target: [savedComparisons.organizationId, savedComparisons.leftTechnicalSheetVersionId, savedComparisons.rightTechnicalSheetVersionId], set: { resultSha256: comparison.result_sha256 } }).returning();
    await tx.insert(auditEvents).values({ organizationId: actor.organizationId, accountId: actor.accountId, memberId: actor.memberId, action: "comparison.created", resourceType: "saved_comparison", resourceId: row.id, outcome: "allowed", requestId });
    return [row];
  });
  return { id: saved.id, created_at: saved.createdAt.toISOString(), comparison };
}

export async function listSavedComparisons(actor: AuthContext): Promise<{ comparisons: Array<{ id: string; created_at: string; left_version_id: string; right_version_id: string }> }> {
  const db = requireDb();
  const rows = await db.select().from(savedComparisons).where(eq(savedComparisons.organizationId, actor.organizationId)).orderBy(desc(savedComparisons.createdAt)).limit(100);
  return { comparisons: rows.map((row) => ({ id: row.id, created_at: row.createdAt.toISOString(), left_version_id: row.leftTechnicalSheetVersionId, right_version_id: row.rightTechnicalSheetVersionId })) };
}

export async function readSavedComparison(actor: AuthContext, id: string, requestId: string): Promise<{ id: string; created_at: string; comparison: TechnicalComparison }> {
  const db = requireDb();
  const [saved] = await db.select().from(savedComparisons).where(and(eq(savedComparisons.id, id), eq(savedComparisons.organizationId, actor.organizationId))).limit(1);
  if (!saved) throw new HttpError(404, "Comparacao indisponivel.");
  const comparison = await createTechnicalComparison(saved.leftTechnicalSheetVersionId, saved.rightTechnicalSheetVersionId);
  await db.insert(auditEvents).values({ organizationId: actor.organizationId, accountId: actor.accountId, memberId: actor.memberId, action: "comparison.read", resourceType: "saved_comparison", resourceId: saved.id, outcome: "allowed", requestId });
  return { id: saved.id, created_at: saved.createdAt.toISOString(), comparison };
}

export async function createTechnicalComparison(leftId: string, rightId: string): Promise<TechnicalComparison> {
  const versions = await readVersions([leftId, rightId]);
  const left = versions.find((version) => version.id === leftId); const right = versions.find((version) => version.id === rightId);
  if (!left || !right) throw new HttpError(404, "Versao de ficha indisponivel.");
  if (!sameVehicle(left.vehicle, left.payload.veiculo_alvo) || !sameVehicle(right.vehicle, right.payload.veiculo_alvo)) throw new HttpError(422, "A identidade de uma versao nao corresponde ao veiculo persistido.", { codes: ["version_identity_inconsistent"] });
  const compatibility_warnings = compatibilityWarnings(left, right);
  const fields = compareFields(left.payload.ficha_tecnica, right.payload.ficha_tecnica);
  const base = { contract_version: CONTRACT_VERSION, compatibility_warnings, left: toComparisonVersion(left), right: toComparisonVersion(right), fields };
  return { ...base, result_sha256: sha256(base) };
}

async function readVersions(ids: string[]): Promise<StoredVersion[]> {
  const db = requireDb();
  const rows = await db.select({ id: technicalSheetVersions.id, versionNumber: technicalSheetVersions.versionNumber, payload: technicalSheetVersions.payload, brand: vehicleConfigurations.brand, model: vehicleConfigurations.model, trim: vehicleConfigurations.trim, modelYear: vehicleConfigurations.modelYear, market: vehicleConfigurations.market }).from(technicalSheetVersions).innerJoin(vehicleConfigurations, eq(technicalSheetVersions.vehicleConfigurationId, vehicleConfigurations.id)).where(inArray(technicalSheetVersions.id, ids));
  return rows.map((row) => ({ id: row.id, versionNumber: row.versionNumber, vehicle: { marca: row.brand, modelo: row.model, versao: row.trim, ano_modelo: row.modelYear, mercado: row.market }, payload: row.payload as FichaTecnicaResponse }));
}

function compatibilityWarnings(left: StoredVersion, right: StoredVersion): ComparisonWarning[] {
  const warnings: ComparisonWarning[] = [];
  if (left.vehicle.mercado !== right.vehicle.mercado) warnings.push({ code: "market_mismatch", message: `Mercados diferentes: esquerda ${left.vehicle.mercado}; direita ${right.vehicle.mercado}.` });
  const leftMotor = confirmedMotor(left.payload); const rightMotor = confirmedMotor(right.payload);
  if (!leftMotor || !rightMotor) warnings.push({ code: "motorization_not_confirmed", message: "A motorizacao nao esta confirmada em pelo menos uma ficha." });
  else if (leftMotor !== rightMotor) warnings.push({ code: "motorization_mismatch", message: "Motorizacao diferente entre as versoes selecionadas." });
  return warnings;
}

function confirmedMotor(payload: FichaTecnicaResponse): string | null { const technicalSheet = asRecord(payload.ficha_tecnica); const motor = technicalSheet ? asRecord(technicalSheet.motorizacao) : null; if (!motor || motor.status !== "confirmado" || typeof motor.valor !== "string" || !motor.valor.trim()) return null; return motor.valor.normalize("NFKC").trim().toLowerCase(); }
function sameVehicle(a: VehicleInput, b: VehicleInput): boolean { return a.marca === b.marca && a.modelo === b.modelo && a.versao === b.versao && a.ano_modelo === b.ano_modelo && a.mercado === b.mercado; }

function toComparisonVersion(version: StoredVersion): ComparisonVersion { return { technical_sheet_version_id: version.id, version_number: version.versionNumber, vehicle: version.vehicle, sources: version.payload.fontes_utilizadas.map((source) => ({ id: source.id, title: source.titulo, type: source.tipo })) }; }
function compareFields(left: Record<string, unknown>, right: Record<string, unknown>): ComparisonField[] { const leftFields = collectFields(left); const rightFields = collectFields(right); const paths = [...new Set([...leftFields.keys(), ...rightFields.keys()])].sort(); return paths.map((path) => { const leftCell = leftFields.get(path) ?? null; const rightCell = rightFields.get(path) ?? null; return { path, label: path.split(".").map(labelPart).join(" · "), left: leftCell, right: rightCell, difference: difference(leftCell, rightCell) }; }); }
function collectFields(value: unknown, prefix = "", result = new Map<string, ComparisonCell>()): Map<string, ComparisonCell> { if (Array.isArray(value)) { value.forEach((item, index) => collectFields(item, `${prefix}[${index}]`, result)); return result; } const record = asRecord(value); if (!record) return result; if (typeof record.status === "string" && "valor" in record && prefix) { result.set(prefix, { value: record.valor, unit: typeof record.unidade === "string" ? record.unidade : null, status: record.status, source_refs: Array.isArray(record.fonte_ref) ? record.fonte_ref.filter((item): item is string => typeof item === "string") : [], observation: typeof record.observacoes === "string" ? record.observacoes : typeof record.obs_ref === "string" ? record.obs_ref : null }); return result; } for (const [key, nested] of Object.entries(record)) collectFields(nested, prefix ? `${prefix}.${key}` : key, result); return result; }
function difference(left: ComparisonCell | null, right: ComparisonCell | null): ComparisonField["difference"] { if (!left) return "missing_on_left"; if (!right) return "missing_on_right"; if (left.status === "conflitante" || right.status === "conflitante") return "conflicting"; if (left.status === "nao_aplicavel" || right.status === "nao_aplicavel") return "not_applicable"; return JSON.stringify({ value: left.value, unit: left.unit, status: left.status }) === JSON.stringify({ value: right.value, unit: right.unit, status: right.status }) ? "equal" : "different"; }
function labelPart(value: string): string { return value.replace(/\[\d+\]/g, "").replace(/_/g, " ").trim(); }
function asRecord(value: unknown): Record<string, any> | null { return typeof value === "object" && value !== null && !Array.isArray(value) ? value as Record<string, any> : null; }
function sha256(value: unknown): string { return createHash("sha256").update(JSON.stringify(value)).digest("hex"); }
function requireDb() { const db = getDatabase(); if (!db) throw new HttpError(503, "Comparacao requer persistencia PostgreSQL ativa."); return db; }
