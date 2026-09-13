import type { FieldStatePolicy } from "./runtime-assets";
import { ValidationError } from "./types";

export type FieldResolutionState = "confirmed" | "partial" | "inferred" | "calculated" | "user_provided" | "unknown" | "not_found" | "not_applicable" | "conflicting" | "research_exhausted" | "pending" | "blocked";

export interface FieldStateProjection { state: FieldResolutionState; stateVersion: string; reasonCodes: string[]; alternativesState?: "present" | "legacy_unavailable"; }

export function projectFieldState(field: Record<string, unknown>, policy: FieldStatePolicy, legacy = false): FieldStateProjection {
  const status = typeof field.status === "string" ? field.status : undefined;
  const state = status ? policy.legacyStatusMap[status] : "unknown";
  if (!state || !policy.states.includes(state)) throw new ValidationError("Estado de variavel fora do contrato canonico.", { code: "field_state_unknown_status", status });
  const refs = stringArray(field.fonte_ref);
  if (state === "confirmed" && policy.confirmedRequiresEvidence && refs.length === 0) throw new ValidationError("Campo confirmado precisa de evidencia permitida.", { code: "field_state_confirmed_requires_evidence" });
  if (state === "calculated") {
    const calculation = record(field.calculo);
    if (!calculation || typeof calculation.formula_version !== "string" || stringArray(calculation.input_paths).length === 0) throw new ValidationError("Campo calculado precisa declarar formula e entradas.", { code: "field_state_calculated_requires_inputs" });
  }
  if (state === "conflicting") {
    if (field.valor !== null) throw new ValidationError("Campo conflitante nao pode publicar valor vencedor.", { code: "field_state_conflict_requires_null" });
    const alternatives = Array.isArray(field.alternativas) ? field.alternativas.filter(record) : [];
    if (!legacy && alternatives.length < policy.conflict.minimumAlternatives) throw new ValidationError("Campo conflitante precisa preservar alternativas.", { code: "field_state_conflict_requires_alternatives", minimumAlternatives: policy.conflict.minimumAlternatives });
    return { state, stateVersion: policy.version, reasonCodes: [legacy && alternatives.length === 0 ? "legacy_conflict_without_alternatives" : "conflicting_sources"], alternativesState: alternatives.length >= policy.conflict.minimumAlternatives ? "present" : "legacy_unavailable" };
  }
  return { state, stateVersion: policy.version, reasonCodes: reasonCodesFor(state) };
}

export function projectResearchState(sessionState: string): FieldResolutionState | null {
  if (sessionState === "queued" || sessionState === "running") return "pending";
  if (sessionState === "research_exhausted") return "research_exhausted";
  if (sessionState === "failed" || sessionState === "needs_rebase" || sessionState === "cancelled") return "blocked";
  return null;
}

function reasonCodesFor(state: FieldResolutionState): string[] {
  const reasons: Record<FieldResolutionState, string[]> = { confirmed: ["direct_evidence"], partial: ["incomplete_evidence"], inferred: ["inference_not_confirmation"], calculated: ["derived_from_declared_inputs"], user_provided: ["provided_in_request"], unknown: ["legacy_or_unresolved"], not_found: ["not_found_after_research"], not_applicable: ["not_applicable"], conflicting: ["conflicting_sources"], research_exhausted: ["research_budget_or_sources_exhausted"], pending: ["research_pending"], blocked: ["research_blocked"] };
  return reasons[state];
}
function record(value: unknown): Record<string, unknown> | undefined { return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : undefined; }
function stringArray(value: unknown): string[] { return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : []; }
