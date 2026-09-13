import { projectFieldState, projectResearchState } from "../services/api/field-state";
import { readFieldStatePolicy } from "../services/api/runtime-assets";
import { ValidationError } from "../services/api/types";

const policy = await readFieldStatePolicy();
for (const [status, expected] of Object.entries(policy.legacyStatusMap)) {
  const field: Record<string, unknown> = status === "confirmado" ? { status, valor: "210 cv", fonte_ref: ["F1"] } : status === "conflitante" ? { status, valor: null, fonte_ref: ["F1", "F2"], alternativas: [{ valor: "210 cv", fonte_ref: ["F1"] }, { valor: "215 cv", fonte_ref: ["F2"] }] } : status === "nao_encontrado" || status === "nao_aplicavel" ? { status, valor: null } : { status, valor: "valor", fonte_ref: ["F1"] };
  const projected = projectFieldState(field, policy);
  if (projected.state !== expected) throw new Error(`Expected ${status} to map to ${expected}.`);
}
expectError(() => projectFieldState({ status: "conflitante", valor: null, fonte_ref: ["F1", "F2"] }, policy), "field_state_conflict_requires_alternatives");
expectError(() => projectFieldState({ status: "confirmado", valor: "210 cv" }, policy), "field_state_confirmed_requires_evidence");
if (projectResearchState("queued") !== "pending" || projectResearchState("research_exhausted") !== "research_exhausted" || projectResearchState("failed") !== "blocked") throw new Error("Research state projection mismatch.");
console.log("FIELD_STATE_CONTRACT=PASS");

function expectError(run: () => unknown, code: string): void { try { run(); } catch (error) { if (error instanceof ValidationError && typeof error.details === "object" && error.details && (error.details as { code?: string }).code === code) return; throw error; } throw new Error(`Expected ${code}.`); }
