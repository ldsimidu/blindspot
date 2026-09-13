import Ajv2020, { ErrorObject } from "ajv/dist/2020";
import addFormats from "ajv-formats";
import type { FichaTecnicaResponse } from "./types";
import { ValidationError, type VehicleInput } from "./types";
import type { SourcePolicy } from "./runtime-assets";
import type { NormalizationPolicy } from "./runtime-assets";
import { normalizeTechnicalMeasurements } from "./normalizer";
import type { NormalizationFailureMode } from "./normalizer";
import type { FieldPolicy } from "./runtime-assets";
import { validateFieldPolicy } from "./field-policy-validator";
import type { QualityPolicy } from "./runtime-assets";
import { validateQualityPolicy } from "./quality-policy-validator";
import type { FieldStatePolicy } from "./runtime-assets";
import { projectFieldState } from "./field-state";

interface ValidationContext {
  vehicle: VehicleInput;
  provider: "claude" | "openrouter" | "simulated";
  sourcePolicy: SourcePolicy;
  runtimeFirstPartyDomains?: string[];
  normalizationPolicy?: NormalizationPolicy;
  normalizationFailureMode?: NormalizationFailureMode;
  fieldPolicy?: FieldPolicy;
  qualityPolicy?: QualityPolicy;
  fieldStatePolicy?: FieldStatePolicy;
}

export function validateResponse(
  candidateResponse: unknown,
  outputSchema: Record<string, unknown>,
  context?: ValidationContext
): FichaTecnicaResponse {
  const normalizedResponse = normalizeCandidateResponse(candidateResponse);
  const structurallyCompletedFields = completeMissingTechnicalSheetFields(normalizedResponse, outputSchema);
  normalizeStatusFieldShapes(normalizedResponse);
  if (context?.normalizationPolicy) {
    normalizeTechnicalMeasurements(normalizedResponse, context.normalizationPolicy, {
      failureMode: context.normalizationFailureMode,
    });
  }
  if (context) applyRequestedVehicleIdentity(normalizedResponse, context.vehicle);
  rejectUnauthorizedInputProvenance(normalizedResponse);
  if (context?.fieldPolicy) validateFieldPolicy(normalizedResponse, context.fieldPolicy);
  if (context?.qualityPolicy) validateQualityPolicy(normalizedResponse, context.qualityPolicy);
  if (context?.fieldStatePolicy) validateFieldStates(normalizedResponse, context.fieldStatePolicy);
  enrichResumoCompletude(normalizedResponse, outputSchema, context?.fieldPolicy, structurallyCompletedFields);
  if (context) classifySourcePolicy(normalizedResponse, context);
  validateWithAjv(normalizedResponse, outputSchema);
  validateFonteRefConsistency(normalizedResponse);
  if (context) {
    validateVehicleIdentity(normalizedResponse, context.vehicle);
  }

  return normalizedResponse as FichaTecnicaResponse;
}

function validateFieldStates(candidateResponse: unknown, policy: FieldStatePolicy): void {
  if (!isObject(candidateResponse) || !isObject(candidateResponse.ficha_tecnica)) return;
  walkStatusFields(candidateResponse.ficha_tecnica, "", (field) => { projectFieldState(field, policy); });
}

function validateVehicleIdentity(candidateResponse: unknown, requestedVehicle: VehicleInput): void {
  if (!isObject(candidateResponse) || !isObject(candidateResponse.veiculo_alvo)) {
    throw new ValidationError("Resposta precisa declarar o veiculo alvo.");
  }

  const returnedVehicle = candidateResponse.veiculo_alvo;
  const fields: Array<keyof VehicleInput> = ["marca", "modelo", "versao", "ano_modelo", "mercado"];
  const mismatches = fields.filter((field) => normalizeIdentityValue(returnedVehicle[field]) !== normalizeIdentityValue(requestedVehicle[field]));

  if (mismatches.length > 0) {
    throw new ValidationError("Resposta nao corresponde ao veiculo solicitado.", {
      code: "vehicle_identity_mismatch",
      fields: mismatches
    });
  }
}

