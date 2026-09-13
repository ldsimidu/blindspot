import { and, eq, inArray, isNull, sql } from "drizzle-orm";
import type { AuthContext } from "./authentication";
import { getDatabase } from "./db/client";
import { technicalSheetLifecycleEvents, technicalSheetPrimaryAssignments, technicalSheetTags, technicalSheets } from "./db/schema";
import { readTechnicalSheetGovernancePolicy } from "./runtime-assets";
import { HttpError } from "./types";

export async function setTechnicalSheetPrimary(sheetId: string, reason: string, actor: AuthContext): Promise<{ technical_sheet_id: string; primary: true }> {
  requireAdmin(actor);
  const [policy, db] = await Promise.all([readTechnicalSheetGovernancePolicy(), requireDb()]);
  if (!policy.primaryReasons.includes(reason)) throw new HttpError(400, "Motivo de ficha primaria invalido.");
  return db.transaction(async (tx) => {
    const [sheet] = await tx.select().from(technicalSheets).where(and(eq(technicalSheets.id, sheetId), eq(technicalSheets.organizationId, actor.organizationId))).limit(1);
    if (!sheet || !policy.primaryEligibleStates.includes(sheet.state as "active" | "stale")) throw new HttpError(409, "Ficha indisponivel para primaria.");
    await tx.execute(sql`select "id" from "technical_sheets" where "vehicle_configuration_id" = ${sheet.vehicleConfigurationId} and "organization_id" = ${actor.organizationId} for update`);
    await tx.update(technicalSheetPrimaryAssignments).set({ revokedAt: new Date(), revokedByMemberId: actor.memberId }).where(and(eq(technicalSheetPrimaryAssignments.organizationId, actor.organizationId), eq(technicalSheetPrimaryAssignments.vehicleConfigurationId, sheet.vehicleConfigurationId), isNull(technicalSheetPrimaryAssignments.revokedAt)));
    await tx.insert(technicalSheetPrimaryAssignments).values({ organizationId: actor.organizationId, vehicleConfigurationId: sheet.vehicleConfigurationId, technicalSheetId: sheet.id, reasonCode: reason, policyVersion: policy.version, assignedByMemberId: actor.memberId });
    return { technical_sheet_id: sheet.id, primary: true as const };
  });
}

export async function clearTechnicalSheetPrimary(sheetId: string, actor: AuthContext): Promise<{ technical_sheet_id: string; primary: false }> {
  requireAdmin(actor); const db = requireDb();
  const result = await db.transaction(async (tx) => {
    const [sheet] = await tx.select().from(technicalSheets).where(and(eq(technicalSheets.id, sheetId), eq(technicalSheets.organizationId, actor.organizationId))).limit(1);
    if (!sheet) throw new HttpError(404, "Ficha indisponivel.");
    const revoked = await tx.update(technicalSheetPrimaryAssignments).set({ revokedAt: new Date(), revokedByMemberId: actor.memberId }).where(and(eq(technicalSheetPrimaryAssignments.organizationId, actor.organizationId), eq(technicalSheetPrimaryAssignments.technicalSheetId, sheetId), isNull(technicalSheetPrimaryAssignments.revokedAt))).returning({ id: technicalSheetPrimaryAssignments.id });
    if (!revoked.length) throw new HttpError(409, "Ficha nao e primaria.");
    return { technical_sheet_id: sheet.id, primary: false as const };
  });
  return result;
}

export async function transitionTechnicalSheetLifecycle(sheetId: string, nextState: string, reason: string, actor: AuthContext): Promise<{ technical_sheet_id: string; state: string }> {
  requireAdmin(actor); const [policy, db] = await Promise.all([readTechnicalSheetGovernancePolicy(), requireDb()]);
  if (!policy.lifecycleStates.includes(nextState as "active" | "stale" | "archived") || !policy.lifecycleReasons.includes(reason)) throw new HttpError(400, "Transicao de ficha invalida.");
  return db.transaction(async (tx) => {
    const [sheet] = await tx.select().from(technicalSheets).where(and(eq(technicalSheets.id, sheetId), eq(technicalSheets.organizationId, actor.organizationId))).limit(1);
    if (!sheet || !isAllowedTransition(sheet.state, nextState)) throw new HttpError(409, "Transicao de ficha indisponivel.");
    if (nextState === "stale" && reason !== "freshness_policy" && reason !== "manual_review") throw new HttpError(400, "Motivo de ficha stale invalido.");
    await tx.update(technicalSheets).set({ state: nextState, updatedAt: new Date() }).where(eq(technicalSheets.id, sheet.id));
    await tx.insert(technicalSheetLifecycleEvents).values({ technicalSheetId: sheet.id, organizationId: actor.organizationId, fromState: sheet.state, toState: nextState, reasonCode: reason, policyVersion: policy.version, changedByMemberId: actor.memberId });
    if (nextState === "archived") await tx.update(technicalSheetPrimaryAssignments).set({ revokedAt: new Date(), revokedByMemberId: actor.memberId }).where(and(eq(technicalSheetPrimaryAssignments.technicalSheetId, sheet.id), isNull(technicalSheetPrimaryAssignments.revokedAt)));
    return { technical_sheet_id: sheet.id, state: nextState };
  });
}

