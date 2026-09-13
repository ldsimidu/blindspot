import { and, desc, eq } from "drizzle-orm";
import type { AuthContext } from "./authentication";
import { getDatabase } from "./db/client";
import { collectionRuns, fieldEvidence, fieldResearchStates, fieldResolutionAlternatives, fieldResolutions, sources, technicalSheetVersions } from "./db/schema";
import { HttpError } from "./types";

export async function readFieldExplanation(versionId: string, path: string, actor: AuthContext): Promise<unknown> {
  const db = getDatabase();
  if (!db) throw new HttpError(503, "Persistencia PostgreSQL indisponivel.");
  const [resolution] = await db.select({ id: fieldResolutions.id, stateVersion: fieldResolutions.stateVersion, state: fieldResolutions.resolutionState, reasons: fieldResolutions.explanationReasons, evidenceRefs: fieldResolutions.evidenceRefs, versionId: technicalSheetVersions.id }).from(fieldResolutions).innerJoin(technicalSheetVersions, eq(fieldResolutions.technicalSheetVersionId, technicalSheetVersions.id)).innerJoin(collectionRuns, eq(technicalSheetVersions.collectionRunId, collectionRuns.id)).where(and(eq(technicalSheetVersions.id, versionId), eq(fieldResolutions.path, path), eq(collectionRuns.organizationId, actor.organizationId))).limit(1);
  if (!resolution) throw new HttpError(404, "Explicacao da variavel indisponivel.");
  const [research] = await db.select({ state: fieldResearchStates.state, stateVersion: fieldResearchStates.stateVersion, reasonCode: fieldResearchStates.reasonCode }).from(fieldResearchStates).where(and(eq(fieldResearchStates.baseRevisionId, versionId), eq(fieldResearchStates.path, path))).orderBy(desc(fieldResearchStates.updatedAt)).limit(1);
  const alternatives = await db.select({ ordinal: fieldResolutionAlternatives.ordinal, value: fieldResolutionAlternatives.value, evidenceRefs: fieldResolutionAlternatives.evidenceRefs }).from(fieldResolutionAlternatives).where(eq(fieldResolutionAlternatives.fieldResolutionId, resolution.id)).orderBy(fieldResolutionAlternatives.ordinal);
  const evidence = await db.select({ sourceRef: fieldEvidence.sourceRef, observedAt: fieldEvidence.observedAt, title: sources.title, type: sources.sourceType }).from(fieldEvidence).innerJoin(sources, eq(fieldEvidence.sourceId, sources.id)).where(and(eq(fieldEvidence.technicalSheetVersionId, versionId), eq(fieldEvidence.path, path))).orderBy(desc(fieldEvidence.observedAt));
  const effective = research ? { state: research.state, stateVersion: research.stateVersion, reasons: [research.reasonCode] } : { state: resolution.state, stateVersion: resolution.stateVersion, reasons: stringArray(resolution.reasons) };
  return { technical_sheet_version_id: versionId, field_path: path, state: effective.state, state_version: effective.stateVersion, reason_codes: effective.reasons, evidence_refs: stringArray(resolution.evidenceRefs), evidence: evidence.map((item) => ({ source_ref: item.sourceRef, source_title: item.title, source_type: item.type, observed_at: item.observedAt.toISOString() })), alternatives: alternatives.map((item) => ({ ordinal: item.ordinal, value: item.value, evidence_refs: stringArray(item.evidenceRefs) })) };
}

function stringArray(value: unknown): string[] { return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : []; }
