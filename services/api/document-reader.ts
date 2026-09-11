import { createHash } from "node:crypto";
import { lookup as dnsLookup } from "node:dns/promises";
import { request as httpsRequest } from "node:https";
import { isIP } from "node:net";
import { PDFParse } from "pdf-parse";
import type { ObservedCitationEvidence } from "./source-evidence";
import type { ResearchDocumentPolicy } from "./runtime-assets";

export interface DocumentEvidencePage {
  page: number;
  text: string;
}

export interface DocumentEvidencePacket {
  sourceUrl: string;
  observedTitle: string;
  contentType: "application/pdf" | "text/html" | "application/xhtml+xml";
  contentSha256: string;
  pages: DocumentEvidencePage[];
}

export interface DocumentReaderTelemetry {
  attempted: number;
  downloaded: number;
  parsed: number;
  rejected: number;
  totalBytes: number;
  totalPages: number;
  providerFilesAttached: number;
  rejectionCounts: Record<string, number>;
}

export interface DocumentReaderResult {
  packets: DocumentEvidencePacket[];
  telemetry: DocumentReaderTelemetry;
}

interface ResolvedAddress {
  address: string;
  family: number;
}

interface DownloadedDocument {
  finalUrl: string;
  contentType: DocumentEvidencePacket["contentType"];
  body: Buffer;
}

type ResolveHost = (hostname: string) => Promise<ResolvedAddress[]>;

interface ReaderDependencies {
  resolveHost?: ResolveHost;
}

export async function readEligibleResearchDocuments(
  evidence: ObservedCitationEvidence[],
  runtimeFirstPartyDomains: string[],
  policy: ResearchDocumentPolicy["document_reader"],
  dependencies: ReaderDependencies = {},
): Promise<DocumentReaderResult> {
  const telemetry: DocumentReaderTelemetry = {
    attempted: 0,
    downloaded: 0,
    parsed: 0,
    rejected: 0,
    totalBytes: 0,
    totalPages: 0,
    providerFilesAttached: 0,
    rejectionCounts: {},
  };
  if (!policy.enabled) return { packets: [], telemetry };

  const allowedDomains = runtimeFirstPartyDomains.map(normalizeHostname);
  const candidates = uniqueEvidence(evidence)
    .filter((item) => isAllowedDocumentUrl(item.url, allowedDomains))
    .sort((left, right) => documentPriority(left.url) - documentPriority(right.url))
    .slice(0, Math.max(0, policy.max_documents));
  const packets: DocumentEvidencePacket[] = [];
  let remainingTextChars = Math.max(0, policy.max_text_chars_total);

  for (const item of candidates) {
    telemetry.attempted += 1;
    if (remainingTextChars <= 0) break;
    try {
      const downloaded = await downloadDocument(item.url, allowedDomains, policy, dependencies.resolveHost ?? defaultResolveHost);
      telemetry.downloaded += 1;
      telemetry.totalBytes += downloaded.body.byteLength;
      const packet = await parseDocument(downloaded, item, policy, Math.min(policy.max_text_chars_per_document, remainingTextChars));
      if (packet.pages.length === 0) throw new Error("document_without_extractable_text");
      packets.push(packet);
      telemetry.parsed += 1;
      telemetry.totalPages += packet.pages.length;
      remainingTextChars -= packet.pages.reduce((total, page) => total + page.text.length, 0);
    } catch (error) {
      telemetry.rejected += 1;
      const reason = classifyReaderRejection(error);
      telemetry.rejectionCounts[reason] = (telemetry.rejectionCounts[reason] ?? 0) + 1;
    }
  }

  return { packets, telemetry };
}

async function downloadDocument(
  initialUrl: string,
  allowedDomains: string[],
  policy: ResearchDocumentPolicy["document_reader"],
  resolveHost: ResolveHost,
): Promise<DownloadedDocument> {
  let currentUrl = initialUrl;
  for (let redirect = 0; redirect <= policy.max_redirects; redirect += 1) {
    const parsed = validateDocumentUrl(currentUrl, allowedDomains);
    const response = await requestOnce(parsed, policy.timeout_ms, policy.max_bytes_per_document, resolveHost);
    if (response.redirectLocation) {
      if (redirect >= policy.max_redirects) throw new Error("document_redirect_limit");
      currentUrl = new URL(response.redirectLocation, parsed).toString();
      continue;
    }
    if (response.statusCode < 200 || response.statusCode >= 300) throw new Error("document_http_status");
    const contentType = normalizeContentType(response.contentType);
    if (!contentType || !policy.allowed_content_types.includes(contentType)) throw new Error("document_content_type_not_allowed");
    if (contentType === "application/pdf" && !response.body.subarray(0, 5).equals(Buffer.from("%PDF-"))) {
      throw new Error("document_pdf_magic_invalid");
    }
    return { finalUrl: parsed.toString(), contentType, body: response.body };
  }
  throw new Error("document_redirect_limit");
}

