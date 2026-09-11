import { ValidationError } from "./types";
import type { FieldPolicy } from "./runtime-assets";

export function validateFieldPolicy(candidateResponse: unknown, policy: FieldPolicy): void {
  if (!isRecord(candidateResponse) || !isRecord(candidateResponse.ficha_tecnica)) return;

  const bodyField = readField(candidateResponse.ficha_tecnica, policy.body.field);
  validateAllowedValue(bodyField, policy.body.field, policy.body.allowedValues);

  const propulsionField = readField(candidateResponse.ficha_tecnica, policy.propulsion.field);
  validateAllowedValue(propulsionField, policy.propulsion.field, policy.propulsion.allowedValues);
  const propulsion = confirmedCanonicalValue(propulsionField);
  if (!propulsion) return;

  for (const rule of policy.conditionalFields) {
    if (rule.applicableTo.includes(propulsion)) continue;
    const field = readField(candidateResponse.ficha_tecnica, rule.path);
    if (field && field.status !== "nao_aplicavel") {
      throw new ValidationError("Campo condicional precisa declarar nao aplicavel para a propulsao confirmada.", {
        code: "conditional_field_requires_not_applicable",
        field: rule.path,
        parentField: policy.propulsion.field,
        parentValue: propulsion
      });
    }
  }
}

function validateAllowedValue(field: FieldValue | null, path: string, allowedValues: string[]): void {
  const value = confirmedCanonicalValue(field);
  if (!value) return;
  if (!allowedValues.includes(value)) {
    throw new ValidationError("Valor generico fora do vocabulario aprovado.", {
      code: "field_policy_value_not_allowed",
      field: path,
      value,
      allowedValues
    });
  }
}

function confirmedCanonicalValue(field: FieldValue | null): string | null {
  if (!field || field.status !== "confirmado" || typeof field.valor !== "string") return null;
  return field.valor.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").trim().toLocaleLowerCase("pt-BR").replace(/[\s-]+/g, "_");
}

interface FieldValue {
  valor?: unknown;
  status?: unknown;
}

function readField(fichaTecnica: Record<string, unknown>, path: string): FieldValue | null {
  const [group, field] = path.split(".");
  if (!group || !field || !isRecord(fichaTecnica[group]) || !isRecord(fichaTecnica[group][field])) return null;
  return fichaTecnica[group][field] as FieldValue;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
