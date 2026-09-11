import { readFieldPolicy, readNormalizationPolicy, readRuntimeMockResponse, readRuntimeSchema, readSourcePolicy } from "../services/api/runtime-assets";
import { ValidationError, type VehicleInput } from "../services/api/types";
import { validateResponse } from "../services/api/validator";

const vehicle: VehicleInput = { marca: "Ford", modelo: "Ranger", versao: "Raptor", ano_modelo: 2025, mercado: "Brasil" };
const [schema, sourcePolicy, normalizationPolicy, fieldPolicy, mock] = await Promise.all([
  readRuntimeSchema(),
  readSourcePolicy(),
  readNormalizationPolicy(),
  readFieldPolicy(),
  readRuntimeMockResponse()
]);

assertPolicyReferencesSchema(schema, fieldPolicy);

const combustion = clone(mock);
setConfirmed(combustion, "identificacao.tipo_carroceria", "caminhonete");
setConfirmed(combustion, "motorizacao.motor_tipo", "combustao");
for (const path of fieldPolicy.conditionalFields.filter((rule) => !rule.applicableTo.includes("combustao")).map((rule) => rule.path)) {
  setNotApplicable(combustion, path);
}
const combustionValidated = validate(combustion);
const summary = combustionValidated.resumo_completude as Record<string, unknown>;
if (summary.total_caminhos !== 204 || summary.caminhos_presentes !== 204 || summary.campos_status_total !== 199 || summary.campos_status_resolvidos !== 199 || summary.colecoes_total !== 5 || summary.colecoes_presentes !== 5) {
  throw new Error("Resumo de cobertura nao corresponde ao contrato 204/199/5.");
}

const invalidGenericValue = clone(combustion);
setConfirmed(invalidGenericValue, "identificacao.tipo_carroceria", "navio");
expectError(invalidGenericValue, "field_policy_value_not_allowed");

const invalidElectricDetail = clone(combustion);
setConfirmed(invalidElectricDetail, "motorizacao.motor_eletrico_presente", false);
expectError(invalidElectricDetail, "conditional_field_requires_not_applicable");

const electric = clone(mock);
setConfirmed(electric, "motorizacao.motor_tipo", "eletrico");
for (const path of fieldPolicy.conditionalFields.filter((rule) => !rule.applicableTo.includes("eletrico")).map((rule) => rule.path)) {
  setNotApplicable(electric, path);
}
validate(electric);

const omittedGroup = clone(mock);
const omittedMotorFieldCount = Object.keys(((omittedGroup.ficha_tecnica as Record<string, unknown>).motorizacao as Record<string, unknown>)).length;
delete (omittedGroup.ficha_tecnica as Record<string, unknown>).motorizacao;
const recoveredGroup = validate(omittedGroup);
const recoveredMotor = ((recoveredGroup.ficha_tecnica as Record<string, unknown>).motorizacao as Record<string, Record<string, unknown>>);
const recoveredGroupSummary = recoveredGroup.resumo_completude as Record<string, unknown>;
if (recoveredGroupSummary.campos_estruturais_completados !== omittedMotorFieldCount || recoveredMotor.potencia_cv?.status !== "nao_encontrado" || recoveredMotor.potencia_cv?.obs_ref !== "NF1") {
  throw new Error("Grupo tecnico ausente deve ser completado como nao encontrado, sem valor ou fonte.");
}

const omittedCollection = clone(mock);
delete ((omittedCollection.ficha_tecnica as Record<string, unknown>).adicionais as Record<string, unknown>).adicionais_tecnologia;
const recoveredCollection = validate(omittedCollection);
const recoveredAdditions = ((recoveredCollection.ficha_tecnica as Record<string, unknown>).adicionais as Record<string, unknown>);
const recoveredCollectionSummary = recoveredCollection.resumo_completude as Record<string, unknown>;
if (recoveredCollectionSummary.campos_estruturais_completados !== 1 || !Array.isArray(recoveredAdditions.adicionais_tecnologia) || recoveredAdditions.adicionais_tecnologia.length !== 0) {
  throw new Error("Colecao obrigatoria ausente deve ser completada com array vazio.");
}

const malformedGroup = clone(mock);
(malformedGroup.ficha_tecnica as Record<string, unknown>).motorizacao = "invalido";
expectError(malformedGroup, "technical_sheet_coverage_incomplete");

console.log("FIELD_POLICY_CHECK=PASS");

function validate(candidate: unknown): Record<string, unknown> {
  return validateResponse(candidate, schema, { vehicle, provider: "simulated", sourcePolicy, normalizationPolicy, fieldPolicy }) as unknown as Record<string, unknown>;
}

function setConfirmed(candidate: Record<string, unknown>, path: string, value: unknown): void {
  const field = getField(candidate, path);
  field.valor = value;
  field.status = "confirmado";
  field.fonte_ref = ["F1"];
  delete field.obs_ref;
  delete field.observacoes;
}

function setNotApplicable(candidate: Record<string, unknown>, path: string): void {
  const field = getField(candidate, path);
  field.valor = null;
  field.status = "nao_aplicavel";
  delete field.fonte_ref;
  delete field.obs_ref;
  delete field.observacoes;
  delete field.valor_original;
}

function getField(candidate: Record<string, unknown>, path: string): Record<string, unknown> {
  const [group, field] = path.split(".");
  const ficha = candidate.ficha_tecnica as Record<string, unknown>;
  const groupValue = ficha[group] as Record<string, unknown>;
  return groupValue[field] as Record<string, unknown>;
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

function assertPolicyReferencesSchema(schemaValue: Record<string, unknown>, policy: typeof fieldPolicy): void {
  const schemaPaths = extractSchemaPaths(schemaValue);
  const policyPaths = [policy.body.field, policy.propulsion.field, ...policy.conditionalFields.map((rule) => rule.path), ...Object.values(policy.extensionFamilies).flat()];
  const unknown = policyPaths.filter((path) => !schemaPaths.has(path));
  if (unknown.length > 0) throw new Error(`Politica referencia campos fora do schema: ${unknown.join(", ")}`);
}

function extractSchemaPaths(schemaValue: Record<string, unknown>): Set<string> {
  const root = schemaValue.properties as Record<string, unknown>;
  const ficha = (root.ficha_tecnica as Record<string, unknown>).properties as Record<string, unknown>;
  const paths = new Set<string>();
  for (const [groupName, group] of Object.entries(ficha)) {
    for (const field of (group as Record<string, unknown>).required as string[]) paths.add(`${groupName}.${field}`);
  }
  return paths;
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