async function requestOnce(
  url: URL,
  timeoutMs: number,
  maxBytes: number,
  resolveHost: ResolveHost,
): Promise<{ statusCode: number; contentType: string; redirectLocation: string | null; body: Buffer }> {
  const resolved = await resolveHost(url.hostname);
  if (resolved.length === 0 || resolved.some((item) => !isPublicIpAddress(item.address))) {
    throw new Error("document_host_not_public");
  }
  const selected = resolved[0]!;

  return new Promise((resolve, reject) => {
    const request = httpsRequest(url, {
      method: "GET",
      agent: false,
      headers: {
        Accept: "application/pdf,text/html,application/xhtml+xml;q=0.9",
        "User-Agent": "BlindSpot-DocumentReader/1.0",
      },
      lookup: (_hostname, options, callback) => {
        if (options.all) {
          callback(null, resolved);
          return;
        }
        callback(null, selected.address, selected.family);
      },
    }, (response) => {
      const statusCode = response.statusCode ?? 0;
      const locationHeader = response.headers.location;
      const redirectLocation = typeof locationHeader === "string" && [301, 302, 303, 307, 308].includes(statusCode)
        ? locationHeader
        : null;
      const contentLength = Number(response.headers["content-length"] ?? 0);
      if (Number.isFinite(contentLength) && contentLength > maxBytes) {
        response.destroy();
        reject(new Error("document_too_large"));
        return;
      }
      if (redirectLocation) {
        response.resume();
        resolve({ statusCode, contentType: "", redirectLocation, body: Buffer.alloc(0) });
        return;
      }
      const chunks: Buffer[] = [];
      let totalBytes = 0;
      response.on("data", (chunk: Buffer | Uint8Array) => {
        const buffer = Buffer.from(chunk);
        totalBytes += buffer.byteLength;
        if (totalBytes > maxBytes) {
          response.destroy(new Error("document_too_large"));
          return;
        }
        chunks.push(buffer);
      });
      response.on("end", () => resolve({
        statusCode,
        contentType: String(response.headers["content-type"] ?? ""),
        redirectLocation: null,
        body: Buffer.concat(chunks),
      }));
    });
    request.setTimeout(timeoutMs, () => request.destroy(new Error("document_timeout")));
    request.on("error", reject);
    request.end();
  });
}

async function parseDocument(
  document: DownloadedDocument,
  evidence: ObservedCitationEvidence,
  policy: ResearchDocumentPolicy["document_reader"],
  maxTextChars: number,
): Promise<DocumentEvidencePacket> {
  const contentSha256 = createHash("sha256").update(document.body).digest("hex");
  if (document.contentType === "application/pdf") {
    const parser = new PDFParse({ data: document.body });
    try {
      const result = await parser.getText({ first: Math.max(1, policy.max_pages_per_document) });
      const pages = result.pages
        .slice(0, policy.max_pages_per_document)
        .map((page) => ({ page: page.num, text: sanitizeDocumentText(page.text) }))
        .filter((page) => page.text.length > 0);
      return {
        sourceUrl: evidence.url,
        observedTitle: evidence.observedTitle ?? "Documento oficial observado",
        contentType: document.contentType,
        contentSha256,
        pages: truncatePages(pages, maxTextChars),
      };
    } finally {
      await parser.destroy();
    }
  }

  const htmlText = sanitizeDocumentText(extractVisibleHtmlText(document.body.toString("utf-8")));
  return {
    sourceUrl: evidence.url,
    observedTitle: evidence.observedTitle ?? "Pagina oficial observada",
    contentType: document.contentType,
    contentSha256,
    pages: htmlText ? [{ page: 1, text: htmlText.slice(0, maxTextChars) }] : [],
  };
}

