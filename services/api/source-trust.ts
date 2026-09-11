import { normalizeCatalogText } from "./catalog";
import { assessObservedCitationAdherence, type ObservedCitationEvidence } from "./source-evidence";
import type { SourceEvidencePolicy, SourceTrustBootstrapPolicy } from "./runtime-assets";
import type { VehicleInput } from "./types";

export interface SourceTrustCandidate {
  hostname: string;
  confidence: number;
}

/**
 * Produces short-lived navigation domains from a make-and-market discovery.
 * They are deliberately not persisted or labelled official: an exact vehicle
 * document is still required before source trust can be learned.
 */
export function deriveBrandPresenceCandidateDomains(
  evidence: ObservedCitationEvidence[],
  vehicle: VehicleInput,
  maxCandidateHosts: number,
): string[] {
  const candidates = new Set<string>();
  for (const item of evidence) {
    const hostname = publicHttpsHostname(item.url);
    if (hostname && (hostnameMatchesBrand(hostname, vehicle.marca) || looksLikeFirstPartyBrandPresence(item, vehicle))) {
      candidates.add(hostname);
    }
  }
  return [...candidates].sort((left, right) => left.localeCompare(right)).slice(0, Math.max(0, maxCandidateHosts));
}

export function deriveSourceTrustCandidates(
  evidence: ObservedCitationEvidence[],
  vehicle: VehicleInput,
  sourceEvidencePolicy: SourceEvidencePolicy,
  policy: SourceTrustBootstrapPolicy,
  navigationCandidateDomains: string[] = [],
): SourceTrustCandidate[] {
  const candidates = new Map<string, SourceTrustCandidate>();
  const navigationCandidates = new Set(navigationCandidateDomains.map((hostname) => hostname.toLowerCase().replace(/^www\./, "")));
  for (const item of evidence) {
    const hostname = publicHttpsHostname(item.url);
    if (!hostname || (!hostnameMatchesBrand(hostname, vehicle.marca) && !navigationCandidates.has(hostname))) continue;
    const adherence = assessObservedCitationAdherence(item, vehicle, sourceEvidencePolicy.version);
    if (policy.bootstrap.requires_exact_adherence && adherence.status !== "exata") continue;
    if (!looksLikeVehicleDocument(item)) continue;
    const confidence = adherence.status === "exata" ? 5 : 3;
    const current = candidates.get(hostname);
    if (!current || confidence > current.confidence) candidates.set(hostname, { hostname, confidence });
  }
  return [...candidates.values()].sort((left, right) => right.confidence - left.confidence || left.hostname.localeCompare(right.hostname)).slice(0, policy.bootstrap.max_candidate_hosts);
}

/**
 * Allows abbreviated corporate domains (for example a brand acronym) to be
 * used as a navigation route. This is deliberately weaker than source trust:
 * the hostname is promoted only after a second, exact vehicle-document check.
 */
function looksLikeFirstPartyBrandPresence(item: ObservedCitationEvidence, vehicle: VehicleInput): boolean {
  const hostname = publicHttpsHostname(item.url);
  if (!hostname || looksLikeNonFirstPartyHost(hostname)) return false;
  const text = normalizeCatalogText(`${item.observedTitle ?? ""} ${item.sanitizedExcerpt ?? ""}`);
  const brandTokens = normalizeCatalogText(vehicle.marca).split(" ").filter((token) => token.length >= 3);
  if (brandTokens.length === 0 || !brandTokens.every((token) => text.includes(token))) return false;
  const brazilTarget = normalizeCatalogText(vehicle.mercado).includes("brasil");
  const marketSignal = brazilTarget
    ? hostname.endsWith(".br") || /\b(brasil|brazil)\b/.test(text)
    : text.includes(normalizeCatalogText(vehicle.mercado));
  return marketSignal && !/revista|noticia|news|blog|forum|dealer|concessionaria|seminovos|usados|comparador|catalogo de carros/.test(text);
}

function looksLikeNonFirstPartyHost(hostname: string): boolean {
  return /(^|\.)(facebook|instagram|youtube|wikipedia|reddit|x|tiktok|linkedin)\./.test(hostname)
    || /carrosnaweb|webmotors|icarros|mobiauto|motor1|quatrorodas|autoo|kbb/.test(hostname);
}

function hostnameMatchesBrand(hostname: string, brand: string): boolean {
  const normalizedBrand = normalizeCatalogText(brand);
  const compactBrand = normalizedBrand.replace(/\s+/g, "");
  const hostnameCompact = hostname.replace(/[^a-z0-9]/g, "");
  if (compactBrand.length >= 3 && hostnameCompact.includes(compactBrand)) return true;
  const hostnameTokens = hostname.split(/[.-]/).filter((token) => token.length >= 3);
  const brandTokens = normalizedBrand.split(" ").filter((token) => token.length >= 3);
  return brandTokens.some((token) => hostnameTokens.includes(token));
}

export function publicHttpsHostname(value: string): string | null {
  try {
    const parsed = new URL(value);
    const hostname = parsed.hostname.toLowerCase().replace(/^www\./, "");
    if (parsed.protocol !== "https:" || !hostname || hostname === "localhost" || hostname.includes(":") || hostname.includes("xn--") || /^\d+(?:\.\d+){3}$/.test(hostname)) return null;
    if (!/^[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?$/.test(hostname) || !hostname.includes(".")) return null;
    return hostname;
  } catch {
    return null;
  }
}

function looksLikeVehicleDocument(item: ObservedCitationEvidence): boolean {
  return /ficha|spec|technical|brochure|catalog|manual|owner|pdf|configur/i.test(`${item.url} ${item.observedTitle ?? ""}`);
}
