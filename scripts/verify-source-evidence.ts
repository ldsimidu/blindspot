import assert from "node:assert/strict";
import {
  applySourceEvidenceAssessment,
  collectObservedCitationEvidence,
  collectObservedWebFetchEvidence,
  retainOnlyObservedAndPermittedSources,
  retainOnlyTrustedSourceAuthorities,
} from "../services/api/source-evidence";
import {
  buildOpenRouterRefinePrompt,
  calculateRouterScore,
  calculateLegacyRouterScore,
  calculateRoutingMetrics,
  decideRouterNextPass,
  mergeResultsByEvidence,
  resolveOpenRouterResearchMode,
  type RouterConfig,
  callLLMSimulated,
} from "../services/api/llm";
import { countUrlCitations } from "../services/api/logger";
import { confirmFetchedBrandPresenceDomains } from "../services/api/source-trust";
import { readFieldPolicy, readNormalizationPolicy, readQualityPolicy, readRuntimeMockResponse, readRuntimeSchema, readSourceEvidencePolicy, readSourcePolicy } from "../services/api/runtime-assets";
import { validateResponse } from "../services/api/validator";

const [policy, schema, sourcePolicy, normalizationPolicy, fieldPolicy, qualityPolicy, runtimeMock] = await Promise.all([
  readSourceEvidencePolicy(),
  readRuntimeSchema(),
  readSourcePolicy(),
  readNormalizationPolicy(),
  readFieldPolicy(),
  readQualityPolicy(),
  readRuntimeMockResponse(),
]);
const vehicle = {
  marca: "Ford",
  modelo: "Ranger",
  versao: "Raptor",
  ano_modelo: 2025,
  mercado: "Brasil",
};
const observedAt = "2026-09-09T12:00:00.000Z";
const providerResponse = {
  choices: [{
    message: {
      annotations: [
        {
          type: "url_citation",
          url_citation: {
            url: "https://www.ford.com.br/performance/ranger-raptor-4wd-at-2024/",
            title: "Conheca a versao Raptor 4WD AT 2024 | Ford Brasil",
            content: "Ranger Raptor 3.0 V6 Bi-turbo 4WD AT 2026 para o Brasil",
          },
        },
        {
          type: "url_citation",
          url_citation: {
            url: "https://dados-auto.example/brasil/ford/ranger/raptor/2025/ficha.pdf?utm_source=search",
            title: "Ford Ranger Raptor 2025 Brasil - ficha tecnica",
            content: "Especificacoes da Ford Ranger Raptor 2025 comercializada no Brasil.",
          },
        },
        {
          type: "url_citation",
          url_citation: {
            url: "https://www.ford.com.br/content/dam/Ford/website-assets/latam/br/nameplate/ranger-raptor/2025/pdf/ficha-tecnica-ranger-raptor-my2025.pdf",
            title: "Ficha tecnica Ford Ranger Raptor MY2025 Brasil",
            content: "Ranger Raptor 2025 3.0 V6 para o mercado brasileiro.",
          },
        },
      ],
    },
  }],
};

const evidence = collectObservedCitationEvidence(providerResponse, {
  provider: "openrouter",
  model: "google/gemini-test",
  pass: "quick",
  observedAt,
}, policy);

assert.equal(evidence.length, 3, "deve normalizar as tres url_citation aninhadas");
assert.equal(countUrlCitations(providerResponse), 3, "logger deve contar url_citation.url aninhada");
assert.equal(evidence[0]?.sanitizedExcerpt?.includes("Ranger Raptor"), true);
assert.match(evidence[0]?.contentSha256 ?? "", /^[a-f0-9]{64}$/);

const fetchedEvidence = collectObservedWebFetchEvidence({
  tool_result: {
    url: "https://www.ford.com.br/picapes/ranger-raptor/",
    title: "Ford Ranger Raptor | Ford Brasil",
    content: "A Ranger Raptor esta disponivel no Brasil. Conteudo oficial da pagina.",
    status: "completed",
  },
}, { provider: "openrouter", model: "google/gemini-test", pass: "page_fetch", observedAt }, policy, ["https://www.ford.com.br/picapes/ranger-raptor/"]);
assert.equal(fetchedEvidence.length, 1, "somente fetch concluido para URL previamente observada vira conteudo obtido");
assert.equal(fetchedEvidence[0]?.observationKind, "fetched_content");
assert.equal(collectObservedWebFetchEvidence({ url: "https://www.ford.com.br/outra", content: "texto", status: "completed" }, { provider: "openrouter", model: "google/gemini-test", pass: "page_fetch", observedAt }, policy, ["https://www.ford.com.br/picapes/ranger-raptor/"]).length, 0, "fetch fora do inventario nao pode ser promovido");

