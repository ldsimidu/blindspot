import type {
  ApiErrorResponse,
  CatalogEntryResult,
  CatalogRecommendationsResult,
  CatalogSearchResult,
  TechnicalCatalogSearchFilters,
  TechnicalCatalogSearchResult,
  FichaTecnicaHistoryItem,
  FichaTecnicaResponse,
  VehicleInput,
  OrganizationMember,
  OrganizationMemberInvitation,
  OrganizationRole,
  UsageSummary,
  UsageAlertSettings,
  SavedComparison,
  ResearchSessionImpact,
  ResearchSessionSummary,
  VehicleWorkspaceData,
  VehicleWorkspaceOption,
  FieldExplanation
} from "./types";

const API_ENDPOINT = "/api/ficha-tecnica";
const API_LATEST_ENDPOINT = "/api/ficha-tecnica/latest";
const API_HISTORY_ENDPOINT = "/api/ficha-tecnica/history";
const API_CATALOG_ENDPOINT = "/api/catalogo/fichas";
const API_TECHNICAL_CATALOG_ENDPOINT = "/api/catalogo/fichas/pesquisa-tecnica";
const API_LOGIN_ENDPOINT = "/api/auth/login";
const API_LOGOUT_ENDPOINT = "/api/auth/logout";
const API_SESSION_ENDPOINT = "/api/auth/session";

export class ApiRequestError extends Error {
  constructor(message: string, readonly details: unknown = null) {
    super(message);
    this.name = "ApiRequestError";
  }
}

export interface AuthSession { state: "authenticated"; email: string; displayName: string; role: OrganizationRole; expires_at?: string; }
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
    throw await apiError(response, "Erro ao gerar ficha tecnica");
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

export interface CatalogSearchOptions { query?: string; brand?: string; model?: string; modelYear?: string; market?: string; page?: number; sort?: "recent" | "alphabetical"; scope?: "latest" | "all_versions"; }
export async function buscarCatalogo(options: CatalogSearchOptions = {}): Promise<CatalogSearchResult> {
  const params = new URLSearchParams({ page: String(options.page ?? 1), page_size: "20" });
  if (options.query?.trim()) params.set("q", options.query.trim());
  if (options.brand?.trim()) params.set("marca", options.brand.trim());
  if (options.model?.trim()) params.set("modelo", options.model.trim());
  if (options.modelYear?.trim()) params.set("ano_modelo", options.modelYear.trim());
  if (options.market?.trim()) params.set("mercado", options.market.trim());
  if (options.sort) params.set("sort", options.sort);
  if (options.scope) params.set("scope", options.scope);
  const response = await fetch(`${API_CATALOG_ENDPOINT}?${params.toString()}`, { credentials: "same-origin" });
  if (!response.ok) throw await apiError(response, "Erro ao consultar catalogo");
  return (await response.json()) as CatalogSearchResult;
}

export async function buscarCatalogoTecnico(filters: TechnicalCatalogSearchFilters & { page?: number } = {}): Promise<TechnicalCatalogSearchResult> {
  const params = new URLSearchParams({ page: String(filters.page ?? 1), page_size: "20" });
  if (filters.tipo_carroceria) params.set("tipo_carroceria", filters.tipo_carroceria);
  if (filters.motor_tipo) params.set("motor_tipo", filters.motor_tipo);
  if (filters.potencia_min_cv) params.set("potencia_min_cv", filters.potencia_min_cv);
  if (filters.potencia_max_cv) params.set("potencia_max_cv", filters.potencia_max_cv);
  if (filters.ano_modelo) params.set("ano_modelo", filters.ano_modelo);
  if (filters.mercado?.trim()) params.set("mercado", filters.mercado.trim());
  const response = await fetch(`${API_TECHNICAL_CATALOG_ENDPOINT}?${params.toString()}`, { credentials: "same-origin" });
  if (!response.ok) throw await apiError(response, "Erro ao consultar facetas tecnicas");
  return (await response.json()) as TechnicalCatalogSearchResult;
}

export async function abrirFichaCatalogo(id: string, vehicle: VehicleInput): Promise<CatalogEntryResult> {
  const params = new URLSearchParams({ marca: vehicle.marca, modelo: vehicle.modelo, versao: vehicle.versao, ano_modelo: String(vehicle.ano_modelo), mercado: vehicle.mercado });
  const response = await fetch(`${API_CATALOG_ENDPOINT}/${encodeURIComponent(id)}?${params.toString()}`);
  if (!response.ok) throw await apiError(response, "Erro ao abrir ficha do catalogo");
  return (await response.json()) as CatalogEntryResult;
}

export async function obterRecomendacoesCatalogo(id: string, vehicle: VehicleInput): Promise<CatalogRecommendationsResult> {
  const params = new URLSearchParams({ marca: vehicle.marca, modelo: vehicle.modelo, versao: vehicle.versao, ano_modelo: String(vehicle.ano_modelo), mercado: vehicle.mercado });
  const response = await fetch(`${API_CATALOG_ENDPOINT}/${encodeURIComponent(id)}/recomendacoes?${params.toString()}`, { credentials: "same-origin" });
  if (!response.ok) throw await apiError(response, "Erro ao consultar fichas relacionadas");
  return (await response.json()) as CatalogRecommendationsResult;
}

