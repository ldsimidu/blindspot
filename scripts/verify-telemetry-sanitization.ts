import { sanitizeBrandPresenceDiscovery, sanitizeDocumentReader, sanitizeOpenRouterPassTelemetry, sanitizeResearchMode, sanitizeSchemaValidationIssues, sanitizeSourceTrustBootstrap, sanitizeTelemetryPath } from "../services/api/logger";
import { formatAjvIssues } from "../services/api/validator";

const value = sanitizeTelemetryPath("/api/convites/secret-token-12345678901234567890/ativar?token=do-not-log");
if (value.includes("secret-token") || value.includes("?") || !value.includes("[redacted]")) {
  throw new Error("Telemetry path sanitization did not remove sensitive values.");
}

if (sanitizeResearchMode({ researchMode: "ex_prompt_compat" }) !== "ex_prompt_compat" || sanitizeResearchMode({ researchMode: "untrusted-mode" }) !== null) {
  throw new Error("Research mode telemetry must be allowlisted.");
}

const bootstrap = sanitizeSourceTrustBootstrap({
  sourceTrustBootstrap: {
    state: "completed",
    learnedAnchorCount: 1,
    discoveredCandidateCount: 2,
    candidateDocumentObserved: 3,
    candidateDocumentEligible: 1,
    candidateDocumentRejectionCounts: { ano_modelo_nao_comprovado: 2, "https://secret.example": 99 },
    hostname: "must-not-be-logged.example",
  },
});
if (!bootstrap || JSON.stringify(bootstrap).includes("hostname")) {
  throw new Error("Source-trust telemetry sanitization did not keep aggregate-only data.");
}
if (bootstrap.candidate_document_rejection_counts.ano_modelo_nao_comprovado !== 2 || JSON.stringify(bootstrap).includes("secret.example")) {
  throw new Error("Source-trust rejection telemetry leaked an unapproved key or lost aggregate counts.");
}

const brandPresence = sanitizeBrandPresenceDiscovery({
  brandPresenceDiscovery: {
    state: "completed",
    observed: 4,
    candidateHostCount: 1,
    hostname: "must-not-be-logged.example",
  },
});
if (!brandPresence || JSON.stringify(brandPresence).includes("hostname")) {
  throw new Error("Brand-presence telemetry sanitization did not keep aggregate-only data.");
}

const documentReader = sanitizeDocumentReader({
  documentReader: {
    state: "completed",
    attempted: 2,
    downloaded: 2,
    parsed: 1,
    rejected: 1,
    totalBytes: 2048,
    totalPages: 6,
    providerFilesAttached: 1,
    providerParserAttempted: 1,
    providerParserParsed: 1,
    providerParserRejected: 0,
    providerParserLastHttpStatus: 200,
    providerParserRejectionCounts: { provider_parser_http_error: 0, "https://secret.example": 99 },
    rejectionCounts: { document_timeout: 1, "https://secret.example": 99 },
    sourceUrl: "https://must-not-be-logged.example/document.pdf",
    text: "must-not-be-logged",
  },
});
if (!documentReader || documentReader.total_pages !== 6 || documentReader.provider_files_attached !== 1 || documentReader.provider_parser_parsed !== 1 || JSON.stringify(documentReader).includes("must-not-be-logged")) {
  throw new Error("Document-reader telemetry must retain aggregate counters only.");
}
if (documentReader.rejection_counts.document_timeout !== 1 || JSON.stringify(documentReader).includes("secret.example")) {
  throw new Error("Document-reader rejection telemetry leaked a non-enumerated reason.");
}

const openRouterPasses = sanitizeOpenRouterPassTelemetry({
  openRouterPassTelemetry: [{
    pass: "quick",
    requestCount: 2,
    requiredToolTurns: 1,
    toolOnlyTurns: 1,
    finalizationWithoutToolsTurns: 1,
    observedSourceCount: 3,
    inheritedEvidenceCount: 2,
    authorityRemovedSourceCount: 4,
    adherenceRemovedSourceCount: 1,
    documentAttachmentFallbackCount: 1,
    providerErrorCount: 1,
    lastProviderErrorStatus: 400,
    terminalState: "valid_json",
    rawResponse: "must-not-be-logged",
    url: "https://must-not-be-logged.example/private",
  }],
});
if (!openRouterPasses || JSON.stringify(openRouterPasses).includes("must-not-be-logged") || openRouterPasses[0]?.terminal_state !== "valid_json") {
  throw new Error("OpenRouter pass telemetry sanitization did not keep aggregate-only data.");
}
if (openRouterPasses[0]?.inherited_evidence_count !== 2 || openRouterPasses[0]?.authority_removed_source_count !== 4 || openRouterPasses[0]?.adherence_removed_source_count !== 1 || openRouterPasses[0]?.document_attachment_fallback_count !== 1 || openRouterPasses[0]?.last_provider_error_status !== 400) {
  throw new Error("OpenRouter pass telemetry lost evidence-handoff or source-removal counters.");
}

const schemaIssues = formatAjvIssues([{
  keyword: "required",
  instancePath: "/ficha_tecnica/motorizacao",
  schemaPath: "#/$defs/group/required",
  params: { missingProperty: "potencia_cv" },
  message: "must have required property",
}]);
if (schemaIssues[0]?.path !== "/ficha_tecnica/motorizacao/potencia_cv" || schemaIssues[0]?.keyword !== "required") {
  throw new Error("Schema validation issue did not preserve safe path and keyword.");
}
const sanitizedIssues = sanitizeSchemaValidationIssues({
  schemaIssues: [...schemaIssues, { path: "/unsafe/<payload>", keyword: "type", value: "must-not-be-logged" }],
});
if (sanitizedIssues.length !== 1 || JSON.stringify(sanitizedIssues).includes("must-not-be-logged")) {
  throw new Error("Schema validation telemetry leaked an unsafe path or value.");
}

console.log("TELEMETRY_SANITIZATION=PASS");
