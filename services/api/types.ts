export interface VehicleInput {
  marca: string;
  modelo: string;
  versao: string;
  ano_modelo: number;
  mercado: string;
}

export interface VehiclePayload {
  context: {
    vehicle: VehicleInput;
  };
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
  resumo_completude: Record<string, unknown>;
}

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

export class HttpError extends Error {
  statusCode: number;
  details?: unknown;

  constructor(statusCode: number, message: string, details?: unknown) {
    super(message);
    this.name = "HttpError";
    this.statusCode = statusCode;
    this.details = details;
  }
}

export class ValidationError extends HttpError {
  constructor(message: string, details?: unknown) {
    super(422, message, details);
    this.name = "ValidationError";
  }
}