function applyRequestedVehicleIdentity(candidateResponse: unknown, requestedVehicle: VehicleInput): void {
  if (!isObject(candidateResponse) || !isObject(candidateResponse.ficha_tecnica)) return;
  const identification = candidateResponse.ficha_tecnica.identificacao;
  if (!isObject(identification)) return;

  const identityValues: Record<keyof VehicleInput, string | number> = {
    marca: requestedVehicle.marca,
    modelo: requestedVehicle.modelo,
    versao: requestedVehicle.versao,
    ano_modelo: requestedVehicle.ano_modelo,
    mercado: requestedVehicle.mercado,
  };

  for (const [field, value] of Object.entries(identityValues)) {
    identification[field] = {
      valor: value,
      status: "informado_na_entrada",
      origem: "entrada_usuario",
    };
  }
}

function rejectUnauthorizedInputProvenance(candidateResponse: unknown): void {
  if (!isObject(candidateResponse) || !isObject(candidateResponse.ficha_tecnica)) return;
  const allowedPaths = new Set([
    "identificacao.marca",
    "identificacao.modelo",
    "identificacao.versao",
    "identificacao.ano_modelo",
    "identificacao.mercado",
  ]);
  const unauthorized: string[] = [];

  walkStatusFields(candidateResponse.ficha_tecnica, "", (field, path) => {
    if (field.status === "informado_na_entrada" && !allowedPaths.has(path)) unauthorized.push(path);
  });

  if (unauthorized.length > 0) {
    throw new ValidationError("Proveniencia de entrada so pode ser usada na identidade do veiculo solicitado.", {
      code: "input_provenance_not_allowed_for_field",
      fields: unauthorized,
    });
  }
}

function walkStatusFields(
  node: unknown,
  path: string,
  visit: (field: Record<string, unknown>, path: string) => void,
): void {
  if (Array.isArray(node)) {
    node.forEach((item, index) => walkStatusFields(item, `${path}[${index}]`, visit));
    return;
  }
  if (!isObject(node)) return;
  if (typeof node.status === "string") visit(node, path);
  for (const [key, value] of Object.entries(node)) {
    if (["valor", "status", "origem", "fonte_ref", "obs_ref", "observacoes", "valor_original"].includes(key)) continue;
    walkStatusFields(value, path ? `${path}.${key}` : key, visit);
  }
}

function classifySourcePolicy(candidateResponse: unknown, context: ValidationContext): void {
  if (!isObject(candidateResponse) || !Array.isArray(candidateResponse.fontes_utilizadas)) return;

  const policyMarket = context.sourcePolicy.markets.find(
    (entry) =>
      normalizeIdentityValue(entry.brand) === normalizeIdentityValue(context.vehicle.marca) &&
      normalizeIdentityValue(entry.market) === normalizeIdentityValue(context.vehicle.mercado)
  );

  for (const source of candidateResponse.fontes_utilizadas) {
    if (!isObject(source)) continue;
    delete source.avaliacao_politica;
    const type = typeof source.tipo === "string" ? source.tipo : "";
    const host = parseHttpsHost(source.url);

    if (!host) {
      source.avaliacao_politica = createSourceAssessment(context.sourcePolicy.version, "nao_rastreavel_com_seguranca", ["url_nao_https_ou_invalida"]);
      continue;
    }

    if (context.provider === "simulated") {
      const isLocalMock = context.sourcePolicy.simulated.allowedSourceTypes.includes(type) && hostMatchesAny(host, context.sourcePolicy.simulated.allowedHosts);
      source.avaliacao_politica = isLocalMock
        ? createSourceAssessment(context.sourcePolicy.version, "fonte_simulada_local")
        : classifyRemoteSource(context.sourcePolicy, policyMarket, type, host, context.runtimeFirstPartyDomains);
      continue;
    }

    source.avaliacao_politica = classifyRemoteSource(context.sourcePolicy, policyMarket, type, host, context.runtimeFirstPartyDomains);
  }
}

