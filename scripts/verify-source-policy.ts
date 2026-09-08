import { readRuntimeMockResponse, readRuntimeSchema, readSourcePolicy } from "../services/api/runtime-assets";
import { ValidationError, type VehicleInput } from "../services/api/types";
import { validateResponse } from "../services/api/validator";

const vehicle: VehicleInput = { marca: "Ford", modelo: "Ranger", versao: "Raptor", ano_modelo: 2025, mercado: "Brasil" };
const [schema, policy, mock] = await Promise.all([readRuntimeSchema(), readSourcePolicy(), readRuntimeMockResponse()]);

expectValid(mock, "simulated");

const mismatchedVehicle = clone(mock);
mismatchedVehicle.veiculo_alvo.ano_modelo = 2024;
expectValidationCode(mismatchedVehicle, "simulated", "vehicle_identity_mismatch");

const unapprovedHost = clone(mock);
unapprovedHost.fontes_utilizadas[0] = { ...unapprovedHost.fontes_utilizadas[0], tipo: "site_oficial_montadora", url: "https://ford.example.invalid/spec" };
expectValidationCode(unapprovedHost, "openrouter", "source_policy_violation");

const simulatedSourceOnRemoteProvider = clone(mock);
expectValidationCode(simulatedSourceOnRemoteProvider, "openrouter", "source_policy_violation");

console.log("SOURCE_POLICY_CHECK=PASS");

function expectValid(candidate: unknown, provider: "claude" | "openrouter" | "simulated"): void {
  validateResponse(candidate, schema, { vehicle, provider, sourcePolicy: policy });
}

function expectValidationCode(candidate: unknown, provider: "claude" | "openrouter" | "simulated", code: string): void {
  try {
    expectValid(candidate, provider);
  } catch (error) {
    if (error instanceof ValidationError && isRecord(error.details) && error.details.code === code) return;
    throw error;
  }
  throw new Error(`Expected validation code ${code}.`);
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
