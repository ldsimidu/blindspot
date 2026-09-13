import { and, asc, eq, gt, lt, sql } from "drizzle-orm";
import type { AuthContext } from "./authentication";
import { getDatabase } from "./db/client";
import { researchSessionEvents, researchSessions } from "./db/schema";
import { HttpError } from "./types";

export const researchSessionEventTypes = ["session_planned", "execution_started", "task_started", "task_finished", "session_cancelled", "session_exhausted", "session_failed", "revision_published", "impact_recorded"] as const;
export type ResearchSessionEventType = typeof researchSessionEventTypes[number];
const RETENTION_DAYS = 180;

type EventMetadata = Record<string, boolean | number | string | null>;

export async function appendResearchSessionEvent(tx: any, input: { sessionId: string; organizationId: string; type: ResearchSessionEventType; correlationId: string; metadata?: EventMetadata }): Promise<void> {
  await tx.execute(sql`select "id" from "research_sessions" where "id" = ${input.sessionId} and "organization_id" = ${input.organizationId} for update`);
  const result = await tx.execute(sql<{ next_sequence: number }>`select coalesce(max("sequence_number"), 0) + 1 as "next_sequence" from "research_session_events" where "research_session_id" = ${input.sessionId}`);
  const nextSequence = Number(result.rows[0]?.next_sequence ?? 1);
  const expiresAt = new Date(Date.now() + RETENTION_DAYS * 24 * 60 * 60 * 1000);
  await tx.insert(researchSessionEvents).values({ researchSessionId: input.sessionId, organizationId: input.organizationId, sequenceNumber: nextSequence, eventType: input.type, correlationId: input.correlationId, metadata: input.metadata ?? {}, expiresAt });
}

export async function readResearchSessionHistory(sessionId: string, actor: AuthContext): Promise<unknown> {
  const db = getDatabase();
  if (!db) throw new HttpError(503, "Persistencia PostgreSQL indisponivel.");
  await purgeExpiredResearchSessionEvents();
  const [session] = await db.select({ id: researchSessions.id, state: researchSessions.state, createdAt: researchSessions.createdAt, finishedAt: researchSessions.finishedAt }).from(researchSessions).where(and(eq(researchSessions.id, sessionId), eq(researchSessions.organizationId, actor.organizationId))).limit(1);
  if (!session) throw new HttpError(404, "Historico indisponivel.");
  const events = await db.select({ sequenceNumber: researchSessionEvents.sequenceNumber, eventType: researchSessionEvents.eventType, correlationId: researchSessionEvents.correlationId, metadata: researchSessionEvents.metadata, createdAt: researchSessionEvents.createdAt, expiresAt: researchSessionEvents.expiresAt }).from(researchSessionEvents).where(and(eq(researchSessionEvents.researchSessionId, sessionId), eq(researchSessionEvents.organizationId, actor.organizationId), gt(researchSessionEvents.expiresAt, new Date()))).orderBy(asc(researchSessionEvents.sequenceNumber)).limit(200);
  return { research_session_id: session.id, state: session.state, created_at: session.createdAt.toISOString(), finished_at: session.finishedAt?.toISOString() ?? null, retention_days: RETENTION_DAYS, events: events.map((event) => ({ sequence: event.sequenceNumber, type: event.eventType, correlation_id: event.correlationId, metadata: sanitizeHistoryMetadata(event.metadata), occurred_at: event.createdAt.toISOString(), expires_at: event.expiresAt.toISOString() })) };
}

export async function purgeExpiredResearchSessionEvents(): Promise<number> {
  const db = getDatabase();
  if (!db) return 0;
  const deleted = await db.delete(researchSessionEvents).where(lt(researchSessionEvents.expiresAt, new Date())).returning({ id: researchSessionEvents.id });
  return deleted.length;
}

export function startResearchSessionHistoryRetentionSweep(): void {
  void purgeExpiredResearchSessionEvents().catch(() => undefined);
  const interval = setInterval(() => { void purgeExpiredResearchSessionEvents().catch(() => undefined); }, 24 * 60 * 60 * 1000);
  interval.unref();
}

export function sanitizeHistoryMetadata(value: unknown): EventMetadata {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const allowed = new Set(["state", "stop_reason", "failure_code", "runtime_contract_version", "research_plan_version", "source_policy_version", "task_sequence", "provider_call_budget", "provider_calls_used", "result_revision_id", "base_revision_id", "policy_version"]);
  return Object.fromEntries(Object.entries(value as Record<string, unknown>).flatMap(([key, item]) => allowed.has(key) && (typeof item === "string" || typeof item === "number" || typeof item === "boolean" || item === null) ? [[key, item]] : []));
}
