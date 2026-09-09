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
}

export interface CatalogSearchResult {
  state: "found" | "not_registered";
  page: number;
  pageSize: number;
  total: number;
  entries: CatalogCandidate[];
}

export type CatalogEntryResult =
  | { state: "found"; entry: CatalogCandidate & { response: FichaTecnicaResponse } }
  | { state: "not_registered" }
  | { state: "incompatible" };
