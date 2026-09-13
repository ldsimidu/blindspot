export interface VehicleInput {
  marca: string;
  modelo: string;
  versao: string;
  ano_modelo: number;
  mercado: string;
}

export interface FonteUtilizada {
  id: string;
  url: string;
  titulo: string;
  tipo: string;
  avaliacao_politica?: {
    status: "na_lista_aprovada" | "fora_da_lista_aprovada" | "nao_rastreavel_com_seguranca" | "sem_politica_para_mercado" | "fonte_simulada_local";
    versao: string;
    motivos?: string[];
  };
  avaliacao_aderencia?: {
    status: "exata" | "compativel" | "ambigua" | "divergente" | "nao_verificada";
    criterios: {
      marca_modelo: "compativel" | "divergente" | "nao_verificado";
      versao_motorizacao: "compativel" | "divergente" | "nao_verificado";
      ano_modelo: "compativel" | "divergente" | "nao_verificado";
      mercado: "compativel" | "divergente" | "nao_verificado";
    };
    motivos: string[];
    versao: string;
    avaliada_em?: string;
  };
  evidencia_busca?: {
    observada: boolean;
    titulo_observado?: string;
    observada_em?: string;
    conteudo_sha256?: string;
    provider?: "openrouter" | "claude";
    modelo?: string;
    passe?: string;
  };
}

export interface FichaTecnicaResponse {
  veiculo_alvo: VehicleInput;
  metadados_coleta: Record<string, unknown>;
  fontes_utilizadas: FonteUtilizada[];
  ficha_tecnica: Record<string, unknown>;
  resumo_completude: {
    total_variaveis?: number;
    preenchidas?: number;
    nao_encontradas?: number;
    nao_aplicaveis?: number;
    conflitantes?: number;
    [key: string]: unknown;
  };
}

export interface ApiErrorResponse {
  message: string;
  details?: unknown;
}

export type OrganizationRole = "viewer" | "analyst" | "admin";
export interface OrganizationMember { id: string; display_name: string; email: string; role: OrganizationRole; state: "active" | "inactive"; created_at: string; }
export interface OrganizationMemberInvitation { id: string; email: string; role: OrganizationRole; state: "issued" | "revoked" | "used" | "expired"; expires_at: string; created_at: string; }
export interface UsageSummary { definition: string; period: string; starts_at: string; ends_at: string; successful_units: number; failed_attempts: number; breakdown: Array<{ action: "technical_sheet_persisted" | "technical_sheet_persist_failed"; outcome: "succeeded" | "failed"; units: number; events: number }>; }
export interface UsageAlertSettings { policy: { threshold_units: number; is_active: boolean; version: number } | null; alerts: Array<{ id: string; period: string; threshold_units: number; total_units: number; policy_version: number; state: "open"; created_at: string; acknowledged_at: string | null }>; }

export interface FichaTecnicaHistoryItem {
  id: string;
  finishedAt: string;
  provider: "claude" | "openrouter" | "simulated";
  model: string;
  vehicle: VehicleInput | null;
  response: unknown;
  isValid: boolean;
  validationError?: string;
}

export interface CatalogCandidate {
  id: string;
  slug: string;
  vehicle: VehicleInput;
  latestVersion: number | null;
  latestAt: string | null;
  latestTechnicalSheetVersionId: string | null;
}

export interface CatalogSearchResult {
  state: "found" | "not_registered";
  scope: "latest" | "all_versions";
  page: number;
  pageSize: number;
  total: number;
  entries: CatalogCandidate[];
}

export interface TechnicalCatalogSearchFilters {
  tipo_carroceria?: string;
  motor_tipo?: string;
  potencia_min_cv?: string;
  potencia_max_cv?: string;
  ano_modelo?: string;
  mercado?: string;
}

export interface TechnicalCatalogSearchResult extends CatalogSearchResult {
  appliedFilters: {
    tipoCarroceria?: string;
    motorTipo?: string;
    potenciaMinCv?: number;
    potenciaMaxCv?: number;
    modelYear?: number;
    market?: string;
  };
}

