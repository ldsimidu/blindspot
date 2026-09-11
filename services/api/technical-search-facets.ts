import type { FichaTecnicaResponse, TechnicalSearchFilters } from "./types";
import type { TechnicalSearchFacetPolicy } from "./runtime-assets";

export interface TechnicalSearchFacetProjection {
  facetKey: "tipo_carroceria" | "motor_tipo" | "potencia_cv";
  valueText: string | null;
  valueNumber: number | null;
  unit: string | null;
  sourceRefs: string[];
  policyVersion: string;
}

export function projectTechnicalSearchFacets(response: FichaTecnicaResponse, policy: TechnicalSearchFacetPolicy): TechnicalSearchFacetProjection[] {
  const projected: TechnicalSearchFacetProjection[] = [];
  for (const facet of policy.facets) {
    const field = fieldAtPath(response.ficha_tecnica, facet.path);
    if (!field || field.status !== policy.eligible_status || !Array.isArray(field.fonte_ref) || field.fonte_ref.length === 0) continue;
    const sourceRefs = field.fonte_ref.filter((value): value is string => typeof value === "string" && value.length > 0);
    if (sourceRefs.length === 0) continue;

    if (facet.kind === "enum") {
      if (typeof field.valor !== "string" || !facet.allowed_values.includes(field.valor)) continue;
      projected.push({ facetKey: facet.key, valueText: field.valor, valueNumber: null, unit: null, sourceRefs, policyVersion: policy.version });
      continue;
    }

    const valueNumber = parseCanonicalCv(field.valor);
    if (valueNumber !== null) projected.push({ facetKey: facet.key, valueText: null, valueNumber, unit: facet.unit, sourceRefs, policyVersion: policy.version });
  }
  return projected;
}

export function parseCanonicalCv(value: unknown): number | null {
  if (typeof value !== "string") return null;
  const match = /^(\d+(?:[.,]\d+)?)\s*cv$/i.exec(value.trim());
  if (!match) return null;
  const parsed = Number(match[1].replace(",", "."));
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

export function hasTechnicalFacet(filters: TechnicalSearchFilters): boolean {
  return Boolean(filters.tipoCarroceria || filters.motorTipo || filters.potenciaMinCv !== undefined || filters.potenciaMaxCv !== undefined);
}

function fieldAtPath(root: Record<string, unknown>, path: string): Record<string, unknown> | null {
  const [group, field] = path.split(".");
  const groupValue = root[group];
  if (!isRecord(groupValue) || !isRecord(groupValue[field])) return null;
  return groupValue[field];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
