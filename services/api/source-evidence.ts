import { createHash } from "node:crypto";
import type { SourceEvidencePolicy, SourcePolicy } from "./runtime-assets";
import type { VehicleInput } from "./types";

export type SourceAdherenceStatus =
  | "exata"
  | "compativel"
  | "ambigua"
  | "divergente"
  | "nao_verificada";

export type SourceAdherenceCriterion =
  | "compativel"
  | "divergente"
  | "nao_verificado";

export interface ObservedCitationEvidence {
  url: string;
  observedTitle: string | null;
  sanitizedExcerpt: string | null;
  contentSha256: string;
  provider: "openrouter" | "claude";
  model: string;
  pass: string;
  observedAt: string;
  observationKind: "search_result" | "fetched_content";
}

export interface SourceEvidenceQualityMetrics {
  groundedFieldCount: number;
  criticalFieldCount: number;
  criticalGroundedFieldCount: number;
  exactSourceCount: number;
  compatibleSourceCount: number;
  ambiguousSourceCount: number;
  divergentSourceCount: number;
  unverifiedSourceCount: number;
  confirmedOnlyByDivergentSourceCount: number;
  qualityIssuePaths: string[];
}

export interface ObservedEvidenceAdherence {
  status: SourceAdherenceStatus;
  criterios: Record<string, SourceAdherenceCriterion>;
  motivos: string[];
}

export function collectObservedCitationEvidence(
  node: unknown,
  context: Omit<ObservedCitationEvidence, "url" | "observedTitle" | "sanitizedExcerpt" | "contentSha256" | "observationKind">,
  policy: SourceEvidencePolicy,
): ObservedCitationEvidence[] {
  const byUrl = new Map<string, ObservedCitationEvidence>();

  function visit(value: unknown): void {
    if (Array.isArray(value)) {
      value.forEach(visit);
      return;
    }
    const obj = asRecord(value);
    if (!obj) return;

    const nestedCitation = obj.type === "url_citation" ? asRecord(obj.url_citation) : null;
    const searchResult = obj.type === "web_search_result" ? obj : null;
    const candidate = nestedCitation ?? searchResult ?? (obj.type === "url_citation" ? obj : null);
    if (candidate) {
      const url = readString(candidate.url);
      if (url && isHttpUrl(url)) {
        const title = limitText(readString(candidate.title) ?? readString(candidate.titulo), policy.publicObservedTitleMaxChars);
        const content = limitText(
          readString(candidate.content) ?? readString(candidate.snippet) ?? readString(candidate.page_content),
          policy.evidenceExcerptMaxChars,
        );
        const normalizedUrl = normalizeUrl(url);
        const fingerprintInput = [normalizedUrl, title ?? "", content ?? ""].join("\n");
        byUrl.set(normalizedUrl, {
          ...context,
          url,
          observedTitle: title,
          sanitizedExcerpt: content,
          contentSha256: createHash("sha256").update(fingerprintInput).digest("hex"),
          observationKind: "search_result",
        });
      }
    }

    Object.values(obj).forEach(visit);
  }

  visit(node);
  return [...byUrl.values()];
}

/**
 * Normalizes only completed `openrouter:web_fetch` payloads.  Search snippets
 * must never be promoted to fetched page content merely because they carry a
 * URL citation.
 */
export function collectObservedWebFetchEvidence(
  node: unknown,
  context: Omit<ObservedCitationEvidence, "url" | "observedTitle" | "sanitizedExcerpt" | "contentSha256" | "observationKind">,
  policy: SourceEvidencePolicy,
  allowedUrls: string[],
): ObservedCitationEvidence[] {
  const allowed = new Set(allowedUrls.map(normalizeUrl));
  const byUrl = new Map<string, ObservedCitationEvidence>();
  function visit(value: unknown): void {
    if (Array.isArray(value)) { value.forEach(visit); return; }
    const obj = asRecord(value);
    if (!obj) return;
    const url = readString(obj.url);
    const content = readString(obj.content);
    const status = readString(obj.status);
    if (url && content && status === "completed" && allowed.has(normalizeUrl(url)) && isHttpsUrl(url)) {
      const title = limitText(readString(obj.title) ?? readString(obj.titulo), policy.publicObservedTitleMaxChars);
      const excerpt = limitText(content, policy.evidenceExcerptMaxChars);
      if (excerpt) {
        const normalizedUrl = normalizeUrl(url);
        byUrl.set(normalizedUrl, {
          ...context, url, observedTitle: title, sanitizedExcerpt: excerpt,
          contentSha256: createHash("sha256").update([normalizedUrl, title ?? "", excerpt].join("\n")).digest("hex"),
          observationKind: "fetched_content",
        });
      }
    }
    Object.values(obj).forEach(visit);
  }
  visit(node);
  return [...byUrl.values()];
}

