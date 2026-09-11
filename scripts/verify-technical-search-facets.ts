import { readFieldPolicy, readTechnicalSearchFacetPolicy } from "../services/api/runtime-assets";
import { parseCanonicalCv, projectTechnicalSearchFacets } from "../services/api/technical-search-facets";
import type { FichaTecnicaResponse } from "../services/api/types";

const [policy, fieldPolicy] = await Promise.all([readTechnicalSearchFacetPolicy(), readFieldPolicy()]);
const bodyFacet = policy.facets.find((facet) => facet.key === "tipo_carroceria");
const motorFacet = policy.facets.find((facet) => facet.key === "motor_tipo");
if (!bodyFacet || bodyFacet.kind !== "enum" || !motorFacet || motorFacet.kind !== "enum") throw new Error("Politica de facetas incompleta.");
if (!sameValues(bodyFacet.allowed_values, fieldPolicy.body.allowedValues)) throw new Error("Faceta de carroceria diverge da politica de campos.");
if (!sameValues(motorFacet.allowed_values, fieldPolicy.propulsion.allowedValues)) throw new Error("Faceta de propulsao diverge da politica de campos.");

const response = sheet({ body: { valor: "caminhonete", status: "confirmado", fonte_ref: ["F1"] }, motor: { valor: "combustao", status: "confirmado", fonte_ref: ["F2"] }, power: { valor: "397 cv", status: "confirmado", fonte_ref: ["F2"] } });
const facets = projectTechnicalSearchFacets(response, policy);
if (facets.length !== 3 || facets.find((facet) => facet.facetKey === "potencia_cv")?.valueNumber !== 397) throw new Error("Projecao de facetas confirmadas falhou.");

const inferred = sheet({ body: { valor: "caminhonete", status: "inferido", fonte_ref: ["F1"] }, motor: { valor: "combustao", status: "confirmado", fonte_ref: ["F2"] }, power: { valor: "397 cv", status: "confirmado", fonte_ref: ["F2"] } });
if (projectTechnicalSearchFacets(inferred, policy).some((facet) => facet.facetKey === "tipo_carroceria")) throw new Error("Campo nao confirmado entrou na projecao.");

const unsupportedPower = sheet({ body: { valor: "caminhonete", status: "confirmado", fonte_ref: ["F1"] }, motor: { valor: "combustao", status: "confirmado", fonte_ref: ["F2"] }, power: { valor: "397 hp", status: "confirmado", fonte_ref: ["F2"] } });
if (projectTechnicalSearchFacets(unsupportedPower, policy).some((facet) => facet.facetKey === "potencia_cv")) throw new Error("Potencia nao canonica entrou na projecao.");
if (parseCanonicalCv("397,5 cv") !== 397.5 || parseCanonicalCv("397 hp") !== null) throw new Error("Parser de potencia invalido.");

console.log("TECHNICAL_SEARCH_FACETS_CHECK=PASS");

function sheet(values: { body: Record<string, unknown>; motor: Record<string, unknown>; power: Record<string, unknown> }): FichaTecnicaResponse {
  return { veiculo_alvo: { marca: "Ford", modelo: "Ranger", versao: "Raptor", ano_modelo: 2025, mercado: "Brasil" }, metadados_coleta: {}, fontes_utilizadas: [], ficha_tecnica: { identificacao: { tipo_carroceria: values.body }, motorizacao: { motor_tipo: values.motor, potencia_cv: values.power } }, resumo_completude: {} };
}

function sameValues(left: string[], right: string[]): boolean {
  return left.length === right.length && left.every((value) => right.includes(value));
}
