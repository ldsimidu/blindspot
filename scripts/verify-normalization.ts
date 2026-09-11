import { readRuntimeMockResponse, readRuntimeSchema, readNormalizationPolicy, readSourcePolicy } from "../services/api/runtime-assets";
import { ValidationError, type VehicleInput } from "../services/api/types";
import { validateResponse } from "../services/api/validator";

const vehicle: VehicleInput = { marca: "Ford", modelo: "Ranger", versao: "Raptor", ano_modelo: 2025, mercado: "Brasil" };
const [schema, sourcePolicy, normalizationPolicy, mock] = await Promise.all([
  readRuntimeSchema(),
  readSourcePolicy(),
  readNormalizationPolicy(),
  readRuntimeMockResponse()
]);

const converted = clone(mock);
setMeasure(converted, "cilindrada_l", "1996 cc");
setMeasure(converted, "potencia_cv", "292 kW");
setMeasure(converted, "torque_nm", "50 kgfm");
setMeasure(converted, "consumo_valor", "10 L/100 km");
const normalized = validate(converted);
expectField(normalized, "cilindrada_l", "1.996 L", "1996 cc");
expectField(normalized, "potencia_cv", "397 cv", "292 kW");
expectField(normalized, "torque_nm", "490.3 Nm", "50 kgfm");
expectField(normalized, "consumo_valor", "10 km/l", "10 L/100 km");

const canonical = clone(mock);
setMeasure(canonical, "potencia_cv", "397 cv");
const canonicalNormalized = validate(canonical);
expectField(canonicalNormalized, "potencia_cv", "397 cv", undefined);

const ambiguousMpg = clone(mock);
setMeasure(ambiguousMpg, "consumo_valor", "30 mpg");
expectInvalid(ambiguousMpg, "consumo_valor", "unit_not_allowed_or_ambiguous");

const invalidNoValue = clone(mock);
setMeasure(invalidNoValue, "torque_nm", "0 Nm");
expectInvalid(invalidNoValue, "torque_nm", "measurement_must_be_positive");

const compoundConsumption = clone(mock);
setMeasure(compoundConsumption, "consumo_valor", "6.7 km/l 7.4 km/l");
const downgraded = validate(compoundConsumption, "downgrade");
const downgradedConsumption = getField(downgraded, "consumo_valor");
if (
  downgradedConsumption.status !== "nao_encontrado" ||
  downgradedConsumption.valor !== null ||
  downgradedConsumption.obs_ref !== "NF1" ||
  "fonte_ref" in downgradedConsumption ||
  "valor_original" in downgradedConsumption
) {
  throw new Error("Compound consumption must be isolated as nao_encontrado.");
}
const metadata = downgraded.metadados_coleta as Record<string, unknown>;
if (!Array.isArray(metadata.observacoes_gerais) || !metadata.observacoes_gerais.some((item) => item === "Medida tecnica ambigua ou invalida em motorizacao.consumo_valor; campo rebaixado para nao_encontrado.")) {
  throw new Error("Downgrade must leave a sanitized normalization warning.");
}

const absent = clone(mock);
const absentField = getField(absent, "consumo_valor");
absentField.valor = null;
absentField.status = "nao_encontrado";
absentField.obs_ref = "NF1";
delete absentField.fonte_ref;
validate(absent);

console.log("NORMALIZATION_CHECK=PASS");

function validate(candidate: unknown, normalizationFailureMode?: "reject" | "downgrade"): Record<string, unknown> {
  return validateResponse(candidate, schema, { vehicle, provider: "simulated", sourcePolicy, normalizationPolicy, normalizationFailureMode }) as unknown as Record<string, unknown>;
}

function setMeasure(candidate: Record<string, unknown>, field: string, value: string): void {
  const target = getField(candidate, field);
  target.valor = value;
  target.status = "confirmado";
  target.fonte_ref = ["F1"];
  delete target.obs_ref;
}

function getField(candidate: Record<string, unknown>, field: string): Record<string, unknown> {
  const ficha = candidate.ficha_tecnica as Record<string, unknown>;
  const motorizacao = ficha.motorizacao as Record<string, unknown>;
  return motorizacao[field] as Record<string, unknown>;
}

function expectField(candidate: Record<string, unknown>, field: string, value: string, original: string | undefined): void {
  const actual = getField(candidate, field);
  if (actual.valor !== value || actual.valor_original !== original) throw new Error(`Unexpected normalized ${field}.`);
}

function expectInvalid(candidate: Record<string, unknown>, field: string, reason: string): void {
  try {
    validate(candidate);
  } catch (error) {
    if (error instanceof ValidationError && isRecord(error.details) && error.details.field === `motorizacao.${field}` && error.details.reason === reason) return;
    throw error;
  }
  throw new Error(`Expected invalid normalization for ${field}.`);
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
