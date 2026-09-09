import { and, eq, gte, lt } from "drizzle-orm";
import type { AuthContext } from "./authentication";
import { getDatabase } from "./db/client";
import { usageEvents } from "./db/schema";
import { HttpError } from "./types";

export interface UsageSummary { definition: string; period: string; starts_at: string; ends_at: string; successful_units: number; failed_attempts: number; breakdown: Array<{ action: "technical_sheet_persisted" | "technical_sheet_persist_failed"; outcome: "succeeded" | "failed"; units: number; events: number }>; }

export async function readUsageSummary(actor: AuthContext, period: string): Promise<UsageSummary> {
  const { start, end } = parsePeriod(period); const db = requireDb();
  const rows = await db.select({ action: usageEvents.action, outcome: usageEvents.outcome, units: usageEvents.units }).from(usageEvents).where(and(eq(usageEvents.organizationId, actor.organizationId), gte(usageEvents.createdAt, start), lt(usageEvents.createdAt, end)));
  const grouped = new Map<string, { action: "technical_sheet_persisted" | "technical_sheet_persist_failed"; outcome: "succeeded" | "failed"; units: number; events: number }>();
  for (const row of rows) { if (!isUsageAction(row.action) || !isUsageOutcome(row.outcome)) continue; const key = `${row.action}:${row.outcome}`; const entry = grouped.get(key) ?? { action: row.action, outcome: row.outcome, units: 0, events: 0 }; entry.units += row.units; entry.events += 1; grouped.set(key, entry); }
  const breakdown = [...grouped.values()].sort((a, b) => a.action.localeCompare(b.action));
  return { definition: "Cada ficha técnica persistida com sucesso vale 1 unidade. Falhas valem 0 e não representam cobrança, cota ou preço.", period, starts_at: start.toISOString(), ends_at: end.toISOString(), successful_units: breakdown.filter((item) => item.outcome === "succeeded").reduce((total, item) => total + item.units, 0), failed_attempts: breakdown.filter((item) => item.outcome === "failed").reduce((total, item) => total + item.events, 0), breakdown };
}

export async function recordUsageFailure(actor: AuthContext, requestId: string): Promise<void> { const db = requireDb(); await db.insert(usageEvents).values({ organizationId: actor.organizationId, accountId: actor.accountId, memberId: actor.memberId, action: "technical_sheet_persist_failed", outcome: "failed", units: 0, requestId }).onConflictDoNothing(); }
export function parseUsagePeriod(value: unknown): string { if (typeof value !== "string" || !/^\d{4}-(0[1-9]|1[0-2])$/.test(value)) throw new HttpError(400, "Periodo de consumo invalido."); return value; }
function parsePeriod(period: string) { if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(period)) throw new HttpError(400, "Periodo de consumo invalido."); const [year, month] = period.split("-").map(Number); const start = new Date(Date.UTC(year, month - 1, 1)); const end = new Date(Date.UTC(year, month, 1)); return { start, end }; }
function isUsageAction(value: string): value is "technical_sheet_persisted" | "technical_sheet_persist_failed" { return value === "technical_sheet_persisted" || value === "technical_sheet_persist_failed"; }
function isUsageOutcome(value: string): value is "succeeded" | "failed" { return value === "succeeded" || value === "failed"; }
function requireDb() { const db = getDatabase(); if (!db) throw new HttpError(503, "Consumo requer persistencia PostgreSQL ativa."); return db; }