export function applySourceEvidenceAssessment(
  responsePayload: unknown,
  evidence: ObservedCitationEvidence[],
  vehicle: VehicleInput,
  policy: SourceEvidencePolicy,
): SourceEvidenceQualityMetrics {
  const root = asRecord(responsePayload);
  if (!root || !Array.isArray(root.fontes_utilizadas)) {
    return emptyQualityMetrics();
  }

  const evidenceByUrl = new Map(evidence.map((item) => [normalizeUrl(item.url), item]));
  const adherenceBySourceId = new Map<string, SourceAdherenceStatus>();

  for (const candidate of root.fontes_utilizadas) {
    const source = asRecord(candidate);
    if (!source) continue;
    delete source.avaliacao_aderencia;
    delete source.evidencia_busca;

    const id = readString(source.id);
    const url = readString(source.url);
    const observed = url ? findEvidence(url, evidenceByUrl) : null;
    const assessment = assessSourceAdherence(source, observed, vehicle, policy.version);

    source.avaliacao_aderencia = assessment;
    if (observed) {
      source.evidencia_busca = {
        observada: true,
        titulo_observado: observed.observedTitle ?? readString(source.titulo) ?? "Titulo nao informado pelo provider",
        observada_em: observed.observedAt,
        conteudo_sha256: observed.contentSha256,
        provider: observed.provider,
        modelo: observed.model,
        passe: observed.pass,
        nivel: observed.observationKind === "fetched_content" ? "conteudo_obtido" : "resultado_de_busca",
      };
    } else {
      source.evidencia_busca = { observada: false };
    }

    if (id) adherenceBySourceId.set(id, assessment.status as SourceAdherenceStatus);
  }

  const metrics = auditTechnicalFields(root, adherenceBySourceId, policy);
  isolateIneligiblePublicSources(root, adherenceBySourceId, policy);
  addEvidenceWarnings(root, metrics);
  recalculateBasicCompleteness(root);
  return metrics;
}

/**
 * A source may be useful while the provider is searching, but it must not be
 * presented as evidence for the final vehicle if it cannot satisfy the target.
 * In particular, an explicitly different model year is not a user-reviewable
 * alternative for a year-specific technical sheet.
 */
function isolateIneligiblePublicSources(
  root: Record<string, unknown>,
  adherenceBySourceId: Map<string, SourceAdherenceStatus>,
  policy: SourceEvidencePolicy,
): void {
  if (!Array.isArray(root.fontes_utilizadas)) return;
  const accepted = new Set<SourceAdherenceStatus>(policy.acceptedAdherenceStatuses);
  const removedIds: string[] = [];
  root.fontes_utilizadas = root.fontes_utilizadas.filter((candidate) => {
    const source = asRecord(candidate);
    const id = readString(source?.id);
    const status = id ? adherenceBySourceId.get(id) : "nao_verificada";
    const keep = Boolean(id && status && accepted.has(status));
    if (!keep && id) removedIds.push(id);
    return keep;
  });

  if (removedIds.length === 0) return;
  if (asRecord(root.ficha_tecnica)) {
    removeInvalidReferences(root.ficha_tecnica, new Set(removedIds));
  }
  const metadata = asRecord(root.metadados_coleta);
  if (metadata && Array.isArray(metadata.observacoes_gerais)) {
    const note = "Fontes sem aderencia suficiente ao veiculo alvo foram isoladas antes da publicacao.";
    if (!metadata.observacoes_gerais.includes(note)) metadata.observacoes_gerais.push(note);
  }
}

