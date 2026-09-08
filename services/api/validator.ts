import Ajv2020, { ErrorObject } from "ajv/dist/2020";
import addFormats from "ajv-formats";
import type { FichaTecnicaResponse } from "./types";
import { ValidationError, type VehicleInput } from "./types";
import type { SourcePolicy } from "./runtime-assets";
import type { NormalizationPolicy } from "./runtime-assets";
import { normalizeTechnicalMeasurements } from "./normalizer";

interface ValidationContext {
  vehicle: VehicleInput;
  provider: "claude" | "openrouter" | "simulated";
  sourcePolicy: SourcePolicy;
  normalizationPolicy?: NormalizationPolicy;
}

export function validateResponse(
  candidateResponse: unknown,
  outputSchema: Record<string, unknown>,
  context?: ValidationContext
): FichaTecnicaResponse {
  const normalizedResponse = normalizeCandidateResponse(candidateResponse);
  normalizeStatusFieldShapes(normalizedResponse);
  if (context?.normalizationPolicy) normalizeTechnicalMeasurements(normalizedResponse, context.normalizationPolicy);
  enrichResumoCompletude(normalizedResponse);
  validateWithAjv(normalizedResponse, outputSchema);
  validateFonteRefConsistency(normalizedResponse);
  if (context) {
    validateVehicleIdentity(normalizedResponse, context.vehicle);
    validateSourcePolicy(normalizedResponse, context);
  }

  return normalizedResponse as FichaTecnicaResponse;
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

function validateSourcePolicy(candidateResponse: unknown, context: ValidationContext): void {
  if (!isObject(candidateResponse) || !Array.isArray(candidateResponse.fontes_utilizadas)) {
    throw new ValidationError("Fontes utilizadas ausentes ou invalidas.");
  }

  const policyMarket = context.sourcePolicy.markets.find(
    (entry) =>
      normalizeIdentityValue(entry.brand) === normalizeIdentityValue(context.vehicle.marca) &&
      normalizeIdentityValue(entry.market) === normalizeIdentityValue(context.vehicle.mercado)
  );

  if (!policyMarket) {
    throw new ValidationError("Mercado do veiculo ainda nao possui politica de fontes aprovada.", {
      code: "source_policy_market_not_approved"
    });
  }

  const violations: Array<{ sourceId: string; code: string }> = [];
  for (const source of candidateResponse.fontes_utilizadas) {
    if (!isObject(source)) {
      violations.push({ sourceId: "unknown", code: "source_not_object" });
      continue;
    }
    const sourceId = typeof source.id === "string" ? source.id : "unknown";
    const type = typeof source.tipo === "string" ? source.tipo : "";
    const host = parseHttpsHost(source.url);

    if (!host) {
      violations.push({ sourceId, code: "source_url_not_https" });
      continue;
    }

    if (context.provider === "simulated") {
      if (!context.sourcePolicy.simulated.allowedSourceTypes.includes(type) || !hostMatchesAny(host, context.sourcePolicy.simulated.allowedHosts)) {
        violations.push({ sourceId, code: "simulated_source_not_allowed" });
      }
      continue;
    }

    if (context.sourcePolicy.officialSourceTypes.includes(type)) {
      if (!hostMatchesAny(host, policyMarket.officialDomains)) {
        violations.push({ sourceId, code: "official_source_host_not_allowed" });
      }
      continue;
    }

    if (context.sourcePolicy.partnerSourceTypes.includes(type)) {
      if (!hostMatchesAny(host, context.sourcePolicy.partnerDomains)) {
        violations.push({ sourceId, code: "partner_source_host_not_allowed" });
      }
      continue;
    }

    violations.push({ sourceId, code: "source_type_not_allowed" });
  }

  if (violations.length > 0) {
    throw new ValidationError("Resposta contem fontes fora da politica aprovada.", {
      code: "source_policy_violation",
      violations
    });
  }
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
      ajvErrors: formatAjvErrors(validate.errors ?? [])
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

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
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

function enrichResumoCompletude(candidateResponse: unknown): void {
  if (!isObject(candidateResponse) || !isObject(candidateResponse.ficha_tecnica)) {
    return;
  }

  const counters = {
    total_variaveis: 0,
    preenchidas: 0,
    nao_encontradas: 0,
    nao_aplicaveis: 0,
    conflitantes: 0
  };

  walkAndCountStatus(candidateResponse.ficha_tecnica, counters);

  candidateResponse.resumo_completude = {
    total_variaveis: counters.total_variaveis,
    preenchidas: counters.preenchidas,
    nao_encontradas: counters.nao_encontradas,
    nao_aplicaveis: counters.nao_aplicaveis,
    conflitantes: counters.conflitantes
  };
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
