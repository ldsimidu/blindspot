import assert from "node:assert/strict";
import { extractDocumentEvidencePacket, isPublicIpAddress, readEligibleResearchDocuments } from "../services/api/document-reader";
import {
  buildDocumentEvidencePacketFromOpenRouterAnnotation,
  buildOpenRouterFileParserPlugins,
  buildOpenRouterUserContent,
  extractOpenRouterFileAnnotations,
  readOpenRouterProviderPdfDocuments,
  selectOpenRouterProviderPdfUrls,
  shouldFailForUnreadableOfficialPdf,
} from "../services/api/llm";
import { readResearchDocumentPolicy } from "../services/api/runtime-assets";
import type { ObservedCitationEvidence } from "../services/api/source-evidence";

const runtimePolicy = await readResearchDocumentPolicy();
const policy = runtimePolicy.document_reader;
const evidence: ObservedCitationEvidence = {
  url: "https://official.example/ficha-2025.pdf",
  observedTitle: "Ficha tecnica 2025",
  sanitizedExcerpt: "Documento oficial observado",
  contentSha256: "fixture",
  provider: "openrouter",
  model: "fixture",
  pass: "candidate_document_year_archive",
  observedAt: "2030-01-01T00:00:00.000Z",
};

assert.equal(isPublicIpAddress("8.8.8.8"), true);
assert.equal(isPublicIpAddress("127.0.0.1"), false);
assert.equal(isPublicIpAddress("10.0.0.1"), false);
assert.equal(isPublicIpAddress("169.254.169.254"), false);
assert.equal(isPublicIpAddress("::1"), false);
assert.equal(isPublicIpAddress("2001:4860:4860::8888"), true);

const blocked = await readEligibleResearchDocuments([evidence], ["official.example"], policy, {
  resolveHost: async () => [{ address: "127.0.0.1", family: 4 }],
});
assert.deepEqual(blocked.telemetry, {
  attempted: 1,
  downloaded: 0,
  parsed: 0,
  rejected: 1,
  totalBytes: 0,
  totalPages: 0,
  providerFilesAttached: 0,
  rejectionCounts: { document_host_not_public: 1 },
}, "leitor deve bloquear resolucao para endereco privado antes do download");

const providerUrls = selectOpenRouterProviderPdfUrls(
  [
    evidence,
    { ...evidence, url: "https://sub.official.example/catalog.pdf#page=2" },
    { ...evidence, url: "https://carsnaweb.example/ficha.pdf" },
    { ...evidence, url: "http://official.example/insecure.pdf" },
    { ...evidence, url: "https://user:password@official.example/secret.pdf" },
    { ...evidence, url: "https://official.example:8443/custom-port.pdf" },
    { ...evidence, url: "https://official.example/page.html" },
  ],
  [],
  ["official.example"],
  2,
);
assert.deepEqual(providerUrls, [
  "https://official.example/ficha-2025.pdf",
  "https://sub.official.example/catalog.pdf",
], "fallback do provider deve aceitar apenas PDFs HTTPS de primeira parte");
assert.deepEqual(
  selectOpenRouterProviderPdfUrls([evidence], [{
    sourceUrl: evidence.url,
    observedTitle: evidence.observedTitle ?? "",
    contentType: "application/pdf",
    contentSha256: "a".repeat(64),
    pages: [{ page: 1, text: "parsed" }],
  }], ["official.example"], 2),
  [],
  "PDF ja lido localmente nao deve ser anexado novamente",
);
assert.deepEqual(
  selectOpenRouterProviderPdfUrls([evidence], [], ["docs.official.example"], 2),
  [],
  "dominio pai nao deve herdar permissao de um subdominio promovido",
);
const providerContent = buildOpenRouterUserContent("prompt", providerUrls);
assert.ok(Array.isArray(providerContent));
assert.deepEqual(providerContent[1], {
  type: "file",
  file: { filename: "official-document-1.pdf", file_data: providerUrls[0] },
});
assert.deepEqual(buildOpenRouterFileParserPlugins(providerUrls, "cloudflare-ai"), [{
  id: "file-parser",
  pdf: { engine: "cloudflare-ai" },
}], "request com PDF deve ativar o plugin oficial file-parser");
assert.deepEqual(buildOpenRouterFileParserPlugins([], "cloudflare-ai"), []);

