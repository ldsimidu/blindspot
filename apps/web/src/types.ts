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