export async function obterEquipe(): Promise<{ members: OrganizationMember[]; invitations: OrganizationMemberInvitation[] }> {
  const response = await fetch("/api/organizacoes/membros", { credentials: "same-origin" });
  if (!response.ok) throw await apiError(response, "Erro ao consultar equipe");
  return (await response.json()) as { members: OrganizationMember[]; invitations: OrganizationMemberInvitation[] };
}

export async function convidarMembro(email: string, role: OrganizationRole): Promise<{ invitation_id: string; activation_path: string; expires_at: string; state: "issued" }> {
  const response = await fetch("/api/organizacoes/membros/convites", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "same-origin", body: JSON.stringify({ email, role }) });
  if (!response.ok) throw await apiError(response, "Erro ao criar convite");
  return (await response.json()) as { invitation_id: string; activation_path: string; expires_at: string; state: "issued" };
}

export async function revogarConviteMembro(id: string): Promise<void> {
  const response = await fetch(`/api/organizacoes/membros/convites/${encodeURIComponent(id)}/revogar`, { method: "POST", credentials: "same-origin" });
  if (!response.ok) throw await apiError(response, "Erro ao revogar convite");
}

export async function alterarPapelMembro(id: string, role: OrganizationRole): Promise<void> {
  const response = await fetch(`/api/organizacoes/membros/${encodeURIComponent(id)}/papel`, { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "same-origin", body: JSON.stringify({ role }) });
  if (!response.ok) throw await apiError(response, "Erro ao alterar papel");
}

export async function desativarMembro(id: string): Promise<void> {
  const response = await fetch(`/api/organizacoes/membros/${encodeURIComponent(id)}/desativar`, { method: "POST", credentials: "same-origin" });
  if (!response.ok) throw await apiError(response, "Erro ao desativar membro");
}

export async function ativarConviteMembro(token: string, displayName: string, password: string): Promise<void> {
  const response = await fetch(`/api/convites/membros/${encodeURIComponent(token)}/ativar`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ display_name: displayName, password }) });
  if (!response.ok) throw await apiError(response, "Erro ao ativar convite");
}

export async function obterConsumo(period: string): Promise<UsageSummary> {
  const response = await fetch(`/api/organizacoes/consumo?period=${encodeURIComponent(period)}`, { credentials: "same-origin" });
  if (!response.ok) throw await apiError(response, "Erro ao consultar consumo");
  return (await response.json()) as UsageSummary;
}

export async function obterAlertasConsumo(): Promise<UsageAlertSettings> { const response = await fetch("/api/organizacoes/consumo/alertas", { credentials: "same-origin" }); if (!response.ok) throw await apiError(response, "Erro ao consultar alertas"); return (await response.json()) as UsageAlertSettings; }
export async function salvarPoliticaConsumo(thresholdUnits: number, isActive: boolean): Promise<void> { const response = await fetch("/api/organizacoes/consumo/politica", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "same-origin", body: JSON.stringify({ threshold_units: thresholdUnits, is_active: isActive }) }); if (!response.ok) throw await apiError(response, "Erro ao salvar política"); }
export async function reconhecerAlertaConsumo(id: string): Promise<void> { const response = await fetch(`/api/organizacoes/consumo/alertas/${encodeURIComponent(id)}/reconhecer`, { method: "POST", credentials: "same-origin" }); if (!response.ok) throw await apiError(response, "Erro ao reconhecer alerta"); }
export async function criarComparacao(ids: [string, string]): Promise<SavedComparison> { const response = await fetch("/api/comparacoes", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "same-origin", body: JSON.stringify({ technical_sheet_version_ids: ids }) }); if (!response.ok) throw await apiError(response, "Erro ao criar comparacao"); return (await response.json()) as SavedComparison; }
export async function listarComparacoes(): Promise<{ comparisons: Array<{ id: string; created_at: string; left_version_id: string; right_version_id: string }> }> { const response = await fetch("/api/comparacoes", { credentials: "same-origin" }); if (!response.ok) throw await apiError(response, "Erro ao listar comparacoes"); return (await response.json()) as { comparisons: Array<{ id: string; created_at: string; left_version_id: string; right_version_id: string }> }; }
export async function obterComparacao(id: string): Promise<SavedComparison> { const response = await fetch(`/api/comparacoes/${encodeURIComponent(id)}`, { credentials: "same-origin" }); if (!response.ok) throw await apiError(response, "Erro ao abrir comparacao"); return (await response.json()) as SavedComparison; }
export async function exportarComparacao(id: string, format: "csv" | "json"): Promise<void> { const response = await fetch(`/api/comparacoes/${encodeURIComponent(id)}/export?format=${format}`, { credentials: "same-origin" }); if (!response.ok) throw await apiError(response, "Erro ao exportar comparacao"); const url = URL.createObjectURL(await response.blob()); const link = document.createElement("a"); link.href = url; link.download = `comparacao-${id}.${format}`; link.click(); URL.revokeObjectURL(url); }
export async function exportarFicha(id: string, format: "csv" | "json"): Promise<void> { const response = await fetch(`/api/ficha-tecnica/versoes/${encodeURIComponent(id)}/export?format=${format}`, { credentials: "same-origin" }); if (!response.ok) throw await apiError(response, "Erro ao exportar ficha"); const url = URL.createObjectURL(await response.blob()); const link = document.createElement("a"); link.href = url; link.download = `ficha-${id}.${format}`; link.click(); URL.revokeObjectURL(url); }