export function retainOnlyObservedAndPermittedSources(
  responsePayload: unknown,
  evidence: ObservedCitationEvidence[],
  isPermitted: (url: string) => boolean,
): string[] {
  const root = asRecord(responsePayload);
  if (!root || !Array.isArray(root.fontes_utilizadas)) return [];
  const evidenceUrls = new Set(evidence.map((item) => normalizeUrl(item.url)));
  const removedIds: string[] = [];

  root.fontes_utilizadas = root.fontes_utilizadas.filter((candidate) => {
    const source = asRecord(candidate);
    const id = readString(source?.id);
    const url = readString(source?.url);
    const keep = Boolean(url && findNormalizedUrl(url, evidenceUrls) && isPermitted(url));
    if (!keep && id) removedIds.push(id);
    return keep;
  });

  if (removedIds.length > 0 && asRecord(root.ficha_tecnica)) {
    removeInvalidReferences(root.ficha_tecnica, new Set(removedIds));
    const metadata = asRecord(root.metadados_coleta);
    if (metadata && Array.isArray(metadata.observacoes_gerais)) {
      metadata.observacoes_gerais.push(
        `${removedIds.length} fonte(s) nao observada(s) ou insegura(s) foram isoladas; campos sem evidencia restante foram rebaixados.`,
      );
    }
    recalculateBasicCompleteness(root);
  }

  return removedIds;
}

/**
 * Applies the server-owned authority boundary after evidence/adherence checks.
 * Model-declared source types never promote a hostname. First-party domains
 * come from configured policy or an exact document hunt; external evidence is
 * limited to the partner allowlist.
 */
export function retainOnlyTrustedSourceAuthorities(
  responsePayload: unknown,
  sourcePolicy: SourcePolicy,
  runtimeFirstPartyDomains: string[],
): { removedSourceIds: string[]; firstPartySourceCount: number; partnerSourceCount: number } {
  const root = asRecord(responsePayload);
  if (!root || !Array.isArray(root.fontes_utilizadas)) {
    return { removedSourceIds: [], firstPartySourceCount: 0, partnerSourceCount: 0 };
  }
  const firstPartyDomains = runtimeFirstPartyDomains.map(normalizeHostname);
  const partnerDomains = sourcePolicy.partnerDomains.map(normalizeHostname);
  const removedSourceIds: string[] = [];
  let firstPartySourceCount = 0;
  let partnerSourceCount = 0;

  root.fontes_utilizadas = root.fontes_utilizadas.filter((candidate) => {
    const source = asRecord(candidate);
    const id = readString(source?.id);
    const url = readString(source?.url);
    const hostname = url ? httpsHostname(url) : null;
    if (!source || !hostname) {
      if (id) removedSourceIds.push(id);
      return false;
    }
    if (hostMatchesAny(hostname, firstPartyDomains)) {
      firstPartySourceCount += 1;
      if (!sourcePolicy.officialSourceTypes.includes(readString(source.tipo) ?? "")) {
        source.tipo = looksLikeTechnicalDocumentUrl(url ?? "")
          ? "catalogo_ou_ficha_tecnica_oficial"
          : "site_oficial_montadora";
      }
      return true;
    }
    const declaredType = readString(source.tipo) ?? "";
    if (hostMatchesAny(hostname, partnerDomains) && sourcePolicy.partnerSourceTypes.includes(declaredType)) {
      partnerSourceCount += 1;
      return true;
    }
    if (id) removedSourceIds.push(id);
    return false;
  });

  if (removedSourceIds.length > 0) {
    removeInvalidReferences(root.ficha_tecnica, new Set(removedSourceIds));
    const metadata = asRecord(root.metadados_coleta);
    if (metadata && Array.isArray(metadata.observacoes_gerais)) {
      metadata.observacoes_gerais.push(
        `${removedSourceIds.length} fonte(s) sem autoridade de primeira parte ou parceria aprovada foram isoladas.`,
      );
    }
    recalculateBasicCompleteness(root);
  }
  return { removedSourceIds, firstPartySourceCount, partnerSourceCount };
}

export function assessObservedCitationAdherence(
  evidence: ObservedCitationEvidence,
  vehicle: VehicleInput,
  version: string,
): ObservedEvidenceAdherence {
  return assessSourceAdherence({ url: evidence.url, titulo: evidence.observedTitle ?? "" }, evidence, vehicle, version) as unknown as ObservedEvidenceAdherence;
}

