import { readFile } from "node:fs/promises";
import path from "node:path";

const RUNTIME_ASSETS_DIR = path.resolve(process.cwd(), "packages", "agent-runtime", "assets");

export interface SourcePolicyMarket {
  brand: string;
  market: string;
  officialDomains: string[];
}

export interface SourcePolicy {
  version: string;
  identityFields: ["marca", "modelo", "versao", "ano_modelo", "mercado"];
  officialSourceTypes: string[];
  partnerSourceTypes: string[];
  markets: SourcePolicyMarket[];
  partnerDomains: string[];
  simulated: {
    allowedHosts: string[];
    allowedSourceTypes: string[];
  };
}

export interface NormalizationPolicy {
  version: string;
  description: string;
  fields: Array<{
    path: string;
    canonicalUnit: string;
    kind: "engine_displacement" | "power" | "torque" | "fuel_consumption";
    acceptedUnits: string[];
  }>;
}

export interface FieldPolicy {
  version: string;
  coverage: { totalPaths: number; statusFields: number; collectionFields: number };
  body: { field: string; allowedValues: string[] };
  propulsion: { field: string; allowedValues: string[] };
  conditionalFields: Array<{ path: string; applicableTo: string[] }>;
  extensionFamilies: Record<string, string[]>;
}

export interface QualityPolicy {
  version: string;
  conflict: {
    status: "conflitante";
    minimumSources: number;
    requiresNullValue: boolean;
    requiredObservation: "CF1";
    automaticWinner: "forbidden";
  };
  review: {
    humanDecision: "deferred_until_authenticated_rbac";
    allowedFutureDecisions: string[];
  };
}

export interface SourceEvidencePolicy {
  version: string;
  acceptedAdherenceStatuses: Array<"exata" | "compativel">;
  criticalPathPrefixes: string[];
  evidenceExcerptMaxChars: number;
  publicObservedTitleMaxChars: number;
}

export interface ResearchCapabilityPolicy {
  version: string;
  inputIdentityPaths: string[];
  capabilities: Array<{
    id: string;
    pathPrefixes: string[];
    evidenceKinds: string[];
  }>;
}

export interface ResearchDocumentPolicy {
  version: string;
  brand_presence_discovery: {
    enabled: boolean;
    max_tokens: number;
    max_search_calls: number;
    max_results: number;
    max_total_results: number;
    max_candidate_hosts: number;
  };
  official_document_discovery: {
    enabled: boolean;
    max_search_calls: number;
    max_results: number;
    max_total_results: number;
    source_material_order: Array<"ficha_tecnica" | "catalogo_ou_brochura" | "manual_ou_documento_tecnico" | "configurador_ou_guia_comercial">;
    required_capabilities: Array<"especificacao_tecnica" | "configuracao_visual" | "experiencia_e_conectividade" | "seguranca_e_servico">;
  };
  document_hunter: {
    enabled: boolean;
    search_modes: Array<"landing_links" | "year_archive">;
    require_first_party_anchor_for_fallback: boolean;
  };
  document_reader: {
    enabled: boolean;
    max_documents: number;
    provider_parser_enabled: boolean;
    provider_parser_engine: "cloudflare-ai" | "mistral-ocr";
    provider_parser_max_documents: number;
    provider_parser_max_tokens: number;
    fail_when_official_pdf_unreadable: boolean;
    timeout_ms: number;
    max_redirects: number;
    max_bytes_per_document: number;
    max_pages_per_document: number;
    max_text_chars_per_document: number;
    max_text_chars_total: number;
    allowed_content_types: Array<"application/pdf" | "text/html" | "application/xhtml+xml">;
  };
}

export interface SourceTrustBootstrapPolicy {
  version: string;
  bootstrap: {
    max_candidate_hosts: number;
    expires_after_days: number;
    minimum_observations_for_learned: number;
    minimum_confidence_for_learned: number;
    requires_exact_adherence: boolean;
  };
}

export interface TechnicalSearchFacetPolicy {
  version: string;
  eligible_status: "confirmado";
  facets: Array<
    | { key: "tipo_carroceria" | "motor_tipo"; path: string; kind: "enum"; allowed_values: string[] }
    | { key: "potencia_cv"; path: string; kind: "number"; unit: "cv" }
  >;
}

export async function readRuntimeAsset(
  fileName: "base-agent-prompt.txt" | "schema.json" | "mock-response.json" | "source-policy.json" | "source-evidence-policy.json" | "research-capability-policy.json" | "research-document-policy.json" | "source-trust-bootstrap-policy.json" | "normalization-policy.json" | "field-policy.json" | "quality-policy.json" | "technical-search-facet-policy.json"
): Promise<string> {
  return readFile(path.join(RUNTIME_ASSETS_DIR, fileName), "utf-8");
}

export async function readRuntimeSchema(): Promise<Record<string, unknown>> {
  return JSON.parse(await readRuntimeAsset("schema.json")) as Record<string, unknown>;
}

export async function readRuntimeMockResponse(): Promise<Record<string, unknown>> {
  return JSON.parse(await readRuntimeAsset("mock-response.json")) as Record<string, unknown>;
}

export async function readSourcePolicy(): Promise<SourcePolicy> {
  return JSON.parse(await readRuntimeAsset("source-policy.json")) as SourcePolicy;
}

export async function readSourceEvidencePolicy(): Promise<SourceEvidencePolicy> {
  return JSON.parse(await readRuntimeAsset("source-evidence-policy.json")) as SourceEvidencePolicy;
}

export async function readResearchCapabilityPolicy(): Promise<ResearchCapabilityPolicy> {
  return JSON.parse(await readRuntimeAsset("research-capability-policy.json")) as ResearchCapabilityPolicy;
}

export async function readResearchDocumentPolicy(): Promise<ResearchDocumentPolicy> {
  return JSON.parse(await readRuntimeAsset("research-document-policy.json")) as ResearchDocumentPolicy;
}

export async function readSourceTrustBootstrapPolicy(): Promise<SourceTrustBootstrapPolicy> {
  return JSON.parse(await readRuntimeAsset("source-trust-bootstrap-policy.json")) as SourceTrustBootstrapPolicy;
}

export async function readNormalizationPolicy(): Promise<NormalizationPolicy> {
  return JSON.parse(await readRuntimeAsset("normalization-policy.json")) as NormalizationPolicy;
}

export async function readFieldPolicy(): Promise<FieldPolicy> {
  return JSON.parse(await readRuntimeAsset("field-policy.json")) as FieldPolicy;
}

export async function readQualityPolicy(): Promise<QualityPolicy> {
  return JSON.parse(await readRuntimeAsset("quality-policy.json")) as QualityPolicy;
}

export async function readTechnicalSearchFacetPolicy(): Promise<TechnicalSearchFacetPolicy> {
  return JSON.parse(await readRuntimeAsset("technical-search-facet-policy.json")) as TechnicalSearchFacetPolicy;
}
