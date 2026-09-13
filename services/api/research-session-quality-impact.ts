import { and, eq } from "drizzle-orm";
import type { AuthContext } from "./authentication";
import { getDatabase } from "./db/client";
import { collectionRuns, fieldEvidence, fieldResolutions, researchSessionQualityImpacts, researchSessions, technicalSheetVersions } from "./db/schema";
import { calculateQualityVector, type QualityVector } from "./quality-vector";
import { HttpError } from "./types";
import { appendResearchSessionEvent } from "./research-session-history";

type OutcomeKind = "published" | "partial_published" | "research_exhausted" | "failed" | "cancelled" | "needs_rebase";
type MetricKey = "completeness" | "evidence" | "consistency" | "freshness" | "human_validation";

export async function recordResearchSessionQualityImpact(sessionId: string): Promise<void> {
  const db = getDatabase(); if (!db) return;
  const [session] = await db.select({ id: researchSessions.id, organizationId: researchSessions.organizationId, baseRevisionId: researchSessions.baseRevisionId, state: researchSessions.state }).from(researchSessions).where(eq(researchSessions.id, sessionId)).limit(1);
  if (!session || !isOutcomeKind(session.state)) return;
  const [result] = await db.select({ id: technicalSheetVersions.id }).from(technicalSheetVersions).innerJoin(collectionRuns, eq(technicalSheetVersions.collectionRunId, collectionRuns.id)).where(and(eq(collectionRuns.requestId, `research-${session.id}`), eq(collectionRuns.organizationId, session.organizationId))).limit(1);
  const before = await readVector(session.baseRevisionId);
  const after = result ? await readVector(result.id) : null;
  const outcomeKind: OutcomeKind = result ? session.state === "partial" ? "partial_published" : "published" : terminalOutcome(session.state);
  const delta = compareVectors(before, after);
  await db.transaction(async (tx) => {
    await tx.insert(researchSessionQualityImpacts).values({ researchSessionId: session.id, organizationId: session.organizationId, baseRevisionId: session.baseRevisionId, resultRevisionId: result?.id ?? null, policyVersion: before.policy_version, outcomeKind, beforeVector: before, afterVector: after, delta, recommendation: (after ?? before).recommendation, updatedAt: new Date() }).onConflictDoUpdate({ target: researchSessionQualityImpacts.researchSessionId, set: { resultRevisionId: result?.id ?? null, policyVersion: before.policy_version, outcomeKind, beforeVector: before, afterVector: after, delta, recommendation: (after ?? before).recommendation, updatedAt: new Date() } });
    await appendResearchSessionEvent(tx, { sessionId: session.id, organizationId: session.organizationId, type: "impact_recorded", correlationId: `impact-${session.id}`, metadata: { policy_version: before.policy_version, state: outcomeKind, result_revision_id: result?.id ?? null, base_revision_id: session.baseRevisionId } });
  });
}

export async function readResearchSessionQualityImpact(sessionId: string, actor: AuthContext): Promise<unknown> {
  const db = getDatabase(); if (!db) throw new HttpError(503, "Persistencia PostgreSQL indisponivel.");
  const [impact] = await db.select({ sessionId: researchSessionQualityImpacts.researchSessionId, baseRevisionId: researchSessionQualityImpacts.baseRevisionId, resultRevisionId: researchSessionQualityImpacts.resultRevisionId, policyVersion: researchSessionQualityImpacts.policyVersion, outcomeKind: researchSessionQualityImpacts.outcomeKind, beforeVector: researchSessionQualityImpacts.beforeVector, afterVector: researchSessionQualityImpacts.afterVector, delta: researchSessionQualityImpacts.delta, recommendation: researchSessionQualityImpacts.recommendation, updatedAt: researchSessionQualityImpacts.updatedAt }).from(researchSessionQualityImpacts).where(and(eq(researchSessionQualityImpacts.researchSessionId, sessionId), eq(researchSessionQualityImpacts.organizationId, actor.organizationId))).limit(1);
  if (!impact) throw new HttpError(404, "Impacto indisponivel.");
  return { research_session_id: impact.sessionId, base_revision_id: impact.baseRevisionId, result_revision_id: impact.resultRevisionId, policy_version: impact.policyVersion, outcome_kind: impact.outcomeKind, before: impact.beforeVector, after: impact.afterVector, delta: impact.delta, recommendation: { ...(impact.recommendation as Record<string, unknown>), alternative: "not_execute" }, updated_at: impact.updatedAt.toISOString() };
}

async function readVector(versionId: string): Promise<QualityVector> {
  const db = getDatabase(); if (!db) throw new HttpError(503, "Persistencia PostgreSQL indisponivel.");
  const [version] = await db.select({ createdAt: technicalSheetVersions.createdAt }).from(technicalSheetVersions).where(eq(technicalSheetVersions.id, versionId)).limit(1);
  if (!version) throw new HttpError(404, "Revisao indisponivel.");
  const [resolutions, evidence] = await Promise.all([
    db.select({ path: fieldResolutions.path, status: fieldResolutions.status }).from(fieldResolutions).where(eq(fieldResolutions.technicalSheetVersionId, versionId)),
    db.select({ path: fieldEvidence.path }).from(fieldEvidence).where(eq(fieldEvidence.technicalSheetVersionId, versionId))
  ]);
  return calculateQualityVector({ resolutions, evidence, revisionCreatedAt: version.createdAt });
}

function compareVectors(before: QualityVector, after: QualityVector | null): Record<MetricKey, { numerator_delta: number; denominator_delta: number; rate_delta: number }> | { state: "not_applicable" } {
  if (!after) return { state: "not_applicable" };
  const keys: MetricKey[] = ["completeness", "evidence", "consistency", "freshness", "human_validation"];
  return Object.fromEntries(keys.map((key) => [key, { numerator_delta: after[key].numerator - before[key].numerator, denominator_delta: after[key].denominator - before[key].denominator, rate_delta: after[key].rate - before[key].rate }])) as Record<MetricKey, { numerator_delta: number; denominator_delta: number; rate_delta: number }>;
}

function isOutcomeKind(state: string): state is OutcomeKind | "partial" | "succeeded" { return ["succeeded", "partial", "research_exhausted", "failed", "cancelled", "needs_rebase"].includes(state); }
function terminalOutcome(state: string): OutcomeKind { return state === "research_exhausted" || state === "failed" || state === "cancelled" || state === "needs_rebase" ? state : "failed"; }