function assessSourceAdherence(
  source: Record<string, unknown>,
  evidence: ObservedCitationEvidence | null,
  vehicle: VehicleInput,
  version: string,
): Record<string, unknown> {
  const criteria: Record<string, SourceAdherenceCriterion> = {
    marca_modelo: "nao_verificado",
    versao_motorizacao: "nao_verificado",
    ano_modelo: "nao_verificado",
    mercado: "nao_verificado",
  };
  const reasons: string[] = [];
  if (!evidence) {
    return { status: "nao_verificada", criterios: criteria, motivos: ["url_nao_observada_no_provider"], versao: version };
  }
  if (!isHttpsUrl(evidence.url)) {
    return {
      status: "nao_verificada",
      criterios: criteria,
      motivos: ["url_nao_https_ou_insegura"],
      versao: version,
      avaliada_em: evidence.observedAt,
    };
  }

  const urlText = normalizeText(evidence.url);
  const titleText = normalizeText(evidence.observedTitle ?? "");
  const contentText = normalizeText(evidence.sanitizedExcerpt ?? "");
  const strongText = `${urlText} ${titleText}`;
  const allText = `${strongText} ${contentText}`;
  const makeTokens = meaningfulTokens(vehicle.marca);
  const modelTokens = meaningfulTokens(vehicle.modelo);
  const versionTokens = meaningfulTokens(vehicle.versao);

  const makeMatch = tokenSetMatches(allText, makeTokens) || hostnameContains(evidence.url, makeTokens);
  const modelMatch = tokenSetMatches(allText, modelTokens);
  if (makeMatch && modelMatch) criteria.marca_modelo = "compativel";
  else reasons.push("marca_ou_modelo_nao_comprovado");

  if (versionTokens.length === 0 || tokenSetMatches(allText, versionTokens)) {
    criteria.versao_motorizacao = "compativel";
  } else {
    reasons.push("versao_ou_motorizacao_nao_comprovada");
  }

  const targetYear = String(vehicle.ano_modelo);
  const strongYears = extractModelYears(strongText);
  const contentYears = extractModelYears(contentText);
  if (strongYears.has(targetYear)) {
    criteria.ano_modelo = "compativel";
  } else if (strongYears.size > 0) {
    criteria.ano_modelo = "divergente";
    reasons.push(`ano_modelo_divergente:${[...strongYears].join(",")}`);
  } else if (contentYears.has(targetYear)) {
    criteria.ano_modelo = "compativel";
  } else if (contentYears.size === 1) {
    criteria.ano_modelo = "divergente";
    reasons.push(`ano_modelo_divergente:${[...contentYears][0]}`);
  } else {
    reasons.push("ano_modelo_nao_comprovado");
  }

  const market = normalizeText(vehicle.mercado);
  const brazilTarget = market.includes("brasil") || market.includes("brazil");
  const brazilSignal = /\b(br|brasil|brazil)\b/.test(urlText) || allText.includes("brasil") || allText.includes("brazil");
  const foreignMarketSignal = /\b(argentina|mexico|méxico|chile|colombia|colômbia|australia|austrália|united states|usa|europe|europa)\b/.test(allText);
  if (brazilTarget && brazilSignal) criteria.mercado = "compativel";
  else if (brazilTarget && foreignMarketSignal) {
    criteria.mercado = "divergente";
    reasons.push("mercado_divergente");
  } else if (!brazilTarget && allText.includes(market)) criteria.mercado = "compativel";
  else reasons.push("mercado_nao_comprovado");

  const values = Object.values(criteria);
  const status: SourceAdherenceStatus = values.includes("divergente")
    ? "divergente"
    : values.every((value) => value === "compativel")
      ? "exata"
      : criteria.marca_modelo === "compativel" && criteria.ano_modelo === "compativel"
        ? "compativel"
        : "ambigua";

  return {
    status,
    criterios: criteria,
    motivos: reasons,
    versao: version,
    avaliada_em: evidence.observedAt,
  };
}

