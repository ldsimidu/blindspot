import type {
  ApiErrorResponse,
  CatalogEntryResult,
  CatalogSearchResult,
  FichaTecnicaHistoryItem,
  FichaTecnicaResponse,
  VehicleInput
} from "./types";

const API_ENDPOINT = "/api/ficha-tecnica";
const API_LATEST_ENDPOINT = "/api/ficha-tecnica/latest";
const API_HISTORY_ENDPOINT = "/api/ficha-tecnica/history";
const API_CATALOG_ENDPOINT = "/api/catalogo/fichas";
const API_LOGIN_ENDPOINT = "/api/auth/login";
const API_LOGOUT_ENDPOINT = "/api/auth/logout";
const API_SESSION_ENDPOINT = "/api/auth/session";

export interface AuthSession { state: "authenticated"; email: string; displayName: string; expires_at?: string; }
export type LoginOutcome = AuthSession | { state: "pending_review" | "rejected" };
export interface OrganizationRegistration { company_name: string; cnpj: string; contact_name: string; contact_email: string; password: string; password_confirmation: string; privacy_notice_version: string; }

export async function entrar(email: string, password: string): Promise<LoginOutcome> {
  const response = await fetch(API_LOGIN_ENDPOINT, { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "same-origin", body: JSON.stringify({ email, password }) });
  if (response.status === 403) {
    const payload = await safeJson(response);
    if (isLoginState(payload)) return payload;
  }
  if (!response.ok) throw await apiError(response, "Credenciais invalidas");
  return (await response.json()) as AuthSession;
}

export async function cadastrarOrganizacao(payload: OrganizationRegistration): Promise<{ state: "received" }> {
  const response = await fetch("/api/organizacoes/cadastro", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
  if (!response.ok) throw await apiError(response, "Nao foi possivel enviar o cadastro");
  return (await response.json()) as { state: "received" };
}

export async function obterSessao(): Promise<AuthSession | null> {
  const response = await fetch(API_SESSION_ENDPOINT, { credentials: "same-origin" });
  if (response.status === 401) return null;
  if (!response.ok) throw await apiError(response, "Erro ao verificar sessao");
  return (await response.json()) as AuthSession;
}

export async function sair(): Promise<void> {
  const response = await fetch(API_LOGOUT_ENDPOINT, { method: "POST", credentials: "same-origin" });
  if (!response.ok && response.status !== 204) throw await apiError(response, "Erro ao encerrar sessao");
}

export async function gerarFichaTecnica(payload: VehicleInput): Promise<FichaTecnicaResponse> {
  const response = await fetch(API_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorPayload = (await safeJson(response)) as ApiErrorResponse | null;
    const fallbackMessage = `Erro ao gerar ficha tecnica (HTTP ${response.status})`;

    throw new Error(errorPayload?.message ?? fallbackMessage);
  }

  return (await response.json()) as FichaTecnicaResponse;
}

export async function obterUltimaFichaTecnica(): Promise<FichaTecnicaResponse | null> {
  const response = await fetch(API_LATEST_ENDPOINT);

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    const errorPayload = (await safeJson(response)) as ApiErrorResponse | null;
    const fallbackMessage = `Erro ao buscar ultima ficha tecnica (HTTP ${response.status})`;
    throw new Error(errorPayload?.message ?? fallbackMessage);
  }

  return (await response.json()) as FichaTecnicaResponse;
}

export async function obterHistoricoFichas(limit = 2): Promise<FichaTecnicaHistoryItem[]> {
  const response = await fetch(`${API_HISTORY_ENDPOINT}?limit=${limit}`);

  if (!response.ok) {
    const errorPayload = (await safeJson(response)) as ApiErrorResponse | null;
    const fallbackMessage = `Erro ao buscar historico (HTTP ${response.status})`;
    throw new Error(errorPayload?.message ?? fallbackMessage);
  }

  return (await response.json()) as FichaTecnicaHistoryItem[];
}

export async function buscarCatalogo(query: string, page = 1): Promise<CatalogSearchResult> {
  const params = new URLSearchParams({ q: query, page: String(page), page_size: "20" });
  const response = await fetch(`${API_CATALOG_ENDPOINT}?${params.toString()}`);
  if (!response.ok) throw await apiError(response, "Erro ao consultar catalogo");
  return (await response.json()) as CatalogSearchResult;
}

export async function abrirFichaCatalogo(id: string, vehicle: VehicleInput): Promise<CatalogEntryResult> {
  const params = new URLSearchParams({ marca: vehicle.marca, modelo: vehicle.modelo, versao: vehicle.versao, ano_modelo: String(vehicle.ano_modelo), mercado: vehicle.mercado });
  const response = await fetch(`${API_CATALOG_ENDPOINT}/${encodeURIComponent(id)}?${params.toString()}`);
  if (!response.ok) throw await apiError(response, "Erro ao abrir ficha do catalogo");
  return (await response.json()) as CatalogEntryResult;
}

async function apiError(response: Response, fallback: string): Promise<Error> {
  const errorPayload = (await safeJson(response)) as ApiErrorResponse | null;
  return new Error(errorPayload?.message ?? `${fallback} (HTTP ${response.status})`);
}

async function safeJson(response: Response): Promise<unknown | null> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function isLoginState(value: unknown): value is { state: "pending_review" | "rejected" } {
  return typeof value === "object" && value !== null && "state" in value && ((value as { state?: unknown }).state === "pending_review" || (value as { state?: unknown }).state === "rejected");
}