export async function setManualTechnicalSheetTag(sheetId: string, tag: string, actor: AuthContext): Promise<{ technical_sheet_id: string; tag: string }> {
  requireAdmin(actor); const [policy, db] = await Promise.all([readTechnicalSheetGovernancePolicy(), requireDb()]);
  if (!policy.manualTags.includes(tag)) throw new HttpError(400, "Tag manual invalida.");
  const [sheet] = await db.select().from(technicalSheets).where(and(eq(technicalSheets.id, sheetId), eq(technicalSheets.organizationId, actor.organizationId))).limit(1);
  if (!sheet) throw new HttpError(404, "Ficha indisponivel.");
  await db.insert(technicalSheetTags).values({ technicalSheetId: sheetId, organizationId: actor.organizationId, tag, origin: "manual", policyVersion: policy.version, reasonCode: "manual_review", createdByMemberId: actor.memberId }).onConflictDoNothing();
  return { technical_sheet_id: sheetId, tag };
}

export async function revokeManualTechnicalSheetTag(sheetId: string, tag: string, actor: AuthContext): Promise<{ technical_sheet_id: string; tag: string; revoked: true }> {
  requireAdmin(actor); const db = requireDb();
  const rows = await db.update(technicalSheetTags).set({ revokedAt: new Date(), revokedByMemberId: actor.memberId }).where(and(eq(technicalSheetTags.technicalSheetId, sheetId), eq(technicalSheetTags.organizationId, actor.organizationId), eq(technicalSheetTags.tag, tag), eq(technicalSheetTags.origin, "manual"), isNull(technicalSheetTags.revokedAt))).returning({ id: technicalSheetTags.id });
  if (!rows.length) throw new HttpError(404, "Tag manual indisponivel."); return { technical_sheet_id: sheetId, tag, revoked: true };
}

export async function readManualTags(sheetIds: string[], actor: AuthContext): Promise<Map<string, Array<{ tag: string; origin: "manual"; reason: string; created_at: string }>>> {
  if (!sheetIds.length) return new Map(); const db = requireDb();
  const rows = await db.select({ sheetId: technicalSheetTags.technicalSheetId, tag: technicalSheetTags.tag, reason: technicalSheetTags.reasonCode, createdAt: technicalSheetTags.createdAt }).from(technicalSheetTags).where(and(inArray(technicalSheetTags.technicalSheetId, sheetIds), eq(technicalSheetTags.organizationId, actor.organizationId), eq(technicalSheetTags.origin, "manual"), isNull(technicalSheetTags.revokedAt)));
  const result = new Map<string, Array<{ tag: string; origin: "manual"; reason: string; created_at: string }>>(); for (const row of rows) result.set(row.sheetId, [...(result.get(row.sheetId) ?? []), { tag: row.tag, origin: "manual", reason: row.reason, created_at: row.createdAt.toISOString() }]); return result;
}
export async function readPrimarySheetId(vehicleConfigurationId: string, actor: AuthContext): Promise<string | null> { const db = requireDb(); const [row] = await db.select({ sheetId: technicalSheetPrimaryAssignments.technicalSheetId }).from(technicalSheetPrimaryAssignments).where(and(eq(technicalSheetPrimaryAssignments.organizationId, actor.organizationId), eq(technicalSheetPrimaryAssignments.vehicleConfigurationId, vehicleConfigurationId), isNull(technicalSheetPrimaryAssignments.revokedAt))).limit(1); return row?.sheetId ?? null; }
function requireAdmin(actor: AuthContext): void { if (actor.role !== "admin") throw new HttpError(403, "Acao restrita a administradores."); }
function requireDb() { const db = getDatabase(); if (!db) throw new HttpError(503, "Persistencia PostgreSQL indisponivel."); return db; }
function isAllowedTransition(from: string, to: string): boolean { return (from === "active" && (to === "stale" || to === "archived")) || (from === "stale" && (to === "active" || to === "archived")) || (from === "archived" && to === "active"); }
