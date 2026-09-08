import { ValidationError } from "./types";
import type { QualityPolicy } from "./runtime-assets";

export function validateQualityPolicy(candidateResponse: unknown, policy: QualityPolicy): void {
  const conflicts: Array<{ path: string; field: Record<string, unknown> }> = [];
  walk(candidateResponse, "$", conflicts, policy.conflict.status);

  for (const conflict of conflicts) {
    const sourceReferences = conflict.field.fonte_ref;
    const validReferences = Array.isArray(sourceReferences) && sourceReferences.every((reference) => typeof reference === "string");
    if (!validReferences || sourceReferences.length < policy.conflict.minimumSources || new Set(sourceReferences).size !== sourceReferences.length) {
      throw new ValidationError("Campo conflitante precisa preservar fontes distintas suficientes.", {
        code: "conflict_requires_distinct_sources",
        field: conflict.path,
        minimumSources: policy.conflict.minimumSources
      });
    }

    if (policy.conflict.requiresNullValue && conflict.field.valor !== null) {
      throw new ValidationError("Campo conflitante nao pode escolher valor automaticamente.", {
        code: "conflict_requires_null_value",
        field: conflict.path
      });
    }

    if (conflict.field.obs_ref !== policy.conflict.requiredObservation && !isNonEmptyString(conflict.field.observacoes)) {
      throw new ValidationError("Campo conflitante precisa registrar observacao de conflito.", {
        code: "conflict_requires_observation",
        field: conflict.path
      });
    }
  }
}

function walk(node: unknown, path: string, conflicts: Array<{ path: string; field: Record<string, unknown> }>, conflictStatus: string): void {
  if (Array.isArray(node)) {
    node.forEach((item, index) => walk(item, `${path}[${index}]`, conflicts, conflictStatus));
    return;
  }
  if (!isRecord(node)) return;

  if (node.status === conflictStatus) conflicts.push({ path, field: node });
  for (const [key, value] of Object.entries(node)) walk(value, `${path}.${key}`, conflicts, conflictStatus);
}

function isNonEmptyString(value: unknown): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