export type CatalogEntryResult =
  | { state: "found"; entry: CatalogCandidate & { response: FichaTecnicaResponse } }
  | { state: "not_registered" }
  | { state: "incompatible" };

export type CatalogRecommendationsResult =
  | { state: "found"; entries: CatalogCandidate[] }
  | { state: "not_registered" }
  | { state: "incompatible" };

export interface TechnicalComparison { contract_version: string; result_sha256: string; compatibility_warnings: Array<{ code: "market_mismatch" | "motorization_mismatch" | "motorization_not_confirmed"; message: string }>; left: { technical_sheet_version_id: string; version_number: number; vehicle: VehicleInput; sources: Array<{ id: string; title: string; type: string }> }; right: { technical_sheet_version_id: string; version_number: number; vehicle: VehicleInput; sources: Array<{ id: string; title: string; type: string }> }; fields: Array<{ path: string; label: string; left: ComparisonCell | null; right: ComparisonCell | null; difference: "equal" | "different" | "missing_on_left" | "missing_on_right" | "conflicting" | "not_applicable" }>; }
export interface ComparisonCell { value: unknown; unit: string | null; status: string; source_refs: string[]; observation: string | null; }
export interface SavedComparison { id: string; created_at: string; comparison: TechnicalComparison; }

export interface ResearchSessionSummary {
  id: string;
  focus: string;
  state: string;
  runtime_contract_version: string;
  research_plan_version: string;
  research_plan: { target_count?: number; task_count?: number; source_strategy?: string; exhaustion_reason?: string | null } | null;
  budget: { max_tasks?: number; max_provider_calls?: number; provider_calls?: number; mode?: string } | null;
  stop_reason: string | null;
  created_at: string;
  finished_at: string | null;
}

export interface QualityMetric {
  numerator: number;
  denominator: number;
  rate: number;
}

export interface ResearchSessionImpact {
  research_session_id: string;
  base_revision_id: string;
  result_revision_id: string | null;
  policy_version: string;
  outcome_kind: "published" | "partial_published" | "research_exhausted" | "failed" | "cancelled" | "needs_rebase";
  before: Record<string, QualityMetric>;
  after: Record<string, QualityMetric> | null;
  delta: Record<string, { numerator_delta: number; denominator_delta: number; rate_delta: number }> | { state: "not_applicable" };
  recommendation: { focus?: string; reason?: string; expected_impact?: string; alternative: "not_execute" };
  updated_at: string;
}

export interface VehicleWorkspaceSheet {
  id: string;
  state: "active" | "stale" | "archived";
  is_default: boolean;
  is_primary: boolean;
  origin_revision_id: string | null;
  created_at: string;
  tags: Array<{ tag: string; origin: "derived" | "manual"; reason: string; created_at?: string }>;
  latest_revision: { id: string; number: number; created_at: string } | null;
}

export interface VehicleWorkspaceOption extends VehicleInput {
  id: string;
  technical_sheet_count: number;
}

export interface VehicleWorkspaceData {
  workspace_contract_version: string;
  vehicle: VehicleInput & { id: string };
  latest_kind: "temporal";
  recommended: { state: "not_available"; reason: string };
  primary: { technical_sheet_id: string; scope: "organization" } | null;
  available_actions: { create_sheet: boolean; continue_research: boolean; manage_primary: boolean; manage_lifecycle: boolean };
  sheets: VehicleWorkspaceSheet[];
}

export interface FieldExplanation {
  technical_sheet_version_id: string;
  field_path: string;
  state: "confirmed" | "partial" | "inferred" | "calculated" | "user_provided" | "unknown" | "not_found" | "not_applicable" | "conflicting" | "research_exhausted" | "pending" | "blocked";
  state_version: string;
  reason_codes: string[];
  evidence_refs: string[];
  evidence: Array<{ source_ref: string; source_title: string; source_type: string; observed_at: string }>;
  alternatives: Array<{ ordinal: number; value: unknown; evidence_refs: string[] }>;
}