function auditTechnicalFields(
  root: Record<string, unknown>,
  adherenceBySourceId: Map<string, SourceAdherenceStatus>,
  policy: SourceEvidencePolicy,
): SourceEvidenceQualityMetrics {
  const metrics = emptyQualityMetrics();
  for (const status of adherenceBySourceId.values()) {
    if (status === "exata") metrics.exactSourceCount += 1;
    else if (status === "compativel") metrics.compatibleSourceCount += 1;
    else if (status === "ambigua") metrics.ambiguousSourceCount += 1;
    else if (status === "divergente") metrics.divergentSourceCount += 1;
    else metrics.unverifiedSourceCount += 1;
  }

  const accepted = new Set<string>(policy.acceptedAdherenceStatuses);
  walkFields(root.ficha_tecnica, "ficha_tecnica", (field, path) => {
    const refs = Array.isArray(field.fonte_ref)
      ? field.fonte_ref.filter((value): value is string => typeof value === "string")
      : [];
    const statuses = refs.map((ref) => adherenceBySourceId.get(ref) ?? "nao_verificada");
    const isFilled = ["confirmado", "parcial", "inferido_minimamente"].includes(String(field.status));
    const isCritical = policy.criticalPathPrefixes.some((prefix) => path === prefix || path.startsWith(`${prefix}.`) || path.startsWith(`${prefix}[`));
    const grounded = statuses.some((status) => accepted.has(status));
    const onlyDivergent = statuses.length > 0 && statuses.every((status) => status === "divergente");

    if (isFilled && grounded) metrics.groundedFieldCount += 1;
    if (isCritical && field.status !== "nao_aplicavel") {
      metrics.criticalFieldCount += 1;
      if (isFilled && grounded) metrics.criticalGroundedFieldCount += 1;
    }
    if (isFilled && !grounded && refs.length > 0) {
      metrics.confirmedOnlyByDivergentSourceCount += 1;
      downgradeField(field, onlyDivergent ? "fonte_divergente_para_o_veiculo_alvo" : "campo_sem_fonte_aderente");
      metrics.qualityIssuePaths.push(path);
    } else if (field.status === "confirmado" && isCritical && !grounded) {
      downgradeField(field, "campo_critico_sem_fonte_aderente");
      metrics.qualityIssuePaths.push(path);
    }
  });
  metrics.qualityIssuePaths = [...new Set(metrics.qualityIssuePaths)];
  return metrics;
}

function downgradeField(field: Record<string, unknown>, reason: string): void {
  field.status = "parcial";
  field.obs_ref = "NF1";
  field.observacoes = `Confirmacao rebaixada pelo servidor: ${reason}. Revise as fontes associadas.`;
}

function removeInvalidReferences(node: unknown, removedIds: Set<string>): void {
  walkFields(node, "ficha_tecnica", (field) => {
    if (!Array.isArray(field.fonte_ref)) return;
    const remaining = field.fonte_ref.filter((ref) => typeof ref === "string" && !removedIds.has(ref));
    if (remaining.length > 0) {
      field.fonte_ref = remaining;
      if (field.status === "conflitante" && remaining.length < 2) {
        field.valor = null;
        field.status = "nao_encontrado";
        field.obs_ref = "NF1";
        delete field.fonte_ref;
        delete field.observacoes;
        delete field.valor_original;
      }
      return;
    }
    delete field.fonte_ref;
    if (["confirmado", "parcial", "inferido_minimamente", "conflitante"].includes(String(field.status))) {
      field.valor = null;
      field.status = "nao_encontrado";
      field.obs_ref = "NF1";
      delete field.observacoes;
      delete field.valor_original;
    }
  });
}

function addEvidenceWarnings(root: Record<string, unknown>, metrics: SourceEvidenceQualityMetrics): void {
  const metadata = asRecord(root.metadados_coleta);
  if (!metadata || !Array.isArray(metadata.observacoes_gerais)) return;
  const generalObservations = metadata.observacoes_gerais;
  const warnings: string[] = [];
  if (metrics.divergentSourceCount > 0) warnings.push("Ha fonte(s) divergente(s) do veiculo alvo; fonte oficial nao implica aderencia automatica.");
  if (metrics.ambiguousSourceCount + metrics.unverifiedSourceCount > 0) warnings.push("Ha fonte(s) ambigua(s) ou nao verificadas; revise a proveniencia exibida.");
  if (metrics.qualityIssuePaths.length > 0) warnings.push(`${metrics.qualityIssuePaths.length} campo(s) tiveram confirmacao rebaixada por evidencia insuficiente.`);
  warnings.forEach((warning) => {
    if (!generalObservations.includes(warning)) generalObservations.push(warning);
  });
}

function recalculateBasicCompleteness(root: Record<string, unknown>): void {
  const counters = { total_variaveis: 0, preenchidas: 0, nao_encontradas: 0, nao_aplicaveis: 0, conflitantes: 0 };
  walkFields(root.ficha_tecnica, "ficha_tecnica", (field) => {
    counters.total_variaveis += 1;
    if (["confirmado", "parcial", "inferido_minimamente"].includes(String(field.status))) counters.preenchidas += 1;
    else if (field.status === "nao_encontrado") counters.nao_encontradas += 1;
    else if (field.status === "nao_aplicavel") counters.nao_aplicaveis += 1;
    else if (field.status === "conflitante") counters.conflitantes += 1;
  });
  const previous = asRecord(root.resumo_completude) ?? {};
  root.resumo_completude = { ...previous, ...counters };
}