function classifyRemoteSource(
  policy: SourcePolicy,
  policyMarket: SourcePolicy["markets"][number] | undefined,
  type: string,
  host: string,
  runtimeFirstPartyDomains: string[] = [],
): Record<string, unknown> {
  const approvedOfficialDomains = [...(policyMarket?.officialDomains ?? []), ...runtimeFirstPartyDomains];
  if (policy.officialSourceTypes.includes(type) && hostMatchesAny(host, approvedOfficialDomains)) {
    return createSourceAssessment(policy.version, "na_lista_aprovada");
  }

  if (policy.partnerSourceTypes.includes(type) && hostMatchesAny(host, policy.partnerDomains)) {
    return createSourceAssessment(policy.version, "na_lista_aprovada");
  }

  if (
    !policyMarket &&
    runtimeFirstPartyDomains.length === 0 &&
    !policy.officialSourceTypes.includes(type) &&
    !policy.partnerSourceTypes.includes(type)
  ) {
    return createSourceAssessment(policy.version, "sem_politica_para_mercado", ["mercado_sem_politica_local"]);
  }

  const reasons: string[] = [];
  if (!policy.officialSourceTypes.includes(type) && !policy.partnerSourceTypes.includes(type)) reasons.push("tipo_declarado_nao_classificado");
  if (policy.officialSourceTypes.includes(type)) reasons.push("host_oficial_nao_listado_para_marca_mercado");
  if (policy.partnerSourceTypes.includes(type)) reasons.push("host_parceiro_nao_listado");
  return createSourceAssessment(policy.version, "fora_da_lista_aprovada", reasons);
}

function createSourceAssessment(version: string, status: string, reasons: string[] = []): Record<string, unknown> {
  return {
    status,
    versao: version,
    ...(reasons.length > 0 ? { motivos: reasons } : {})
  };
}

function parseHttpsHost(value: unknown): string | null {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.hostname.toLowerCase().replace(/\.$/, "") : null;
  } catch {
    return null;
  }
}

function hostMatchesAny(host: string, allowedHosts: string[]): boolean {
  return allowedHosts.some((allowedHost) => {
    const normalizedAllowedHost = allowedHost.toLowerCase().replace(/\.$/, "");
    return host === normalizedAllowedHost || host.endsWith(`.${normalizedAllowedHost}`);
  });
}

function normalizeIdentityValue(value: unknown): string {
  if (typeof value === "number") return String(value);
  return typeof value === "string" ? value.normalize("NFKC").trim().replace(/\s+/g, " ").toLocaleLowerCase("pt-BR") : "";
}

function normalizeCandidateResponse(candidateResponse: unknown): unknown {
  if (!isObject(candidateResponse)) {
    return candidateResponse;
  }

  if (looksLikeFichaTecnicaResponse(candidateResponse)) {
    return candidateResponse;
  }

  if (isObject(candidateResponse.result)) {
    return candidateResponse.result;
  }

  const extractedFromTurns = extractFromTurns(candidateResponse.turns);
  if (extractedFromTurns) {
    return extractedFromTurns;
  }

  return candidateResponse;
}

/**
 * A provider can return valid JSON while omitting required technical-sheet
 * properties. An omission is never evidence: complete only absent schema paths
 * with the existing not-found representation, never with a value or source.
 * Values that are present but malformed remain validation failures.
 */
function completeMissingTechnicalSheetFields(candidateResponse: unknown, outputSchema: Record<string, unknown>): number {
  if (!isRecordObject(candidateResponse) || !isRecordObject(candidateResponse.ficha_tecnica)) return 0;

  const rootProperties = isRecordObject(outputSchema.properties) ? outputSchema.properties : null;
  const fichaSchema = rootProperties && isRecordObject(rootProperties.ficha_tecnica) ? rootProperties.ficha_tecnica : null;
  const groups = fichaSchema && isRecordObject(fichaSchema.properties) ? fichaSchema.properties : null;
  if (!groups) return 0;

  const fichaTecnica = candidateResponse.ficha_tecnica;
  let completed = 0;
  for (const [groupName, groupSchema] of Object.entries(groups)) {
    if (!isRecordObject(groupSchema) || !Array.isArray(groupSchema.required) || !isRecordObject(groupSchema.properties)) continue;
    if (!Object.prototype.hasOwnProperty.call(fichaTecnica, groupName)) fichaTecnica[groupName] = {};
    const group = fichaTecnica[groupName];
    if (!isRecordObject(group)) continue;

    for (const fieldName of groupSchema.required) {
      if (typeof fieldName !== "string" || Object.prototype.hasOwnProperty.call(group, fieldName)) continue;
      const fieldSchema = groupSchema.properties[fieldName];
      group[fieldName] = isArrayFieldSchema(fieldSchema)
        ? []
        : { valor: null, status: "nao_encontrado", obs_ref: "NF1" };
      completed += 1;
    }
  }
  return completed;
}

