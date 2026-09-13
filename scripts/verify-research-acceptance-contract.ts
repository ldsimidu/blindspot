import assert from "node:assert/strict";
import { readRuntimeMockResponse, readRuntimeSchema, readSourcePolicy, readNormalizationPolicy, readFieldPolicy, readQualityPolicy, readFieldStatePolicy } from "../services/api/runtime-assets";
import { projectFieldState } from "../services/api/field-state";
import { validateResponse } from "../services/api/validator";
import { ValidationError } from "../services/api/types";

const vehicle = { marca: "BYD", modelo: "Fixture de aceite", versao: "Simulado", ano_modelo: 2099, mercado: "Brasil" };
const [schema, sourcePolicy, normalizationPolicy, fieldPolicy, qualityPolicy, fieldStatePolicy] = await Promise.all([
  readRuntimeSchema(), readSourcePolicy(), readNormalizationPolicy(), readFieldPolicy(), readQualityPolicy(), readFieldStatePolicy(),
]);
const context = { vehicle, provider: "simulated" as const, sourcePolicy, normalizationPolicy, fieldPolicy, qualityPolicy, fieldStatePolicy };

assert.equal(projectFieldState({}, fieldStatePolicy).state, "unknown");
assert.equal(projectFieldState({ valor: null, status: "nao_aplicavel" }, fieldStatePolicy).state, "not_applicable");

const missingSource = await readRuntimeMockResponse();
const missingSourceField = (missingSource.ficha_tecnica as Record<string, unknown>).motorizacao as Record<string, unknown>;
(missingSourceField.potencia_cv as Record<string, unknown>).fonte_ref = ["source-does-not-exist"];
expectValidation(() => validateResponse(missingSource, schema, context), "source absent");

const incompatibleIdentity = await readRuntimeMockResponse();
(incompatibleIdentity.veiculo_alvo as Record<string, unknown>).marca = "Outra marca";
expectValidation(() => validateResponse(incompatibleIdentity, schema, context), "incompatible identity", "vehicle_identity_mismatch");
expectValidation(() => validateResponse({ invalid: true }, schema, context), "invalid response");

console.log("RESEARCH_ACCEPTANCE_CONTRACT=PASS");

function expectValidation(run: () => unknown, label: string, code?: string): void {
  try {
    run();
  } catch (error) {
    assert.equal(error instanceof ValidationError, true, `${label} must be a controlled validation error`);
    if (code) assert.equal((error as ValidationError).details && typeof (error as ValidationError).details === "object" && (error as { details: { code?: string } }).details.code === code, true, `${label} must expose ${code}`);
    return;
  }
  throw new Error(`${label} should fail safely.`);
}