export async function obterWorkspaceVeiculo(id: string): Promise<VehicleWorkspaceData> {
  const response = await fetch(`/api/configuracoes-veiculo/${encodeURIComponent(id)}/workspace`, { credentials: "same-origin" });
  if (!response.ok) throw await apiError(response, "Workspace indisponível");
  return (await response.json()) as VehicleWorkspaceData;
}

export async function listarConfiguracoesWorkspace(): Promise<VehicleWorkspaceOption[]> {
  const response = await fetch("/api/workspace/configuracoes-veiculo", { credentials: "same-origin" });
  if (!response.ok) throw await apiError(response, "Não foi possível listar os veículos da organização");
  const payload = await response.json() as { configurations: VehicleWorkspaceOption[] };
  return payload.configurations;
}

export async function listarSessoesPesquisa(sheetId: string): Promise<ResearchSessionSummary[]> {
  const response = await fetch(`/api/technical-sheets/${encodeURIComponent(sheetId)}/research-sessions`, { credentials: "same-origin" });
  if (!response.ok) throw await apiError(response, "Histórico de pesquisas indisponível");
  const payload = await response.json() as { sessions: ResearchSessionSummary[] };
  return payload.sessions;
}

export async function obterImpactoSessao(sessionId: string): Promise<ResearchSessionImpact> {
  const response = await fetch(`/api/research-sessions/${encodeURIComponent(sessionId)}/impacto`, { credentials: "same-origin" });
  if (!response.ok) throw await apiError(response, "Impacto da pesquisa indisponível");
  return (await response.json()) as ResearchSessionImpact;
}

export async function obterFichaTecnicaPorVersao(versionId: string): Promise<FichaTecnicaResponse> {
  const response = await fetch(`/api/ficha-tecnica/versoes/${encodeURIComponent(versionId)}/export?format=json`, { credentials: "same-origin" });
  if (!response.ok) throw await apiError(response, "Ficha indisponível");
  const payload = await response.json() as { technical_sheet?: { vehicle?: VehicleInput; completeness?: FichaTecnicaResponse["resumo_completude"]; data?: Record<string, unknown>; sources?: FichaTecnicaResponse["fontes_utilizadas"] } };
  const sheet = payload.technical_sheet;
  if (!sheet?.vehicle || !sheet.data || !sheet.completeness || !sheet.sources) throw new ApiRequestError("Ficha indisponível");
  return { veiculo_alvo: sheet.vehicle, metadados_coleta: {}, resumo_completude: sheet.completeness, ficha_tecnica: sheet.data, fontes_utilizadas: sheet.sources };
}

export async function obterExplicacaoVariavel(versionId: string, path: string): Promise<FieldExplanation> {
  const params = new URLSearchParams({ path });
  const response = await fetch(`/api/ficha-tecnica/versoes/${encodeURIComponent(versionId)}/explicacao-variavel?${params.toString()}`, { credentials: "same-origin" });
  if (!response.ok) throw await apiError(response, "Explicação da variável indisponível");
  return (await response.json()) as FieldExplanation;
}

export async function definirFichaPrimaria(sheetId: string, reason: "organization_reference" | "reviewed_selection" | "restore_previous_reference"): Promise<void> {
  const response = await fetch(`/api/technical-sheets/${encodeURIComponent(sheetId)}/primary`, { method: "PUT", headers: { "Content-Type": "application/json" }, credentials: "same-origin", body: JSON.stringify({ reason }) });
  if (!response.ok) throw await apiError(response, "Não foi possível definir a ficha primária");
}

export async function removerFichaPrimaria(sheetId: string): Promise<void> {
  const response = await fetch(`/api/technical-sheets/${encodeURIComponent(sheetId)}/primary`, { method: "DELETE", credentials: "same-origin" });
  if (!response.ok) throw await apiError(response, "Não foi possível remover a ficha primária");
}

export async function alterarCicloFicha(sheetId: string, state: "active" | "stale" | "archived", reason: "freshness_policy" | "manual_review" | "superseded" | "restored_after_review"): Promise<void> {
  const response = await fetch(`/api/technical-sheets/${encodeURIComponent(sheetId)}/lifecycle`, { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "same-origin", body: JSON.stringify({ state, reason }) });
  if (!response.ok) throw await apiError(response, "Não foi possível alterar o ciclo de vida da ficha");
}

async function apiError(response: Response, fallback: string): Promise<ApiRequestError> {
  const errorPayload = (await safeJson(response)) as ApiErrorResponse | null;
  return new ApiRequestError(errorPayload?.message ?? `${fallback} (HTTP ${response.status})`, errorPayload?.details);
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