const bydVehicle = { marca: "BYD", modelo: "King", versao: "GL", ano_modelo: 2025, mercado: "Brasil" };
const bydFetched = collectObservedWebFetchEvidence({
  tool_result: { url: "https://www.byd.com/br/car/king", title: "BYD King | Brasil", content: "A BYD apresenta o King no Brasil.", status: "completed" },
}, { provider: "openrouter", model: "google/gemini-test", pass: "brand_presence_fetch", observedAt }, policy, ["https://www.byd.com/br/car/king"]);
assert.deepEqual(confirmFetchedBrandPresenceDomains(bydFetched, bydVehicle, ["byd.com"]), ["byd.com"], "conteudo institucional concluido pode liberar o host apenas nesta execucao");
assert.deepEqual(confirmFetchedBrandPresenceDomains(evidence, bydVehicle, ["byd.com"]), [], "snippet de busca nunca promove host candidato");

const payload = {
  metadados_coleta: { observacoes_gerais: [] as string[] },
  fontes_utilizadas: [
    { id: "F1", url: providerResponse.choices[0].message.annotations[0].url_citation.url, titulo: "Pagina Ford", tipo: "montadora_oficial" },
    { id: "F2", url: "https://dados-auto.example/brasil/ford/ranger/raptor/2025/ficha.pdf", titulo: "Fonte externa", tipo: "fonte_externa_rastreavel" },
    { id: "F3", url: providerResponse.choices[0].message.annotations[2].url_citation.url, titulo: "PDF Ford MY2025", tipo: "montadora_oficial" },
  ],
  ficha_tecnica: {
    identificacao: {
      ano_modelo: { valor: 2025, status: "confirmado", fonte_ref: ["F1"] },
      modelo: { valor: "Ranger", status: "confirmado", fonte_ref: ["F2"] },
    },
    motorizacao: {
      potencia_cv: { valor: "397 cv", status: "confirmado", fonte_ref: ["F3"] },
    },
    exterior: {
      assinatura: { valor: "Raptor", status: "confirmado", fonte_ref: ["F1"] },
    },
  },
  resumo_completude: {},
};

const quality = applySourceEvidenceAssessment(payload, evidence, vehicle, policy);
const externalExact = payload.fontes_utilizadas.find((source) => source.id === "F2");
const officialPdf = payload.fontes_utilizadas.find((source) => source.id === "F3");
assert.equal(payload.fontes_utilizadas.some((source) => source.id === "F1"), false, "pagina explicitamente de outro ano nao deve ser publicada");
assert.equal(externalExact.avaliacao_aderencia?.status, "exata", "fonte externa exata deve ser aceita como aderente");
assert.equal(officialPdf.avaliacao_aderencia?.status, "exata", "PDF MY2025 observado deve ser exato");
assert.equal(payload.ficha_tecnica.identificacao.ano_modelo.status, "nao_encontrado", "campo apoiado apenas por divergente deve ser limpo");
assert.equal(payload.ficha_tecnica.identificacao.modelo.status, "confirmado", "fonte externa exata pode sustentar confirmado");
assert.equal(payload.ficha_tecnica.motorizacao.potencia_cv.status, "confirmado", "PDF oficial exato pode sustentar confirmado");
assert.equal(payload.ficha_tecnica.exterior.assinatura.status, "nao_encontrado", "fonte divergente nunca deve sustentar um valor");
assert.equal(quality.confirmedOnlyByDivergentSourceCount, 2);
assert.equal(payload.resumo_completude.preenchidas, 2);