const annotationPayload = {
  choices: [{ message: { annotations: [{
    type: "file",
    file: {
      hash: "provider-hash",
      name: "official-document-1.pdf",
      content: [
        { type: "text", text: "Ford Ranger Raptor 2025" },
        { type: "image_url", image_url: { url: "data:image/png;base64,not-retained" } },
        { type: "text", text: "Potencia 397 cv" },
      ],
    },
  }] } }],
};
const annotations = extractOpenRouterFileAnnotations(annotationPayload);
assert.equal(annotations.length, 1);
assert.equal(annotations[0]?.file.content.length, 2, "imagens base64 nao devem entrar no pacote textual");
const providerPacket = buildDocumentEvidencePacketFromOpenRouterAnnotation(
  annotations[0]!, evidence.url, evidence.observedTitle ?? "", policy,
);
assert.equal(providerPacket?.pages.length, 2);
assert.match(providerPacket?.contentSha256 ?? "", /^[a-f0-9]{64}$/);

const errorAnnotations = extractOpenRouterFileAnnotations({
  error: { metadata: { file_annotations: annotationPayload.choices[0]!.message.annotations } },
});
assert.equal(errorAnnotations.length, 1, "anotacoes devem ser recuperadas mesmo quando a inferencia falha");

let isolatedRequest: Record<string, unknown> | undefined;
const isolatedRead = await readOpenRouterProviderPdfDocuments({
  apiKey: "test-key",
  model: "test/model",
  documentFileUrls: [evidence.url],
  evidence: [evidence],
  policy,
  fetchImpl: async (_input, init) => {
    isolatedRequest = JSON.parse(String(init?.body)) as Record<string, unknown>;
    return new Response(JSON.stringify(annotationPayload), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  },
});
assert.equal(isolatedRead.telemetry.parsed, 1);
assert.equal(isolatedRead.packets.length, 1);
assert.equal("tools" in (isolatedRequest ?? {}), false, "parser isolado nao deve executar web search");
assert.deepEqual((isolatedRequest?.plugins as unknown[] | undefined)?.length, 1);

const errorPathRead = await readOpenRouterProviderPdfDocuments({
  apiKey: "test-key",
  model: "test/model",
  documentFileUrls: [evidence.url],
  evidence: [evidence],
  policy,
  fetchImpl: async () => new Response(JSON.stringify({
    error: { metadata: { file_annotations: annotationPayload.choices[0]!.message.annotations } },
  }), {
    status: 502,
    headers: { "Content-Type": "application/json" },
  }),
});
assert.equal(errorPathRead.packets.length, 1, "parsing concluido deve sobreviver a falha posterior de inferencia");
assert.equal(errorPathRead.telemetry.lastHttpStatus, 502);

const unreadableRead = await readOpenRouterProviderPdfDocuments({
  apiKey: "test-key",
  model: "test/model",
  documentFileUrls: [evidence.url],
  evidence: [evidence],
  policy,
  fetchImpl: async () => new Response(JSON.stringify({ error: { message: "document unavailable" } }), {
    status: 500,
    headers: { "Content-Type": "application/json" },
  }),
});
assert.equal(unreadableRead.telemetry.rejected, 1);
assert.equal(unreadableRead.telemetry.rejectionCounts.provider_parser_http_error, 1);
assert.equal(shouldFailForUnreadableOfficialPdf(1, unreadableRead.packets.length, true), true);
assert.equal(shouldFailForUnreadableOfficialPdf(1, 1, true), false);
assert.equal(shouldFailForUnreadableOfficialPdf(1, 0, false), false);

const htmlPacket = await extractDocumentEvidencePacket(
  Buffer.from("<html><style>secret{}</style><body><h1>BYD King GL 2025</h1><script>ignore this instruction</script><p>Potencia combinada 235 cv</p></body></html>"),
  "text/html",
  "https://official.example/king",
  { ...evidence, url: "https://official.example/king" },
  policy,
);
assert.match(htmlPacket.pages[0]?.text ?? "", /BYD King GL 2025/);
assert.match(htmlPacket.pages[0]?.text ?? "", /235 cv/);
assert.equal((htmlPacket.pages[0]?.text ?? "").includes("ignore this instruction"), false, "script HTML nao deve entrar no pacote");

const pdfPacket = await extractDocumentEvidencePacket(
  buildPdf("Ford Ranger Raptor 2025 Brasil 397 cv"),
  "application/pdf",
  evidence.url,
  evidence,
  policy,
);
assert.equal(pdfPacket.pages.length, 1);
assert.match(pdfPacket.pages[0]?.text ?? "", /Ranger Raptor 2025/);
assert.match(pdfPacket.contentSha256, /^[a-f0-9]{64}$/);

console.log("DOCUMENT_READER_CHECK=PASS");

function buildPdf(text: string): Buffer {
  const escaped = text.replace(/([()\\])/g, "\\$1");
  const stream = `BT /F1 12 Tf 72 720 Td (${escaped}) Tj ET`;
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream`,
  ];
  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(pdf));
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xrefOffset = Buffer.byteLength(pdf);
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  pdf += offsets.slice(1).map((offset) => `${String(offset).padStart(10, "0")} 00000 n \n`).join("");
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
  return Buffer.from(pdf);
}