function isArrayFieldSchema(value: unknown): boolean {
  return isRecordObject(value) && value.type === "array";
}

function validateWithAjv(candidateResponse: unknown, outputSchema: Record<string, unknown>): void {
  const ajv = new Ajv2020({
    allErrors: true,
    strict: false
  });

  addFormats(ajv);

  const validate = ajv.compile(outputSchema);
  const isValid = validate(candidateResponse);

  if (!isValid) {
    throw new ValidationError("Resposta do LLM invalida para o schema.", {
      code: "schema_validation_failed",
      ajvErrors: formatAjvErrors(validate.errors ?? []),
      schemaIssues: formatAjvIssues(validate.errors ?? [])
    });
  }
}

function validateFonteRefConsistency(candidateResponse: unknown): void {
  if (!isObject(candidateResponse)) {
    throw new ValidationError("Resposta precisa ser um objeto JSON.");
  }

  const fontesUtilizadas = candidateResponse.fontes_utilizadas;
  if (!Array.isArray(fontesUtilizadas)) {
    throw new ValidationError("Campo fontes_utilizadas ausente ou invalido.");
  }

  const validSourceIds = new Set<string>();
  for (const fonte of fontesUtilizadas) {
    if (!isObject(fonte) || typeof fonte.id !== "string") {
      continue;
    }
    validSourceIds.add(fonte.id);
  }

  const missingRefs: string[] = [];
  walkForFonteRef(candidateResponse, "$", validSourceIds, missingRefs);

  if (missingRefs.length > 0) {
    throw new ValidationError("Foram encontradas referencias fonte_ref sem fonte correspondente.", {
      missingFonteRefs: missingRefs
    });
  }
}

function walkForFonteRef(
  node: unknown,
  currentPath: string,
  validSourceIds: Set<string>,
  missingRefs: string[]
): void {
  if (Array.isArray(node)) {
    node.forEach((item, index) => {
      walkForFonteRef(item, `${currentPath}[${index}]`, validSourceIds, missingRefs);
    });
    return;
  }

  if (!isObject(node)) {
    return;
  }

  for (const [key, value] of Object.entries(node)) {
    const nextPath = `${currentPath}.${key}`;
    if (key === "fonte_ref" && Array.isArray(value)) {
      value.forEach((fonteId, index) => {
        if (typeof fonteId !== "string" || !validSourceIds.has(fonteId)) {
          missingRefs.push(`${nextPath}[${index}]: ${String(fonteId)}`);
        }
      });
      continue;
    }

    walkForFonteRef(value, nextPath, validSourceIds, missingRefs);
  }
}

function formatAjvErrors(errors: ErrorObject[]): string[] {
  return errors.map((error) => {
    const path = error.instancePath || "/";
    return `${path} ${error.message ?? "erro de validacao"}`;
  });
}

export interface SchemaValidationIssue {
  path: string;
  keyword: string;
}

export function formatAjvIssues(errors: ErrorObject[]): SchemaValidationIssue[] {
  return errors.slice(0, 20).map((error) => {
    const missingProperty = error.keyword === "required" && typeof error.params.missingProperty === "string"
      ? safeSchemaSegment(error.params.missingProperty)
      : null;
    const basePath = safeSchemaPath(error.instancePath || "/");
    const path = missingProperty
      ? `${basePath === "/" ? "" : basePath}/${missingProperty}`
      : basePath;
    return {
      path: path || "/",
      keyword: safeSchemaKeyword(error.keyword),
    };
  });
}

function safeSchemaPath(value: string): string {
  const limited = value.slice(0, 240);
  return /^\/(?:[A-Za-z0-9_.~-]+\/?)*$/.test(limited) ? limited : "/[redacted]";
}

function safeSchemaSegment(value: string): string {
  return /^[A-Za-z0-9_.-]{1,100}$/.test(value) ? value : "[redacted]";
}

