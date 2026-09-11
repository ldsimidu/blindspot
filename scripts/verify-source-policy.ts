import { readRuntimeMockResponse, readRuntimeSchema, readSourcePolicy } from "../services/api/runtime-assets";
import { ValidationError, type VehicleInput } from "../services/api/types";
import { validateResponse } from "../services/api/validator";

const vehicle: VehicleInput = { marca: "Ford", modelo: "Ranger", versao: "Raptor", ano_modelo: 2025, mercado: "Brasil" };
const [schema, policy, mock] = await Promise.all([readRuntimeSchema(), readSourcePolicy(), readRuntimeMockResponse()]);

const simulated = expectValid(mock, "simulated");
expectAssessment(simulated, "F1", "fonte_simulada_local");

const forgedAssessment = clone(mock);
forgedAssessment.fontes_utilizadas[0].avaliacao_politica = { status: "na_lista_aprovada", versao: "forjada" };
const forgedAssessmentResult = expectValid(forgedAssessment, "openrouter");
expectAssessment(forgedAssessmentResult, "F1", "fora_da_lista_aprovada", "tipo_declarado_nao_classificado");

const mismatchedVehicle = clone(mock);
mismatchedVehicle.veiculo_alvo.ano_modelo = 2024;
expectValidationCode(mismatchedVehicle, "simulated", "vehicle_identity_mismatch");

const unapprovedHost = clone(mock);
unapprovedHost.fontes_utilizadas[0] = { ...unapprovedHost.fontes_utilizadas[0], tipo: "site_oficial_montadora", url: "https://ford.example.invalid/spec" };
const unapprovedHostResult = expectValid(unapprovedHost, "openrouter");
expectAssessment(unapprovedHostResult, "F1", "fora_da_lista_aprovada", "host_oficial_nao_listado_para_marca_mercado");

const simulatedSourceOnRemoteProvider = clone(mock);
const simulatedSourceOnRemoteProviderResult = expectValid(simulatedSourceOnRemoteProvider, "openrouter");
expectAssessment(simulatedSourceOnRemoteProviderResult, "F1", "fora_da_lista_aprovada", "tipo_declarado_nao_classificado");

const httpSource = clone(mock);
httpSource.fontes_utilizadas[0] = { ...httpSource.fontes_utilizadas[0], url: "http://example.com/fonte-primaria" };
const httpSourceResult = expectValid(httpSource, "openrouter");
expectAssessment(httpSourceResult, "F1", "nao_rastreavel_com_seguranca", "url_nao_https_ou_invalida");

const ungovernedMarketVehicle: VehicleInput = { ...vehicle, mercado: "Estados Unidos" };
const ungovernedMarket = clone(mock);
ungovernedMarket.veiculo_alvo.mercado = ungovernedMarketVehicle.mercado;
const ungovernedMarketResult = expectValidForVehicle(ungovernedMarket, "openrouter", ungovernedMarketVehicle);
expectAssessment(ungovernedMarketResult, "F1", "sem_politica_para_mercado", "mercado_sem_politica_local");

const bydVehicle: VehicleInput = { marca: "BYD", modelo: "King", versao: "GL", ano_modelo: 2025, mercado: "Brasil" };
const dynamicOfficial = clone(mock);
dynamicOfficial.veiculo_alvo = { ...bydVehicle };
dynamicOfficial.fontes_utilizadas[0] = { ...dynamicOfficial.fontes_utilizadas[0], tipo: "catalogo_ou_ficha_tecnica_oficial", url: "https://www.byd.com/br/king/ficha-2025.pdf" };
const dynamicOfficialResult = expectValidForVehicle(dynamicOfficial, "openrouter", bydVehicle, ["byd.com"]);
expectAssessment(dynamicOfficialResult, "F1", "na_lista_aprovada");

const partnerWithoutBrandPolicy = clone(dynamicOfficial);
partnerWithoutBrandPolicy.fontes_utilizadas[0] = { ...partnerWithoutBrandPolicy.fontes_utilizadas[0], tipo: "imprensa_automotiva_reconhecida", url: "https://motor1.uol.com.br/news/byd-king" };
const partnerWithoutBrandPolicyResult = expectValidForVehicle(partnerWithoutBrandPolicy, "openrouter", bydVehicle);
expectAssessment(partnerWithoutBrandPolicyResult, "F1", "na_lista_aprovada");

const unapprovedPressWithoutBrandPolicy = clone(dynamicOfficial);
unapprovedPressWithoutBrandPolicy.fontes_utilizadas[0] = { ...unapprovedPressWithoutBrandPolicy.fontes_utilizadas[0], tipo: "imprensa_automotiva_reconhecida", url: "https://www.carrosnaweb.com.br/fichadetalhe.asp" };
const unapprovedPressResult = expectValidForVehicle(unapprovedPressWithoutBrandPolicy, "openrouter", bydVehicle);
expectAssessment(unapprovedPressResult, "F1", "fora_da_lista_aprovada", "host_parceiro_nao_listado");

console.log("SOURCE_POLICY_CHECK=PASS");

function expectValid(candidate: unknown, provider: "claude" | "openrouter" | "simulated") {
  return expectValidForVehicle(candidate, provider, vehicle);
}

function expectValidForVehicle(candidate: unknown, provider: "claude" | "openrouter" | "simulated", requestedVehicle: VehicleInput, runtimeFirstPartyDomains: string[] = []) {
  return validateResponse(candidate, schema, { vehicle: requestedVehicle, provider, sourcePolicy: policy, runtimeFirstPartyDomains });
}

function expectAssessment(candidate: ReturnType<typeof expectValid>, sourceId: string, status: string, reason?: string): void {
  const source = candidate.fontes_utilizadas.find((item) => item.id === sourceId);
  if (!source || source.avaliacao_politica?.status !== status || (reason && !source.avaliacao_politica.motivos?.includes(reason))) {
    throw new Error(`Expected ${sourceId} to be classified as ${status}.`);
  }
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