function walkFields(node: unknown, path: string, visitor: (field: Record<string, unknown>, path: string) => void): void {
  if (Array.isArray(node)) {
    node.forEach((item, index) => walkFields(item, `${path}[${index}]`, visitor));
    return;
  }
  const obj = asRecord(node);
  if (!obj) return;
  if (typeof obj.status === "string") visitor(obj, path);
  for (const [key, value] of Object.entries(obj)) {
    if (["valor", "status", "fonte_ref", "obs_ref", "observacoes"].includes(key)) continue;
    walkFields(value, `${path}.${key}`, visitor);
  }
}

function findEvidence(url: string, evidence: Map<string, ObservedCitationEvidence>): ObservedCitationEvidence | null {
  const direct = evidence.get(normalizeUrl(url));
  if (direct) return direct;
  const sourcePath = normalizeOriginAndPath(url);
  for (const item of evidence.values()) {
    if (sourcePath && sourcePath === normalizeOriginAndPath(item.url)) return item;
  }
  return null;
}

function findNormalizedUrl(url: string, urls: Set<string>): boolean {
  const normalized = normalizeUrl(url);
  if (urls.has(normalized)) return true;
  const sourcePath = normalizeOriginAndPath(url);
  return [...urls].some((candidate) => sourcePath !== null && sourcePath === normalizeOriginAndPath(candidate));
}

function normalizeUrl(value: string): string {
  try {
    const url = new URL(value);
    url.hash = "";
    url.hostname = url.hostname.toLowerCase();
    return url.toString().replace(/\/$/, "");
  } catch {
    return value.trim();
  }
}

function httpsHostname(value: string): string | null {
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? normalizeHostname(url.hostname) : null;
  } catch {
    return null;
  }
}

function normalizeHostname(value: string): string {
  return value.trim().toLowerCase().replace(/^www\./, "").replace(/\.$/, "");
}

function hostMatchesAny(hostname: string, domains: string[]): boolean {
  return domains.some((domain) => hostname === domain || hostname.endsWith(`.${domain}`));
}

function looksLikeTechnicalDocumentUrl(value: string): boolean {
  return /\.pdf(?:$|[?#])|ficha|technical|spec|brochure|catalog|manual/i.test(value);
}

function normalizeOriginAndPath(value: string): string | null {
  try {
    const url = new URL(value);
    return `${url.origin.toLowerCase()}${url.pathname.replace(/\/$/, "")}`;
  } catch {
    return null;
  }
}

function normalizeText(value: string): string {
  return value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function meaningfulTokens(value: string): string[] {
  const ignored = new Set(["de", "da", "do", "e", "the", "at", "mt", "4wd", "awd", "2wd"]);
  return normalizeText(value).split(" ").filter((token) => token.length >= 2 && !ignored.has(token));
}

function tokenSetMatches(text: string, tokens: string[]): boolean {
  return tokens.length === 0 || tokens.every((token) => text.includes(token));
}

function hostnameContains(url: string, tokens: string[]): boolean {
  try {
    const host = normalizeText(new URL(url).hostname);
    return tokens.length > 0 && tokens.every((token) => host.includes(token));
  } catch {
    return false;
  }
}

function extractModelYears(text: string): Set<string> {
  return new Set([...text.matchAll(/\b(?:my\s*)?((?:19|20)\d{2})\b/g)].map((match) => match[1]));
}

function limitText(value: string | null, maxChars: number): string | null {
  if (!value) return null;
  const sanitized = value.replace(/[\u0000-\u001F\u007F]/g, " ").replace(/\s+/g, " ").trim();
  if (!sanitized) return null;
  return sanitized.slice(0, Math.max(1, maxChars));
}

function readString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function isHttpUrl(value: string): boolean {
  try {
    return ["http:", "https:"].includes(new URL(value).protocol);
  } catch {
    return false;
  }
}

function isHttpsUrl(value: string): boolean {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null ? value as Record<string, unknown> : null;
}

function emptyQualityMetrics(): SourceEvidenceQualityMetrics {
  return {
    groundedFieldCount: 0,
    criticalFieldCount: 0,
    criticalGroundedFieldCount: 0,
    exactSourceCount: 0,
    compatibleSourceCount: 0,
    ambiguousSourceCount: 0,
    divergentSourceCount: 0,
    unverifiedSourceCount: 0,
    confirmedOnlyByDivergentSourceCount: 0,
    qualityIssuePaths: [],
  };
}
