import type {
  ApiErrorResponse,
  FichaTecnicaHistoryItem,
  FichaTecnicaResponse,
  VehicleInput
} from "./types";

const API_ENDPOINT = "/api/ficha-tecnica";
const API_LATEST_ENDPOINT = "/api/ficha-tecnica/latest";
const API_HISTORY_ENDPOINT = "/api/ficha-tecnica/history";

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

async function safeJson(response: Response): Promise<unknown | null> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}