const compatibilityPayload = {
  metadados_coleta: { observacoes_gerais: [] as string[] },
  fontes_utilizadas: [
    { id: "F1", url: providerResponse.choices[0].message.annotations[0].url_citation.url, titulo: "Pagina Ford divergente", tipo: "fonte_externa_rastreavel" },
    { id: "F2", url: "https://dados-auto.example/brasil/ford/ranger/raptor/2025/ficha.pdf", titulo: "Fonte externa exata", tipo: "fonte_externa_rastreavel" },
  ],
  ficha_tecnica: {
    identificacao: {
      ano_modelo: { valor: 2025, status: "confirmado", fonte_ref: ["F1"] },
      modelo: { valor: "Ranger", status: "confirmado", fonte_ref: ["F2"] },
    },
  },
  resumo_completude: {},
};
applySourceEvidenceAssessment(compatibilityPayload, evidence, vehicle, policy, {
  acceptedAdherenceStatuses: ["exata", "compativel", "ambigua", "nao_verificada"],
  retainIneligiblePublicSources: true,
});
assert.equal(compatibilityPayload.fontes_utilizadas.length, 2, "modo compativel preserva fonte externa e divergente para revisao");
assert.equal(compatibilityPayload.ficha_tecnica.identificacao.ano_modelo.status, "nao_encontrado", "fonte explicitamente divergente nao confirma o alvo nem no modo compativel");
assert.equal(compatibilityPayload.ficha_tecnica.identificacao.modelo.status, "confirmado", "fonte externa observada e aderente permanece utilizavel no modo compativel");
assert.equal(resolveOpenRouterResearchMode(undefined), "ex_prompt_compat", "modo compativel e o padrao reversivel");
assert.equal(resolveOpenRouterResearchMode("strict_evidence"), "strict_evidence", "modo estrito permanece selecionavel");

const routingMetrics = calculateRoutingMetrics(payload, policy);
const routerConfig: RouterConfig = {
  enabled: true,
  minCoverageRate: 0.7,
  maxUnresolved: 60,
  maxNaoEncontradas: 60,
  maxConflitantes: 1,
  maxRefinePasses: 1,
  maxConflictPasses: 0,
  unresolvedListLimit: 50,
  qualityEnabled: true,
  minGroundedCoverageRate: 0.9,
  minCriticalGroundedCoverageRate: 0.9,
};
const decision = decideRouterNextPass(routingMetrics, routerConfig, { refine: 0, conflict: 0 });
assert.equal(decision.nextPass, "refine", "qualidade deve forcar refine mesmo com cobertura estrutural alta");
const refinePrompt = buildOpenRouterRefinePrompt("PROMPT", routingMetrics, 50);
assert.match(refinePrompt, /ano_modelo/);
assert.match(refinePrompt, /ano-modelo e mercado exatos/i);

const betterMetrics = { ...routingMetrics, groundedCoverageRate: 1, criticalGroundedCoverageRate: 1, divergentSourceCount: 0, confirmedOnlyByDivergentSourceCount: 0 };
assert.ok(calculateRouterScore(betterMetrics) > calculateRouterScore(routingMetrics), "score deve premiar qualidade comprovada");
assert.ok(calculateLegacyRouterScore({ ...routingMetrics, coverageRate: 0.8, preenchidas: 8 }) > calculateLegacyRouterScore({ ...betterMetrics, coverageRate: 0.5, preenchidas: 5 }), "modo compativel deve priorizar cobertura bruta como o legado");

const unsafePayload = {
  metadados_coleta: { observacoes_gerais: [] as string[] },
  fontes_utilizadas: [
    { id: "F2", url: "https://dados-auto.example/brasil/ford/ranger/raptor/2025/ficha.pdf", titulo: "Observada", tipo: "fonte_externa_rastreavel" },
    { id: "F9", url: "http://127.0.0.1/admin", titulo: "Nao observada", tipo: "fonte_externa_rastreavel" },
  ],
  ficha_tecnica: { seguranca: { teste: { valor: true, status: "confirmado", fonte_ref: ["F9"] } } },
  resumo_completude: {},
};
const removed = retainOnlyObservedAndPermittedSources(unsafePayload, evidence, (url) => new URL(url).protocol === "https:");
assert.deepEqual(removed, ["F9"]);
assert.equal(unsafePayload.ficha_tecnica.seguranca.teste.status, "nao_encontrado", "URL insegura deve ser isolada sem rejeitar toda a ficha");
assert.equal(unsafePayload.fontes_utilizadas.length, 1);

const authorityPayload = {
  metadados_coleta: { observacoes_gerais: [] as string[] },
  fontes_utilizadas: [
    { id: "F1", url: "https://www.byd.com/br/king/ficha-2025.pdf", titulo: "BYD King 2025", tipo: "fonte_externa_rastreavel" },
    { id: "F2", url: "https://www.carrosnaweb.com.br/fichadetalhe.asp", titulo: "Agregador", tipo: "imprensa_automotiva_reconhecida" },
  ],
  ficha_tecnica: { motorizacao: {
    potencia: { valor: "235 cv", status: "confirmado", fonte_ref: ["F1"] },
    torque: { valor: "325 Nm", status: "confirmado", fonte_ref: ["F2"] },
  } },
  resumo_completude: {},
};
const authority = retainOnlyTrustedSourceAuthorities(authorityPayload, sourcePolicy, ["byd.com"]);
assert.deepEqual(authority.removedSourceIds, ["F2"], "agregador fora da lista aprovada deve ser isolado");
assert.equal(authorityPayload.fontes_utilizadas[0]?.tipo, "catalogo_ou_ficha_tecnica_oficial", "autoridade server-owned deve corrigir o tipo de documento primario");
assert.equal(authorityPayload.ficha_tecnica.motorizacao.torque.status, "nao_encontrado", "campo apoiado so por agregador deve ser rebaixado");