export async function extractDocumentEvidencePacket(
  body: Buffer,
  contentType: DocumentEvidencePacket["contentType"],
  sourceUrl: string,
  evidence: ObservedCitationEvidence,
  policy: ResearchDocumentPolicy["document_reader"],
  maxTextChars = policy.max_text_chars_per_document,
): Promise<DocumentEvidencePacket> {
  return parseDocument({ finalUrl: sourceUrl, contentType, body }, evidence, policy, maxTextChars);
}

export function isPublicIpAddress(address: string): boolean {
  const normalized = address.toLowerCase();
  if (normalized.startsWith("::ffff:")) return isPublicIpAddress(normalized.slice(7));
  const family = isIP(normalized);
  if (family === 4) {
    const parts = normalized.split(".").map(Number);
    const [a, b] = parts;
    if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) return false;
    return !(
      a === 0 || a === 10 || a === 127 || a! >= 224 ||
      (a === 100 && b! >= 64 && b! <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b! >= 16 && b! <= 31) ||
      (a === 192 && (b === 0 || b === 168)) ||
      (a === 198 && (b === 18 || b === 19)) ||
      (a === 198 && b === 51) ||
      (a === 203 && b === 0)
    );
  }
  if (family === 6) {
    return !(
      normalized === "::" || normalized === "::1" ||
      normalized.startsWith("fc") || normalized.startsWith("fd") ||
      /^fe[89ab]/.test(normalized) || normalized.startsWith("ff") ||
      normalized.startsWith("2001:db8")
    );
  }
  return false;
}

function validateDocumentUrl(value: string, allowedDomains: string[]): URL {
  const url = new URL(value);
  const hostname = normalizeHostname(url.hostname);
  if (url.protocol !== "https:" || url.username || url.password || (url.port && url.port !== "443")) {
    throw new Error("document_url_not_safe");
  }
  if (!hostMatchesAny(hostname, allowedDomains)) throw new Error("document_domain_not_allowed");
  return url;
}

function isAllowedDocumentUrl(value: string, allowedDomains: string[]): boolean {
  try {
    validateDocumentUrl(value, allowedDomains);
    return true;
  } catch {
    return false;
  }
}

function normalizeContentType(value: string): DocumentEvidencePacket["contentType"] | null {
  const normalized = value.split(";", 1)[0]?.trim().toLowerCase();
  return normalized === "application/pdf" || normalized === "text/html" || normalized === "application/xhtml+xml"
    ? normalized
    : null;
}

function extractVisibleHtmlText(html: string): string {
  return html
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<(script|style|noscript|svg)[^>]*>[\s\S]*?<\/\1>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'");
}

function sanitizeDocumentText(value: string): string {
  return value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, " ").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
}

function truncatePages(pages: DocumentEvidencePage[], maxChars: number): DocumentEvidencePage[] {
  const output: DocumentEvidencePage[] = [];
  let remaining = Math.max(0, maxChars);
  for (const page of pages) {
    if (remaining <= 0) break;
    const text = page.text.slice(0, remaining);
    if (text) output.push({ page: page.page, text });
    remaining -= text.length;
  }
  return output;
}

function uniqueEvidence(evidence: ObservedCitationEvidence[]): ObservedCitationEvidence[] {
  const byUrl = new Map<string, ObservedCitationEvidence>();
  evidence.forEach((item) => byUrl.set(item.url, item));
  return [...byUrl.values()];
}

function documentPriority(url: string): number {
  return /\.pdf(?:$|[?#])/i.test(url) ? 0 : 1;
}

function normalizeHostname(value: string): string {
  return value.toLowerCase().replace(/^www\./, "").replace(/\.$/, "");
}

function hostMatchesAny(hostname: string, domains: string[]): boolean {
  return domains.some((domain) => hostname === domain || hostname.endsWith(`.${domain}`));
}

async function defaultResolveHost(hostname: string): Promise<ResolvedAddress[]> {
  return dnsLookup(hostname, { all: true, verbatim: true });
}

function classifyReaderRejection(error: unknown): string {
  const message = error instanceof Error ? error.message : "";
  const allowed = new Set([
    "document_without_extractable_text",
    "document_redirect_limit",
    "document_http_status",
    "document_content_type_not_allowed",
    "document_pdf_magic_invalid",
    "document_host_not_public",
    "document_too_large",
    "document_timeout",
    "document_url_not_safe",
    "document_domain_not_allowed",
  ]);
  if (allowed.has(message)) return message;
  return message.toLowerCase().includes("certificate") || message.toLowerCase().includes("tls")
    ? "document_tls_error"
    : "document_request_or_parse_error";
}
