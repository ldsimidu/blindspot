import { readFieldPolicy, readFieldStatePolicy, readNormalizationPolicy, readQualityPolicy, readRuntimeMockResponse, readRuntimeSchema, readSourcePolicy } from "../services/api/runtime-assets";
import { ValidationError, type VehicleInput } from "../services/api/types";
import { validateResponse } from "../services/api/validator";

const vehicle: VehicleInput = { marca: "Ford", modelo: "Ranger", versao: "Raptor", ano_modelo: 2025, mercado: "Brasil" };
const [schema, sourcePolicy, normalizationPolicy, fieldPolicy, qualityPolicy, fieldStatePolicy, mock] = await Promise.all([
  readRuntimeSchema(),
  readSourcePolicy(),
  readNormalizationPolicy(),
  readFieldPolicy(),
  readQualityPolicy(),
  readFieldStatePolicy(),
  readRuntimeMockResponse()
]);

const validConflict = clone(mock);
validConflict.fontes_utilizadas.push({ id: "F2", url: "https://example.com/fonte-secundaria", titulo: "Fonte secundaria mock", tipo: "mock_local" });
setConflict(validConflict, ["F1", "F2"]);
validate(validConflict);

const validPartial = clone(mock);
setPartial(validPartial, ["F1"]);
validate(validPartial);

const oneSourceConflict = clone(mock);
setConflict(oneSourceConflict, ["F1"]);
expectError(oneSourceConflict, "conflict_requires_distinct_sources");

const repeatedSourceConflict = clone(mock);
repeatedSourceConflict.fontes_utilizadas.push({ id: "F2", url: "https://example.com/fonte-secundaria", titulo: "Fonte secundaria mock", tipo: "mock_local" });
setConflict(repeatedSourceConflict, ["F1", "F1"]);
expectError(repeatedSourceConflict, "conflict_requires_distinct_sources");

console.log("QUALITY_POLICY_CHECK=PASS");

function validate(candidate: unknown): void {
  validateResponse(candidate, schema, { vehicle, provider: "simulated", sourcePolicy, normalizationPolicy, fieldPolicy, qualityPolicy, fieldStatePolicy });
}

function setConflict(candidate: Record<string, unknown>, sources: string[]): void {
  const field = ((candidate.ficha_tecnica as Record<string, unknown>).motorizacao as Record<string, unknown>).potencia_cv as Record<string, unknown>;
  field.valor = null;
  field.status = "conflitante";
  field.fonte_ref = sources;
  field.alternativas = sources.map((source, index) => ({ valor: `${210 + index} cv`, fonte_ref: [source] }));
  field.obs_ref = "CF1";
  delete field.observacoes;
}

function setPartial(candidate: Record<string, unknown>, sources: string[]): void {
  const field = ((candidate.ficha_tecnica as Record<string, unknown>).motorizacao as Record<string, unknown>).potencia_cv as Record<string, unknown>;
  field.valor = "210 cv";
  field.status = "parcial";
  field.fonte_ref = sources;
  field.obs_ref = "NF1";
}

function expectError(candidate: unknown, code: string): void {
  try {
    validate(candidate);
  } catch (error) {
    if (error instanceof ValidationError && isRecord(error.details) && error.details.code === code) return;
    throw error;
  }
  throw new Error(`Expected validation error ${code}.`);
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