const merged = mergeResultsByEvidence({
  fontes_utilizadas: [{ id: "F1", url: "https://example.test/base", titulo: "Base", tipo: "fonte_externa_rastreavel" }],
  ficha_tecnica: { motorizacao: { potencia: { valor: "397 cv", status: "confirmado", fonte_ref: ["F1"] } } },
  metadados_coleta: { observacoes_gerais: ["base"] },
}, {
  fontes_utilizadas: [{ id: "F1", url: "https://example.test/refine", titulo: "Refine", tipo: "fonte_externa_rastreavel" }],
  ficha_tecnica: { motorizacao: { potencia: { valor: null, status: "nao_encontrado", obs_ref: "NF1" } }, exterior: { cor: { valor: "Azul", status: "confirmado", fonte_ref: ["F1"] } } },
  metadados_coleta: { observacoes_gerais: ["refine"] },
}) as Record<string, any>;
assert.equal(merged.ficha_tecnica.motorizacao.potencia.valor, "397 cv", "refine sem evidencia nao pode apagar campo aderente anterior");
assert.equal(merged.ficha_tecnica.exterior.cor.valor, "Azul", "merge deve incorporar campo novo com evidencia");
assert.equal(merged.fontes_utilizadas.length, 2, "merge deve preservar fontes de passes distintos");
assert.deepEqual(merged.ficha_tecnica.exterior.cor.fonte_ref, ["F2"], "merge deve remapear ids de fonte sem colisao");

const fullResponse = JSON.parse(JSON.stringify(runtimeMock)) as Record<string, unknown>;
const fullSources = fullResponse.fontes_utilizadas as Array<Record<string, unknown>>;
fullSources[0] = {
  ...fullSources[0],
  url: "https://dados-auto.example/brasil/ford/ranger/raptor/2025/ficha.pdf",
  titulo: "Ford Ranger Raptor 2025 Brasil - ficha tecnica",
  tipo: "fonte_externa_rastreavel",
};
applySourceEvidenceAssessment(fullResponse, evidence, vehicle, policy);
const validated = validateResponse(fullResponse, schema, {
  vehicle,
  provider: "openrouter",
  sourcePolicy,
  normalizationPolicy,
  fieldPolicy,
  qualityPolicy,
});
assert.equal(validated.fontes_utilizadas[0]?.avaliacao_aderencia?.status, "exata", "schema completo deve aceitar evidencia e aderencia server-owned");
assert.equal(validated.fontes_utilizadas[0]?.avaliacao_politica?.status, "fora_da_lista_aprovada", "fonte externa deve ser sinalizada sem bloquear a ficha");

const noEligibleResponse = JSON.parse(JSON.stringify(runtimeMock)) as Record<string, unknown>;
const noEligibleSources = noEligibleResponse.fontes_utilizadas as Array<Record<string, unknown>>;
noEligibleSources[0] = {
  ...noEligibleSources[0],
  url: providerResponse.choices[0].message.annotations[0].url_citation.url,
  titulo: "Pagina Ford 2024",
  tipo: "montadora_oficial",
};
applySourceEvidenceAssessment(noEligibleResponse, evidence, vehicle, policy);
assert.equal((noEligibleResponse.fontes_utilizadas as unknown[]).length, 0, "ficha sem evidencia aderente nao deve publicar fonte divergente");
const validatedWithoutSources = validateResponse(noEligibleResponse, schema, {
  vehicle,
  provider: "openrouter",
  sourcePolicy,
  normalizationPolicy,
  fieldPolicy,
  qualityPolicy,
});
assert.deepEqual(validatedWithoutSources.fontes_utilizadas, [], "schema deve permitir ficha parcial sem fonte publica elegivel");

const simulatedResponse = await callLLMSimulated("", vehicle);
const validatedSimulated = validateResponse(simulatedResponse, schema, {
  vehicle,
  provider: "simulated",
  sourcePolicy,
  normalizationPolicy,
  fieldPolicy,
  qualityPolicy,
});
assert.equal(validatedSimulated.veiculo_alvo.ano_modelo, 2025, "pipeline simulated deve gerar e validar o alvo solicitado");

console.log("source evidence verification: ok");