function safeSchemaKeyword(value: string): string {
  const allowed = new Set(["required", "type", "enum", "const", "format", "minimum", "maximum", "minLength", "maxLength", "minItems", "maxItems", "uniqueItems", "additionalProperties", "anyOf", "oneOf", "allOf", "not"]);
  return allowed.has(value) ? value : "schema_rule";
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isRecordObject(value: unknown): value is Record<string, unknown> {
  return isObject(value) && !Array.isArray(value);
}

function looksLikeFichaTecnicaResponse(value: Record<string, unknown>): boolean {
  return (
    isObject(value.veiculo_alvo) &&
    Array.isArray(value.fontes_utilizadas) &&
    isObject(value.ficha_tecnica) &&
    isObject(value.resumo_completude)
  );
}

function extractFromTurns(turns: unknown): unknown | null {
  if (!Array.isArray(turns)) {
    return null;
  }

  for (let i = turns.length - 1; i >= 0; i -= 1) {
    const turn = turns[i];
    if (!isObject(turn) || !isObject(turn.response)) {
      continue;
    }

    const response = turn.response;
    const content = response.content;
    if (!Array.isArray(content)) {
      continue;
    }

    const text = content
      .filter((block) => isObject(block) && block.type === "text" && typeof block.text === "string")
      .map((block) => String(block.text))
      .join("\n")
      .trim();

    if (!text) {
      continue;
    }

    const parsed = tryParsePossiblyFencedJson(text);
    if (parsed) {
      return parsed;
    }
  }

  return null;
}

function tryParsePossiblyFencedJson(text: string): unknown | null {
  const fencedMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  const candidate = fencedMatch ? fencedMatch[1] : text;

  try {
    return JSON.parse(candidate);
  } catch {
    return null;
  }
}

function enrichResumoCompletude(candidateResponse: unknown, outputSchema: Record<string, unknown>, fieldPolicy?: FieldPolicy, structurallyCompletedFields = 0): void {
  if (!isObject(candidateResponse) || !isObject(candidateResponse.ficha_tecnica)) {
    return;
  }

  const counters = {
    total_variaveis: 0,
    preenchidas: 0,
    informadas_na_entrada: 0,
    total_pesquisaveis: 0,
    nao_encontradas: 0,
    nao_aplicaveis: 0,
    conflitantes: 0
  };

  walkAndCountStatus(candidateResponse.ficha_tecnica, counters);

  candidateResponse.resumo_completude = {
    total_variaveis: counters.total_variaveis,
    preenchidas: counters.preenchidas,
    informadas_na_entrada: counters.informadas_na_entrada,
    total_pesquisaveis: counters.total_pesquisaveis,
    nao_encontradas: counters.nao_encontradas,
    nao_aplicaveis: counters.nao_aplicaveis,
    conflitantes: counters.conflitantes,
    campos_estruturais_completados: structurallyCompletedFields,
    ...(fieldPolicy ? summarizeCoverage(candidateResponse.ficha_tecnica, outputSchema, fieldPolicy) : {})
  };
}

function summarizeCoverage(fichaTecnica: Record<string, unknown>, outputSchema: Record<string, unknown>, policy: FieldPolicy): Record<string, number> {
  const expectedPaths = extractRequiredFieldPaths(outputSchema);
  const presentPaths = expectedPaths.filter((path) => hasOwnPath(fichaTecnica, path));
  const statusFields = presentPaths.filter((path) => isObject(readOwnPath(fichaTecnica, path)) && typeof (readOwnPath(fichaTecnica, path) as Record<string, unknown>).status === "string");
  const collectionFields = presentPaths.filter((path) => Array.isArray(readOwnPath(fichaTecnica, path)));

  if (expectedPaths.length !== policy.coverage.totalPaths || statusFields.length !== policy.coverage.statusFields || collectionFields.length !== policy.coverage.collectionFields) {
    throw new ValidationError("Cobertura da ficha tecnica esta incompleta.", {
      code: "technical_sheet_coverage_incomplete",
      expectedPaths: policy.coverage.totalPaths,
      presentPaths: presentPaths.length,
      expectedStatusFields: policy.coverage.statusFields,
      presentStatusFields: statusFields.length,
      expectedCollections: policy.coverage.collectionFields,
      presentCollections: collectionFields.length
    });
  }

  return {
    total_caminhos: expectedPaths.length,
    caminhos_presentes: presentPaths.length,
    campos_status_total: policy.coverage.statusFields,
    campos_status_resolvidos: statusFields.length,
    colecoes_total: policy.coverage.collectionFields,
    colecoes_presentes: collectionFields.length
  };
}

function extractRequiredFieldPaths(outputSchema: Record<string, unknown>): string[] {
  const rootProperties = isObject(outputSchema.properties) ? outputSchema.properties : null;
  const fichaSchema = rootProperties && isObject(rootProperties.ficha_tecnica) ? rootProperties.ficha_tecnica : null;
  const groups = fichaSchema && isObject(fichaSchema.properties) ? fichaSchema.properties : null;
  if (!groups) return [];

  const paths: string[] = [];
  for (const [groupName, groupSchema] of Object.entries(groups)) {
    if (!isObject(groupSchema) || !Array.isArray(groupSchema.required)) continue;
    for (const fieldName of groupSchema.required) {
      if (typeof fieldName === "string") paths.push(`${groupName}.${fieldName}`);
    }
  }
  return paths;
}

function hasOwnPath(root: Record<string, unknown>, path: string): boolean {
  const [group, field] = path.split(".");
  return Boolean(group && field && isObject(root[group]) && Object.prototype.hasOwnProperty.call(root[group], field));
}

function readOwnPath(root: Record<string, unknown>, path: string): unknown {
  const [group, field] = path.split(".");
  return group && field && isObject(root[group]) ? root[group][field] : undefined;
}

function normalizeStatusFieldShapes(candidateResponse: unknown): void {
  walkAndNormalizeStatus(candidateResponse);
}

function walkAndNormalizeStatus(node: unknown): void {
  if (Array.isArray(node)) {
    node.forEach((item) => walkAndNormalizeStatus(item));
    return;
  }

  if (!isObject(node)) {
    return;
  }

  const status = typeof node.status === "string" ? node.status : null;
  if (status) {
    // Defensive normalization to reduce avoidable schema failures from LLM outputs.
    // Keeps semantics aligned with schema defs in prompt-assets/schema.json.
    if (status === "nao_aplicavel") {
      node.valor = null;
      delete node.valor_original;
      delete node.fonte_ref;
      delete node.obs_ref;
      delete node.observacoes;
    } else if (status === "nao_encontrado") {
      node.valor = null;
      delete node.valor_original;
      node.obs_ref = "NF1";
      delete node.fonte_ref;
      delete node.observacoes;
    } else if (status === "confirmado") {
      delete node.obs_ref;
      delete node.observacoes;
    } else if (status === "parcial" || status === "inferido_minimamente") {
      if (!isNonEmptyString(node.obs_ref) && !isNonEmptyString(node.observacoes)) {
        node.obs_ref = "NF1";
      }
    } else if (status === "conflitante") {
      node.valor = null;
      delete node.valor_original;
      if (!isNonEmptyString(node.obs_ref) && !isNonEmptyString(node.observacoes)) {
        node.obs_ref = "CF1";
      }
    }
  }

  for (const value of Object.values(node)) {
    walkAndNormalizeStatus(value);
  }
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function walkAndCountStatus(
  node: unknown,
  counters: {
    total_variaveis: number;
    preenchidas: number;
    informadas_na_entrada: number;
    total_pesquisaveis: number;
    nao_encontradas: number;
    nao_aplicaveis: number;
    conflitantes: number;
  }
): void {
  if (Array.isArray(node)) {
    node.forEach((item) => walkAndCountStatus(item, counters));
    return;
  }

  if (!isObject(node)) {
    return;
  }

  if (typeof node.status === "string") {
    counters.total_variaveis += 1;

    if (node.status === "informado_na_entrada") {
      counters.informadas_na_entrada += 1;
    } else {
      counters.total_pesquisaveis += 1;
    }

    if (node.status === "confirmado" || node.status === "parcial" || node.status === "inferido_minimamente") {
      counters.preenchidas += 1;
    } else if (node.status === "nao_encontrado") {
      counters.nao_encontradas += 1;
    } else if (node.status === "nao_aplicavel") {
      counters.nao_aplicaveis += 1;
    } else if (node.status === "conflitante") {
      counters.conflitantes += 1;
    }
  }

  for (const value of Object.values(node)) {
    walkAndCountStatus(value, counters);
  }
}
