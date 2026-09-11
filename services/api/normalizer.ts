import { ValidationError } from "./types";
import type { NormalizationPolicy } from "./runtime-assets";

type StatusWithValue = "confirmado" | "parcial" | "inferido_minimamente";

interface MeasureField {
  valor?: unknown;
  valor_original?: unknown;
  status?: unknown;
  fonte_ref?: unknown;
}

export type NormalizationFailureMode = "reject" | "downgrade";

interface NormalizationOptions {
  failureMode?: NormalizationFailureMode;
}

const VALUE_STATUSES = new Set<StatusWithValue>(["confirmado", "parcial", "inferido_minimamente"]);
const MEASURE_PATTERN = /^([+-]?(?:\d+(?:[.,]\d+)?|\.\d+))\s*([\p{L}³._/]+(?:\s*\/\s*\d+\s*[\p{L}]+)?)$/iu;

/**
 * Mutates only policy allowlisted fields. In downgrade mode, invalid LLM output is
 * isolated to its field instead of rejecting an otherwise usable technical sheet.
 */
export function normalizeTechnicalMeasurements(
  candidateResponse: unknown,
  policy: NormalizationPolicy,
  options: NormalizationOptions = {},
): void {
  if (!isObject(candidateResponse) || !isObject(candidateResponse.ficha_tecnica)) return;

  for (const rule of policy.fields) {
    const field = resolveField(candidateResponse.ficha_tecnica, rule.path);
    if (!field || !VALUE_STATUSES.has(field.status as StatusWithValue)) continue;

    try {
      if (typeof field.valor !== "string") {
        throw normalizationError(rule.path, "measurement_must_be_string_with_unit");
      }

      const normalized = normalizeMeasure(field.valor, rule.path, rule.kind);
      if (normalized.converted) field.valor_original = field.valor;
      else delete field.valor_original;
      field.valor = normalized.value;
    } catch (error) {
      if (options.failureMode !== "downgrade" || !(error instanceof ValidationError)) throw error;
      downgradeInvalidMeasurement(field);
      recordNormalizationWarning(candidateResponse, rule.path);
    }
  }
}

function downgradeInvalidMeasurement(field: MeasureField): void {
  field.valor = null;
  field.status = "nao_encontrado";
  delete field.fonte_ref;
  delete field.valor_original;
  (field as Record<string, unknown>).obs_ref = "NF1";
  delete (field as Record<string, unknown>).observacoes;
}

function recordNormalizationWarning(candidateResponse: Record<string, unknown>, path: string): void {
  const metadata = isObject(candidateResponse.metadados_coleta)
    ? candidateResponse.metadados_coleta
    : null;
  if (!metadata || !Array.isArray(metadata.observacoes_gerais)) return;

  const warning = `Medida tecnica ambigua ou invalida em ${path}; campo rebaixado para nao_encontrado.`;
  if (!metadata.observacoes_gerais.includes(warning)) {
    metadata.observacoes_gerais.push(warning);
  }
}

function resolveField(fichaTecnica: Record<string, unknown>, path: string): MeasureField | null {
  const [group, field] = path.split(".");
  if (!group || !field || !isObject(fichaTecnica[group]) || !isObject(fichaTecnica[group][field])) return null;
  return fichaTecnica[group][field] as MeasureField;
}

function normalizeMeasure(value: string, path: string, kind: NormalizationPolicy["fields"][number]["kind"]): { value: string; converted: boolean } {
  const match = value.normalize("NFKC").trim().match(MEASURE_PATTERN);
  if (!match) throw normalizationError(path, "invalid_measurement_format");

  const numericValue = Number(match[1].replace(",", "."));
  if (!Number.isFinite(numericValue)) throw normalizationError(path, "measurement_not_finite");

  const unit = normalizeUnit(match[2]);
  switch (kind) {
    case "engine_displacement":
      return normalizeDisplacement(numericValue, unit, path);
    case "power":
      return normalizePower(numericValue, unit, path);
    case "torque":
      return normalizeTorque(numericValue, unit, path);
    case "fuel_consumption":
      return normalizeFuelConsumption(numericValue, unit, path);
  }
}

function normalizeDisplacement(value: number, unit: string, path: string): { value: string; converted: boolean } {
  requirePositive(value, path);
  if (unit === "l") return { value: `${formatNumber(value, 3)} L`, converted: false };
  if (unit === "cc" || unit === "cm3") return { value: `${formatNumber(value / 1000, 3)} L`, converted: true };
  throw normalizationError(path, "unit_not_allowed");
}

function normalizePower(value: number, unit: string, path: string): { value: string; converted: boolean } {
  requirePositive(value, path);
  if (unit === "cv") return { value: `${formatNumber(value, 1)} cv`, converted: false };
  if (unit === "kw") return { value: `${formatNumber(value * 1.35962, 1)} cv`, converted: true };
  if (unit === "hp") return { value: `${formatNumber(value * 1.01387, 1)} cv`, converted: true };
  throw normalizationError(path, "unit_not_allowed");
}

function normalizeTorque(value: number, unit: string, path: string): { value: string; converted: boolean } {
  requirePositive(value, path);
  if (unit === "nm") return { value: `${formatNumber(value, 1)} Nm`, converted: false };
  if (unit === "kgfm") return { value: `${formatNumber(value * 9.80665, 1)} Nm`, converted: true };
  throw normalizationError(path, "unit_not_allowed");
}

function normalizeFuelConsumption(value: number, unit: string, path: string): { value: string; converted: boolean } {
  requirePositive(value, path);
  if (unit === "km/l") return { value: `${formatNumber(value, 2)} km/l`, converted: false };
  if (unit === "l/100km") return { value: `${formatNumber(100 / value, 2)} km/l`, converted: true };
  if (unit === "mpg_us") return { value: `${formatNumber(value * 0.425143707, 2)} km/l`, converted: true };
  if (unit === "mpg_uk") return { value: `${formatNumber(value * 0.35400604, 2)} km/l`, converted: true };
  throw normalizationError(path, "unit_not_allowed_or_ambiguous");
}

function normalizeUnit(unit: string): string {
  return unit.toLocaleLowerCase("en-US").replace(/\s+/g, "").replace("³", "3").replace(".", "");
}

function formatNumber(value: number, maximumFractionDigits: number): string {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits, useGrouping: false }).format(value);
}

function requirePositive(value: number, path: string): void {
  if (value <= 0) throw normalizationError(path, "measurement_must_be_positive");
}

function normalizationError(path: string, reason: string): ValidationError {
  return new ValidationError("Medida tecnica invalida para normalizacao.", {
    code: "normalization_invalid_measurement",
    field: path,
    reason
  });
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
