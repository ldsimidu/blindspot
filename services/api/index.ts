import "./env";
import cors from "cors";
import express, { NextFunction, Request, Response } from "express";
import {
  createRequestId,
  logHttpRequest,
  logServerError,
  logValidationFailure,
  logValidatedTechnicalSheetResult,
  readRecentLLMResponses,
  readLatestLLMResponseSnapshot,
  saveLLMResponseSnapshot
} from "./logger";
import { callLLM } from "./llm";
import { getPersistenceMode } from "./db/client";
import { readLearnedSourceTrustAnchors, recordSourceTrustCandidates } from "./db/source-trust-repository";
import { checkReadiness } from "./readiness";
import { createWorkspaceSheet, listOrganizationVehicleWorkspaces, persistTechnicalSheet, readCatalogEntryExact, readCatalogRecommendations, readLatestTechnicalSheet, readTechnicalSheetExport, readTechnicalSheetHistory, readVehicleWorkspace, searchCatalog, searchTechnicalCatalog } from "./db/repository";
import { confirmImportRun, createImportDryRun, hashImportPayload, readImportRun, type PreparedImportItem } from "./imports";
import { login, logout, readAuthenticationContext, readCurrentSession, sessionCookieName, sessionCookieOptions, type AuthContext, type OrganizationRole } from "./authentication";
import { recordAudit, type AuditAction, type AuditResourceType } from "./audit";
import { activateOrganizationMemberInvitation, changeOrganizationMemberRole, deactivateOrganizationMember, inviteOrganizationMember, listOrganizationPeople, revokeOrganizationMemberInvitation } from "./members";
import { acknowledgeUsageAlert, evaluateUsagePolicy, parseUsagePeriod, readUsageAlerts, readUsageSummary, recordUsageFailure, updateUsagePolicy } from "./usage";
import { createSavedComparison, listSavedComparisons, readSavedComparison } from "./comparisons";
import { cancelResearchSession, createResearchSession, executeResearchSession, listResearchSessions, researchFocuses, type ResearchFocus } from "./research-sessions";
import { createQualityReport, decideQualityReport } from "./quality-reports";
import { readResearchSessionQualityImpact } from "./research-session-quality-impact";
import { readResearchSessionHistory, startResearchSessionHistoryRetentionSweep } from "./research-session-history";
import { readFieldExplanation } from "./field-explanation";
import { clearTechnicalSheetPrimary, revokeManualTechnicalSheetTag, setManualTechnicalSheetTag, setTechnicalSheetPrimary, transitionTechnicalSheetLifecycle } from "./technical-sheet-governance";
import { isValidCnpj, normalizeCnpj } from "../../packages/contracts/cnpj";
import { activateInitialAdmin, decideOrganizationRequest, issueInitialAdminInvitation, listPendingOrganizationRequests, registerOrganization, revokeInitialAdminInvitation, submitOrganizationRequest } from "./organizations";
import { buildVehiclePayload, composeFinalPrompt, readBaseAgentPrompt, readOutputSchema } from "./prompt-builder";
import { readFieldPolicy, readFieldStatePolicy, readNormalizationPolicy, readQualityPolicy, readResearchCapabilityPolicy, readResearchDocumentPolicy, readSourceEvidencePolicy, readSourcePolicy, readSourceTrustBootstrapPolicy, readTechnicalSearchFacetPolicy, type TechnicalSearchFacetPolicy } from "./runtime-assets";
import { FichaTecnicaHistoryItem, HttpError, ValidationError, VehicleInput } from "./types";
import { validateResponse } from "./validator";

const app = express();
const port = Number(process.env.PORT ?? 3001);
startResearchSessionHistoryRetentionSweep();

app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use((req, res, next) => {
  const requestId = createRequestId();
  const startedAt = new Date().toISOString();
  const startedHr = process.hrtime.bigint();

  res.setHeader("x-request-id", requestId);

  res.on("finish", () => {
    const elapsedNs = process.hrtime.bigint() - startedHr;
    const durationMs = Number(elapsedNs) / 1_000_000;

    void logHttpRequest({
      requestId,
      method: req.method,
      path: sanitizeRequestPath(req.path),
      statusCode: res.statusCode,
      durationMs,
      at: startedAt
    });
  });

  next();
});

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/api/readiness", async (_req, res) => {
  const readiness = await checkReadiness();
  res.status(readiness.status === "ready" ? 200 : 503).json(readiness);
});

app.post("/api/auth/login", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = parseLogin(req.body);
    const result = await login(input.email, input.password, req.ip ?? "unknown");
    if (result.state !== "authenticated") { res.status(403).json({ state: result.state }); return; }
    res.cookie(sessionCookieName(), result.token, sessionCookieOptions(result.expiresAt));
    res.status(200).json({ state: "authenticated", expires_at: result.expiresAt.toISOString() });
  } catch (error) { next(error); }
});

app.post("/api/auth/logout", async (req: Request, res: Response, next: NextFunction) => {
  try {
    await logout(readCookie(req, sessionCookieName()));
    res.clearCookie(sessionCookieName(), sessionCookieOptions());
    res.status(204).end();
  } catch (error) { next(error); }
});

app.get("/api/auth/session", async (req: Request, res: Response, next: NextFunction) => {
  try { res.status(200).json({ state: "authenticated", ...(await readCurrentSession(readCookie(req, sessionCookieName()))) }); } catch (error) { next(error); }
});

app.post("/api/organizacoes/solicitacoes", async (req: Request, res: Response, next: NextFunction) => {
  try { res.status(202).json(await submitOrganizationRequest(parseOrganizationRequest(req.body))); } catch (error) { next(error); }
});

app.post("/api/organizacoes/cadastro", async (req: Request, res: Response, next: NextFunction) => {
  try { res.status(202).json(await registerOrganization(parseOrganizationRegistration(req.body))); } catch (error) { next(error); }
});

app.get("/api/operacoes/organizacoes/solicitacoes", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const key = req.header("x-operator-approval-key");
    if (!key) throw new HttpError(404, "Solicitacao indisponivel para decisao.");
    const state = req.query.state === undefined || req.query.state === "received" ? "received" : null;
    if (!state) throw new HttpError(400, "Consulta invalida.");
    const page = parsePositiveQuery(req.query.page, 1, 10000); const pageSize = parsePositiveQuery(req.query.page_size, 20, 100);
    res.status(200).json(await listPendingOrganizationRequests(key, page, pageSize));
  } catch (error) { next(error); }
});

app.post("/api/organizacoes/solicitacoes/:protocol/decisao", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const key = req.header("x-operator-approval-key");
    if (!key) throw new HttpError(404, "Solicitacao indisponivel para decisao.");
    const decision = isObject(req.body) && (req.body.decision === "approved" || req.body.decision === "rejected") ? req.body.decision : null;
    if (!decision) throw new HttpError(400, "Decisao invalida.");
    res.status(200).json(await decideOrganizationRequest(parseProtocol(req.params.protocol), decision, key));
  } catch (error) { next(error); }
});

app.post("/api/organizacoes/solicitacoes/:protocol/convites/admin-inicial", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const key = req.header("x-operator-approval-key");
    if (!key) throw new HttpError(404, "Solicitacao indisponivel para convite.");
    res.status(201).json(await issueInitialAdminInvitation(parseProtocol(req.params.protocol), key));
  } catch (error) { next(error); }
});

app.post("/api/organizacoes/convites/:id/revogar", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const key = req.header("x-operator-approval-key");
    if (!key) throw new HttpError(404, "Convite indisponivel.");
    res.status(200).json(await revokeInitialAdminInvitation(parseCatalogId(req.params.id), key));
  } catch (error) { next(error); }
});

app.post("/api/convites/:token/ativar", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = parseInvitationActivation(req.body);
    res.status(200).json(await activateInitialAdmin(parseInvitationToken(req.params.token), input.displayName, input.password));
  } catch (error) { next(error); }
});

app.get("/api/organizacoes/membros", requireRole("member.denied", "organization_member", "admin"), async (req: Request, res: Response, next: NextFunction) => {
  try { res.status(200).json(await listOrganizationPeople(authorizationContext(req))); } catch (error) { next(error); }
});

app.post("/api/organizacoes/membros/convites", requireRole("member.denied", "member_invitation", "admin"), async (req: Request, res: Response, next: NextFunction) => {
  try { const input = parseMemberInvitation(req.body); res.status(201).json(await inviteOrganizationMember(authorizationContext(req), input.email, input.role, requestIdOf(res))); } catch (error) { next(error); }
});

app.post("/api/organizacoes/membros/convites/:id/revogar", requireRole("member.denied", "member_invitation", "admin"), async (req: Request, res: Response, next: NextFunction) => {
  try { res.status(200).json(await revokeOrganizationMemberInvitation(authorizationContext(req), parseCatalogId(req.params.id), requestIdOf(res))); } catch (error) { next(error); }
});

app.post("/api/organizacoes/membros/:id/papel", requireRole("member.denied", "organization_member", "admin"), async (req: Request, res: Response, next: NextFunction) => {
  try { res.status(200).json(await changeOrganizationMemberRole(authorizationContext(req), parseCatalogId(req.params.id), parseOrganizationRole(req.body), requestIdOf(res))); } catch (error) { next(error); }
});

app.post("/api/organizacoes/membros/:id/desativar", requireRole("member.denied", "organization_member", "admin"), async (req: Request, res: Response, next: NextFunction) => {
  try { res.status(200).json(await deactivateOrganizationMember(authorizationContext(req), parseCatalogId(req.params.id), requestIdOf(res))); } catch (error) { next(error); }
});

app.post("/api/convites/membros/:token/ativar", async (req: Request, res: Response, next: NextFunction) => {
  try { const input = parseInvitationActivation(req.body); res.status(200).json(await activateOrganizationMemberInvitation(parseMemberInvitationToken(req.params.token), input.displayName, input.password, requestIdOf(res))); } catch (error) { next(error); }
});

app.get("/api/organizacoes/consumo", requireRole("usage.denied", "usage", "admin"), async (req: Request, res: Response, next: NextFunction) => {
  try { res.status(200).json(await readUsageSummary(authorizationContext(req), parseUsagePeriod(req.query.period))); } catch (error) { next(error); }
});

app.get("/api/organizacoes/consumo/alertas", requireRole("usage.denied", "usage", "admin"), async (req: Request, res: Response, next: NextFunction) => {
  try { res.status(200).json(await readUsageAlerts(authorizationContext(req))); } catch (error) { next(error); }
});

app.post("/api/organizacoes/consumo/politica", requireRole("usage.denied", "usage", "admin"), async (req: Request, res: Response, next: NextFunction) => {
  try { const input = parseUsagePolicy(req.body); res.status(200).json(await updateUsagePolicy(authorizationContext(req), input.thresholdUnits, input.isActive, requestIdOf(res))); } catch (error) { next(error); }
});

app.post("/api/organizacoes/consumo/alertas/:id/reconhecer", requireRole("usage.denied", "usage", "admin"), async (req: Request, res: Response, next: NextFunction) => {
  try { res.status(200).json(await acknowledgeUsageAlert(authorizationContext(req), parseCatalogId(req.params.id), requestIdOf(res))); } catch (error) { next(error); }
});

app.post("/api/comparacoes", requireRole("comparison.denied", "saved_comparison", "analyst", "admin"), async (req: Request, res: Response, next: NextFunction) => {
  try { res.status(201).json(await createSavedComparison(authorizationContext(req), parseComparisonVersionIds(req.body), requestIdOf(res))); } catch (error) { next(error); }
});

app.post("/api/technical-sheets/:id/research-sessions", requireRole("research_session.denied", "research_session", "analyst", "admin"), async (req: Request, res: Response, next: NextFunction) => {
  try { const input = parseResearchSessionInput(req.body); const result = await createResearchSession({ sheetId: parseCatalogId(req.params.id), ...input, actor: authorizationContext(req), requestId: requestIdOf(res) }); await recordAudit({ actor: authorizationContext(req), action: "research_session.created", resourceType: "research_session", resourceId: result.id, outcome: "allowed", requestId: requestIdOf(res) }); res.status(201).json(result); } catch (error) { next(error); }
});
app.get("/api/technical-sheets/:id/research-sessions", requireRole("research_session.denied", "research_session", "analyst", "admin"), async (req: Request, res: Response, next: NextFunction) => { try { res.status(200).json({ sessions: await listResearchSessions(parseCatalogId(req.params.id), authorizationContext(req)) }); } catch (error) { next(error); } });
app.post("/api/research-sessions/:id/executar", requireRole("research_session.denied", "research_session", "analyst", "admin"), async (req: Request, res: Response, next: NextFunction) => { try { res.status(200).json(await executeResearchSession(parseCatalogId(req.params.id), authorizationContext(req), requestIdOf(res))); } catch (error) { next(error); } });
app.post("/api/research-sessions/:id/cancelar", requireRole("research_session.denied", "research_session", "analyst", "admin"), async (req: Request, res: Response, next: NextFunction) => { try { const actor = authorizationContext(req); const result = await cancelResearchSession(parseCatalogId(req.params.id), actor); await recordAudit({ actor, action: "research_session.cancelled", resourceType: "research_session", resourceId: result.id, outcome: "allowed", requestId: requestIdOf(res) }); res.status(200).json(result); } catch (error) { next(error); } });
  app.get("/api/research-sessions/:id/impacto", requireRole("research_session.denied", "research_session", "analyst", "admin"), async (req: Request, res: Response, next: NextFunction) => { try { const actor = authorizationContext(req); const id = parseCatalogId(req.params.id); const impact = await readResearchSessionQualityImpact(id, actor); await recordAudit({ actor, action: "research_session.impact_read", resourceType: "research_session_quality_impact", resourceId: id, outcome: "allowed", requestId: requestIdOf(res) }); res.status(200).json(impact); } catch (error) { next(error); } });
  app.get("/api/research-sessions/:id/historico", requireRole("research_session.denied", "research_session", "analyst", "admin"), async (req: Request, res: Response, next: NextFunction) => { try { const actor = authorizationContext(req); const id = parseCatalogId(req.params.id); const history = await readResearchSessionHistory(id, actor); await recordAudit({ actor, action: "research_session.history_read", resourceType: "research_session", resourceId: id, outcome: "allowed", requestId: requestIdOf(res) }); res.status(200).json(history); } catch (error) { next(error); } });
app.get("/api/ficha-tecnica/versoes/:id/explicacao-variavel", requireRole("technical_sheet.denied", "technical_sheet", "analyst", "admin"), async (req: Request, res: Response, next: NextFunction) => { try { const actor = authorizationContext(req); const versionId = parseCatalogId(req.params.id); const fieldPath = parseFieldPath(req.query.path); const explanation = await readFieldExplanation(versionId, fieldPath, actor); await recordAudit({ actor, action: "field_resolution.explanation_read", resourceType: "field_resolution", resourceId: `${versionId}:${fieldPath}`, outcome: "allowed", requestId: requestIdOf(res) }); res.status(200).json(explanation); } catch (error) { next(error); } });
  app.get("/api/workspace/configuracoes-veiculo", requireAuthenticated, async (req: Request, res: Response, next: NextFunction) => { try { res.status(200).json({ configurations: await listOrganizationVehicleWorkspaces(authorizationContext(req)) }); } catch (error) { next(error); } });
  app.get("/api/configuracoes-veiculo/:id/workspace", requireAuthenticated, async (req: Request, res: Response, next: NextFunction) => { try { const workspace = await readVehicleWorkspace(parseCatalogId(req.params.id), authorizationContext(req)); if (!workspace) throw new HttpError(404, "Workspace indisponivel."); res.status(200).json(workspace); } catch (error) { next(error); } });
app.post("/api/configuracoes-veiculo/:id/fichas", requireRole("technical_sheet.denied", "technical_sheet", "analyst", "admin"), async (req: Request, res: Response, next: NextFunction) => { try { const actor = authorizationContext(req); const base = isObject(req.body) && typeof req.body.origin_revision_id === "string" ? parseCatalogId(req.body.origin_revision_id) : undefined; const created = await createWorkspaceSheet(parseCatalogId(req.params.id), actor, base); await recordAudit({ actor, action: "technical_sheet.created", resourceType: "technical_sheet", resourceId: created.id, outcome: "allowed", requestId: requestIdOf(res) }); res.status(201).json(created); } catch (error) { next(error); } });
app.put("/api/technical-sheets/:id/primary", requireRole("technical_sheet.denied", "technical_sheet", "admin"), async (req: Request, res: Response, next: NextFunction) => { try { const actor = authorizationContext(req); const result = await setTechnicalSheetPrimary(parseCatalogId(req.params.id), parseGovernanceReason(req.body, "primary"), actor); await recordAudit({ actor, action: "technical_sheet.primary_set", resourceType: "technical_sheet_primary", resourceId: result.technical_sheet_id, outcome: "allowed", requestId: requestIdOf(res) }); res.status(200).json(result); } catch (error) { next(error); } });
app.delete("/api/technical-sheets/:id/primary", requireRole("technical_sheet.denied", "technical_sheet", "admin"), async (req: Request, res: Response, next: NextFunction) => { try { const actor = authorizationContext(req); const result = await clearTechnicalSheetPrimary(parseCatalogId(req.params.id), actor); await recordAudit({ actor, action: "technical_sheet.primary_cleared", resourceType: "technical_sheet_primary", resourceId: result.technical_sheet_id, outcome: "allowed", requestId: requestIdOf(res) }); res.status(200).json(result); } catch (error) { next(error); } });
app.post("/api/technical-sheets/:id/lifecycle", requireRole("technical_sheet.denied", "technical_sheet", "admin"), async (req: Request, res: Response, next: NextFunction) => { try { const actor = authorizationContext(req); const lifecycle = parseLifecycleInput(req.body); const result = await transitionTechnicalSheetLifecycle(parseCatalogId(req.params.id), lifecycle.state, lifecycle.reason, actor); await recordAudit({ actor, action: "technical_sheet.lifecycle_changed", resourceType: "technical_sheet_lifecycle", resourceId: result.technical_sheet_id, outcome: "allowed", requestId: requestIdOf(res) }); res.status(200).json(result); } catch (error) { next(error); } });
app.post("/api/technical-sheets/:id/tags", requireRole("technical_sheet.denied", "technical_sheet", "admin"), async (req: Request, res: Response, next: NextFunction) => { try { const actor = authorizationContext(req); const tag = parseManualTag(req.body); const result = await setManualTechnicalSheetTag(parseCatalogId(req.params.id), tag, actor); await recordAudit({ actor, action: "technical_sheet.manual_tag_set", resourceType: "technical_sheet_tag", resourceId: `${result.technical_sheet_id}:${result.tag}`, outcome: "allowed", requestId: requestIdOf(res) }); res.status(201).json(result); } catch (error) { next(error); } });
app.delete("/api/technical-sheets/:id/tags/:tag", requireRole("technical_sheet.denied", "technical_sheet", "admin"), async (req: Request, res: Response, next: NextFunction) => { try { const actor = authorizationContext(req); const tag = parseManualTag({ tag: req.params.tag }); const result = await revokeManualTechnicalSheetTag(parseCatalogId(req.params.id), tag, actor); await recordAudit({ actor, action: "technical_sheet.manual_tag_revoked", resourceType: "technical_sheet_tag", resourceId: `${result.technical_sheet_id}:${result.tag}`, outcome: "allowed", requestId: requestIdOf(res) }); res.status(200).json(result); } catch (error) { next(error); } });
app.post("/api/ficha-tecnica/versoes/:id/reportes", requireRole("technical_sheet.denied", "technical_sheet", "analyst", "admin"), async (req: Request, res: Response, next: NextFunction) => { try { if (!isObject(req.body) || typeof req.body.reason !== "string" || !["incorrect","missing","conflicting"].includes(req.body.reason) || typeof req.body.note !== "string" || req.body.note.length < 3 || req.body.note.length > 500) throw new HttpError(400, "Reporte invalido."); res.status(201).json(await createQualityReport({ versionId: parseCatalogId(req.params.id), fieldPath: typeof req.body.field_path === "string" && /^[a-z_]+\.[a-z_]+$/.test(req.body.field_path) ? req.body.field_path : undefined, reason: req.body.reason, note: req.body.note.trim(), actor: authorizationContext(req) })); } catch (error) { next(error); } });
app.post("/api/reportes-qualidade/:id/decisao", requireRole("technical_sheet.denied", "technical_sheet", "admin"), async (req: Request, res: Response, next: NextFunction) => { try { if (!isObject(req.body) || (req.body.state !== "under_review" && req.body.state !== "corrected" && req.body.state !== "not_confirmed") || typeof req.body.note !== "string" || req.body.note.length < 3 || req.body.note.length > 500) throw new HttpError(400, "Decisao invalida."); res.status(200).json(await decideQualityReport(parseCatalogId(req.params.id), req.body.state, req.body.note.trim(), authorizationContext(req))); } catch (error) { next(error); } });

app.get("/api/comparacoes", requireRole("comparison.denied", "saved_comparison", "analyst", "admin"), async (req: Request, res: Response, next: NextFunction) => {
  try { res.status(200).json(await listSavedComparisons(authorizationContext(req))); } catch (error) { next(error); }
});

app.get("/api/comparacoes/:id", requireRole("comparison.denied", "saved_comparison", "analyst", "admin"), async (req: Request, res: Response, next: NextFunction) => {
  try { res.status(200).json(await readSavedComparison(authorizationContext(req), parseCatalogId(req.params.id), requestIdOf(res))); } catch (error) { next(error); }
});

app.get("/api/comparacoes/:id/export", requireRole("comparison.denied", "saved_comparison", "analyst", "admin"), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const format = req.query.format === "csv" || req.query.format === "json" ? req.query.format : null;
    if (!format) throw new HttpError(400, "Formato de exportacao invalido.");
    const item = await readSavedComparison(authorizationContext(req), parseCatalogId(req.params.id), requestIdOf(res));
    const content = format === "json" ? JSON.stringify(item, null, 2) : comparisonCsv(item);
    res.setHeader("Content-Type", format === "json" ? "application/json; charset=utf-8" : "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="comparacao-${item.id}.${format}"`);
    res.setHeader("Cache-Control", "no-store");
    res.status(200).send(content);
  } catch (error) { next(error); }
});

app.get("/api/ficha-tecnica/versoes/:id/export", requireRole("technical_sheet.denied", "technical_sheet", "analyst", "admin"), async (req: Request, res: Response, next: NextFunction) => {
  try { const format = req.query.format === "csv" || req.query.format === "json" ? req.query.format : null; if (!format) throw new HttpError(400, "Formato de exportacao invalido."); const item = await readTechnicalSheetExport(parseCatalogId(req.params.id), authorizationContext(req)); if (!item) throw new HttpError(404, "Ficha indisponivel."); const content = format === "json" ? JSON.stringify(item, null, 2) : technicalSheetCsv(item as any); res.setHeader("Content-Type", format === "json" ? "application/json; charset=utf-8" : "text/csv; charset=utf-8"); res.setHeader("Content-Disposition", `attachment; filename="ficha-${req.params.id}.${format}"`); res.setHeader("Cache-Control", "no-store"); res.status(200).send(content); } catch (error) { next(error); }
});

app.get("/api/catalogo/fichas", requireAuthenticated, async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.status(200).json(await searchCatalog(parseCatalogSearchInput(req.query)));
  } catch (error) {
    next(error);
  }
});

app.get("/api/catalogo/fichas/pesquisa-tecnica", requireAuthenticated, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const policy = await readTechnicalSearchFacetPolicy();
    res.status(200).json(await searchTechnicalCatalog(parseTechnicalCatalogSearchInput(req.query, policy)));
  } catch (error) {
    next(error);
  }
});

app.get("/api/catalogo/fichas/:id", requireAuthenticated, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await readCatalogEntryExact(parseCatalogId(req.params.id), parseVehicleInput(req.query));
    if (result.state !== "found") {
      res.status(200).json(result);
      return;
    }
    const outputSchema = await readOutputSchema();
    res.status(200).json({ ...result, entry: { ...result.entry, response: validateResponse(result.entry.response, outputSchema) } });
  } catch (error) {
    next(error);
  }
});

app.get("/api/catalogo/fichas/:id/recomendacoes", requireAuthenticated, async (req: Request, res: Response, next: NextFunction) => {
  try { res.status(200).json(await readCatalogRecommendations(parseCatalogId(req.params.id), parseVehicleInput(req.query))); } catch (error) { next(error); }
});

app.post("/api/importacoes/dry-run", requireRole("import.denied", "import_run", "analyst", "admin"), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = await prepareImportInput(req.body);
    const actor = authorizationContext(req); const result = await createImportDryRun(input.idempotencyKey, hashImportPayload(req.body.items), input.items, input.outputSchema, actor, requestIdOf(res));
    res.status(200).json(result);
  } catch (error) { next(error); }
});

app.get("/api/importacoes/:id", requireRole("import.denied", "import_run", "analyst", "admin"), async (req: Request, res: Response, next: NextFunction) => {
  try { res.status(200).json(await readImportRun(parseCatalogId(req.params.id), authorizationContext(req))); } catch (error) { next(error); }
});

app.post("/api/importacoes/:id/confirmar", requireRole("import.denied", "import_run", "analyst", "admin"), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const actor = authorizationContext(req); const result = await confirmImportRun(parseCatalogId(req.params.id), await readOutputSchema(), actor, requestIdOf(res));
    await evaluateUsagePolicy(actor).catch(() => undefined);
    res.status(200).json(result);
  } catch (error) { next(error); }
});

app.post("/api/ficha-tecnica", requireRole("technical_sheet.denied", "technical_sheet", "analyst", "admin"), async (req: Request, res: Response, next: NextFunction) => {
  let usageActor: AuthContext | null = null;
  let usageAttempted = false;
  try {
    usageActor = authorizationContext(req);
    const vehicleInput = parseVehicleInput(req.body);

    const [baseAgentPrompt, outputSchema, sourcePolicy, sourceEvidencePolicy, researchCapabilityPolicy, researchDocumentPolicy, sourceTrustBootstrapPolicy, normalizationPolicy, fieldPolicy, qualityPolicy, fieldStatePolicy] = await Promise.all([
      readBaseAgentPrompt(),
      readOutputSchema(),
      readSourcePolicy(),
      readSourceEvidencePolicy(),
      readResearchCapabilityPolicy(),
      readResearchDocumentPolicy(),
      readSourceTrustBootstrapPolicy(),
      readNormalizationPolicy(),
      readFieldPolicy(),
      readQualityPolicy(),
      readFieldStatePolicy()
    ]);
    const vehiclePayload = buildVehiclePayload(vehicleInput);
    const finalPrompt = composeFinalPrompt({
      baseAgentPrompt,
      outputSchema,
      vehiclePayload,
      sourcePolicy,
      sourceEvidencePolicy,
      researchCapabilityPolicy,
      normalizationPolicy,
      fieldPolicy,
      qualityPolicy,
      fieldStatePolicy
    });

    usageAttempted = true;
    const learnedSourceTrustAnchors = await readLearnedSourceTrustAnchors(vehicleInput);
    const llmResult = await callLLM(
      finalPrompt,
      vehicleInput,
      sourceEvidencePolicy,
      researchCapabilityPolicy,
      sourcePolicy,
      researchDocumentPolicy,
      sourceTrustBootstrapPolicy,
      learnedSourceTrustAnchors,
      (candidates) => recordSourceTrustCandidates(vehicleInput, candidates, sourceTrustBootstrapPolicy),
    );
    const llmRawResponse = llmResult.response;
    const requestId = String(res.getHeader("x-request-id") ?? createRequestId());
    const provider = (process.env.LLM_PROVIDER ?? "simulated").toLowerCase();
    const snapshotProvider = provider === "claude" || provider === "openrouter" ? provider : "simulated";
    const validatedResponse = validateResponse(llmRawResponse, outputSchema, {
      vehicle: vehicleInput,
      provider: snapshotProvider,
      sourcePolicy,
      runtimeFirstPartyDomains: llmResult.runtimeFirstPartyDomains,
      normalizationPolicy,
      normalizationFailureMode: "downgrade",
      fieldPolicy,
      qualityPolicy,
      fieldStatePolicy
    });
    try {
      await logValidatedTechnicalSheetResult({
        requestId,
        provider: snapshotProvider,
        result: validatedResponse,
        sourcePolicy,
      });
    } catch (logError) {
      console.warn("Falha ao salvar resumo validado da ficha tecnica:", logError);
    }
    if (getPersistenceMode() === "postgres") {
      await persistTechnicalSheet({ requestId, provider: snapshotProvider, vehicle: vehicleInput, response: validatedResponse, outputSchema, finalPrompt, actor: usageActor, auditAction: "technical_sheet.generated" });
      await evaluateUsagePolicy(usageActor).catch(() => undefined);
    } else {
      void saveLLMResponseSnapshot(requestId, snapshotProvider, vehicleInput, validatedResponse);
    }

    res.status(200).json(validatedResponse);
  } catch (error) {
    if (usageAttempted && usageActor) void recordUsageFailure(usageActor, requestIdOf(res)).catch(() => undefined);
    next(error);
  }
});

app.get("/api/ficha-tecnica/latest", requireAuthenticated, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const outputSchema = await readOutputSchema();
    const latestSnapshot = getPersistenceMode() === "postgres" ? await readLatestTechnicalSheet(authorizationContext(_req)) : await readLatestLLMResponseSnapshot();

    if (!latestSnapshot) {
      res.status(404).json({
        message: "Nenhuma resposta salva para exibir."
      });
      return;
    }

    const validatedResponse = validateResponse(latestSnapshot, outputSchema);
    res.status(200).json(validatedResponse);
  } catch (error) {
    next(error);
  }
});

app.get("/api/ficha-tecnica/history", requireAuthenticated, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const requestedLimit =
      typeof req.query.limit === "string" ? Number.parseInt(req.query.limit, 10) : Number.NaN;
    const limit = Number.isInteger(requestedLimit) && requestedLimit > 0 ? requestedLimit : 2;

    const outputSchema = await readOutputSchema();
    const recentResponses = getPersistenceMode() === "postgres" ? await readTechnicalSheetHistory(limit, authorizationContext(req)) : await readRecentLLMResponses(limit);

    const history: FichaTecnicaHistoryItem[] = recentResponses.map((entry) => {
      try {
        const validated = validateResponse(entry.response, outputSchema);
        return {
          id: entry.id,
          finishedAt: entry.finishedAt,
          provider: entry.provider,
          model: entry.model,
          vehicle: entry.vehicle,
          response: validated,
          isValid: true
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Resposta indisponivel para validacao.";
        return {
          id: entry.id,
          finishedAt: entry.finishedAt,
          provider: entry.provider,
          model: entry.model,
          vehicle: entry.vehicle,
          response: entry.response,
          isValid: false,
          validationError: message
        };
      }
    });

    res.status(200).json(history);
  } catch (error) {
    next(error);
  }
});

app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  const requestIdHeader = res.getHeader("x-request-id");
  const requestId = typeof requestIdHeader === "string" ? requestIdHeader : "unknown";

  if (error instanceof HttpError) {
    if (error instanceof ValidationError) {
      void logValidationFailure(requestId, error.details);
    }
    res.status(error.statusCode).json({
      message: error.message,
      details: error.details ?? null
    });
    return;
  }

  void logServerError(requestId, error);
  res.status(500).json({
    message: "Erro interno no servidor.",
    details: null
  });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
  const provider = (process.env.LLM_PROVIDER ?? "simulated").toLowerCase();
  const effectiveModel =
    provider === "claude"
      ? process.env.CLAUDE_MODEL ?? "claude-sonnet-4-5"
      : provider === "openrouter"
        ? process.env.OPENROUTER_MODEL ?? "google/gemini-2.5-flash"
        : "mock-response";
  console.log(`[startup] LLM_PROVIDER=${provider} | MODEL=${effectiveModel}`);
});

type AuthorizedRequest = Request & { authContext?: AuthContext };

async function requireAuthenticated(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    (req as AuthorizedRequest).authContext = await readAuthenticationContext(readCookie(req, sessionCookieName()));
    next();
  } catch (error) { next(error); }
}

function requireRole(auditAction: AuditAction, resourceType: AuditResourceType, ...allowedRoles: OrganizationRole[]) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      (req as AuthorizedRequest).authContext = await readAuthenticationContext(readCookie(req, sessionCookieName()));
      const context = authorizationContext(req);
      if (!allowedRoles.includes(context.role)) {
        await recordAudit({ actor: context, action: auditAction, resourceType, outcome: "denied", requestId: requestIdOf(_res) });
        throw new HttpError(403, "Acao nao autorizada.");
      }
      next();
    } catch (error) { next(error); }
  };
}

function authorizationContext(req: Request): AuthContext {
  const context = (req as AuthorizedRequest).authContext;
  if (!context) throw new HttpError(401, "Sessao indisponivel.");
  return context;
}

function requestIdOf(res: Response): string {
  const requestId = res.getHeader("x-request-id");
  return typeof requestId === "string" ? requestId : "unknown";
}

function parseVehicleInput(body: unknown): VehicleInput {
  if (!isObject(body)) {
    throw new HttpError(400, "Body da requisicao deve ser um objeto JSON.");
  }

  // Accept both request formats:
  // 1) flat body: { marca, modelo, ... }
  // 2) nested body: { vehicle: { marca, modelo, ... } }
  const payload = isObject(body.vehicle) ? body.vehicle : body;

  const marca = toRequiredText(payload.marca, "marca");
  const modelo = toRequiredText(payload.modelo, "modelo");
  const versao = toRequiredText(payload.versao, "versao");
  const mercado = toRequiredText(payload.mercado, "mercado");
  const ano_modelo = toYear(payload.ano_modelo);

  return {
    marca,
    modelo,
    versao,
    ano_modelo,
    mercado
  };
}

function toRequiredText(value: unknown, fieldName: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new HttpError(400, `Campo ${fieldName} e obrigatorio.`);
  }
  return value.trim();
}

function toYear(value: unknown): number {
  if (typeof value === "number" && Number.isInteger(value)) {
    if (value >= 1900 && value <= 2100) {
      return value;
    }
  }

  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    if (Number.isInteger(parsed) && parsed >= 1900 && parsed <= 2100) {
      return parsed;
    }
  }

  throw new HttpError(400, "Campo ano_modelo deve ser um inteiro entre 1900 e 2100.");
}

function parseCatalogSearchInput(query: Request["query"]): { query: string; page: number; pageSize: number; sort: "recent" | "alphabetical"; scope: "latest" | "all_versions"; brand?: string; model?: string; modelYear?: number; market?: string } {
  const rawQuery = query.q;
  if (rawQuery !== undefined && (typeof rawQuery !== "string" || rawQuery.length > 100 || /[\u0000-\u001f\u007f]/.test(rawQuery))) {
    throw new HttpError(400, "Parametro q invalido.");
  }
  const page = parsePositiveInteger(query.page, "page", 1, 10_000);
  const pageSize = parsePositiveInteger(query.page_size, "page_size", 20, 20);
  const brand = parseOptionalCatalogText(query.marca, "marca");
  const model = parseOptionalCatalogText(query.modelo, "modelo");
  const market = parseOptionalCatalogText(query.mercado, "mercado");
  const modelYear = query.ano_modelo === undefined ? undefined : parsePositiveInteger(query.ano_modelo, "ano_modelo", 1, 2100);
  if (modelYear !== undefined && modelYear < 1900) throw new HttpError(400, "Parametro ano_modelo invalido.");
  const hasCriteria = Boolean((rawQuery?.trim() ?? "") || brand || model || market || modelYear);
  const sort = query.sort === undefined ? (hasCriteria ? "alphabetical" : "recent") : query.sort === "recent" || query.sort === "alphabetical" ? query.sort : null;
  if (!sort) throw new HttpError(400, "Parametro sort invalido.");
  const scope = query.scope === undefined || query.scope === "latest" ? "latest" : query.scope === "all_versions" ? "all_versions" : null;
  if (!scope) throw new HttpError(400, "Parametro scope invalido.");
  return { query: rawQuery?.trim() ?? "", page, pageSize, sort, scope, brand, model, modelYear, market };
}

function parseTechnicalCatalogSearchInput(query: Request["query"], policy: TechnicalSearchFacetPolicy): { tipoCarroceria?: string; motorTipo?: string; potenciaMinCv?: number; potenciaMaxCv?: number; modelYear?: number; market?: string; page: number; pageSize: number } {
  const bodyFacet = policy.facets.find((facet) => facet.key === "tipo_carroceria");
  const motorFacet = policy.facets.find((facet) => facet.key === "motor_tipo");
  if (!bodyFacet || bodyFacet.kind !== "enum" || !motorFacet || motorFacet.kind !== "enum") throw new HttpError(500, "Politica de busca tecnica indisponivel.");
  const tipoCarroceria = parseAllowedTechnicalFacet(query.tipo_carroceria, "tipo_carroceria", bodyFacet.allowed_values);
  const motorTipo = parseAllowedTechnicalFacet(query.motor_tipo, "motor_tipo", motorFacet.allowed_values);
  const potenciaMinCv = parseOptionalTechnicalNumber(query.potencia_min_cv, "potencia_min_cv");
  const potenciaMaxCv = parseOptionalTechnicalNumber(query.potencia_max_cv, "potencia_max_cv");
  if (potenciaMinCv !== undefined && potenciaMaxCv !== undefined && potenciaMinCv > potenciaMaxCv) throw new HttpError(400, "Intervalo de potencia invalido.");
  if (!tipoCarroceria && !motorTipo && potenciaMinCv === undefined && potenciaMaxCv === undefined) throw new HttpError(400, "Informe ao menos uma faceta tecnica.");
  const page = parsePositiveInteger(query.page, "page", 1, 10_000);
  const pageSize = parsePositiveInteger(query.page_size, "page_size", 20, 20);
  const market = parseOptionalCatalogText(query.mercado, "mercado");
  const modelYear = query.ano_modelo === undefined ? undefined : parsePositiveInteger(query.ano_modelo, "ano_modelo", 1, 2100);
  if (modelYear !== undefined && modelYear < 1900) throw new HttpError(400, "Parametro ano_modelo invalido.");
  return { tipoCarroceria, motorTipo, potenciaMinCv, potenciaMaxCv, modelYear, market, page, pageSize };
}

function parseAllowedTechnicalFacet(value: unknown, name: string, allowed: string[]): string | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== "string" || !allowed.includes(value)) throw new HttpError(400, `Parametro ${name} invalido.`);
  return value;
}

function parseOptionalTechnicalNumber(value: unknown, name: string): number | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== "string" || !/^\d+(?:\.\d+)?$/.test(value)) throw new HttpError(400, `Parametro ${name} invalido.`);
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed > 10_000) throw new HttpError(400, `Parametro ${name} invalido.`);
  return parsed;
}
function parseOptionalCatalogText(value: unknown, name: string): string | undefined { if (value === undefined) return undefined; if (typeof value !== "string" || value.length > 100 || /[\u0000-\u001f\u007f]/.test(value)) throw new HttpError(400, `Parametro ${name} invalido.`); const normalized = value.normalize("NFKC").trim().replace(/\s+/g, " "); if (!normalized) return undefined; return normalized; }

function parsePositiveInteger(value: unknown, name: string, fallback: number, max: number): number {
  if (value === undefined) return fallback;
  if (typeof value !== "string" || !/^\d+$/.test(value)) throw new HttpError(400, `Parametro ${name} invalido.`);
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 1 || parsed > max) throw new HttpError(400, `Parametro ${name} invalido.`);
  return parsed;
}

function parseCatalogId(value: string): string {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) {
    throw new HttpError(400, "Identificador de catalogo invalido.");
  }
  return value;
}

function parseOrganizationRequest(body: unknown) {
  if (!isObject(body)) throw new HttpError(400, "Solicitacao invalida.");
  const companyName = requiredBoundedText(body.company_name, 2, 160, "company_name"); const contactName = requiredBoundedText(body.contact_name, 2, 120, "contact_name"); const contactEmail = requiredBoundedText(body.contact_email, 5, 254, "contact_email").toLowerCase(); const privacyNoticeVersion = requiredBoundedText(body.privacy_notice_version, 1, 40, "privacy_notice_version");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) throw new HttpError(400, "Solicitacao invalida.");
  const cnpj = normalizeCnpj(body.cnpj); if (!isValidCnpj(cnpj)) throw new HttpError(400, "Solicitacao invalida.");
  return { companyName, cnpj, contactName, contactEmail, privacyNoticeVersion };
}
function parseOrganizationRegistration(body: unknown) {
  const input = parseOrganizationRequest(body); if (!isObject(body)) throw new HttpError(400, "Cadastro indisponivel.");
  const password = typeof body.password === "string" ? body.password : ""; const passwordConfirmation = typeof body.password_confirmation === "string" ? body.password_confirmation : "";
  if (password.length < 12 || password.length > 128 || /[\u0000-\u001f\u007f]/.test(password) || password !== passwordConfirmation) throw new HttpError(400, "Cadastro indisponivel.");
  return { ...input, password };
}
function requiredBoundedText(value: unknown, min: number, max: number, _field: string): string { if (typeof value !== "string") throw new HttpError(400, "Solicitacao invalida."); const normalized = value.normalize("NFKC").trim().replace(/\s+/g, " "); if (normalized.length < min || normalized.length > max || /[\u0000-\u001f\u007f]/.test(normalized)) throw new HttpError(400, "Solicitacao invalida."); return normalized; }
function parseProtocol(value: string): string { if (!/^ORG-[A-Za-z0-9_-]{20,64}$/.test(value)) throw new HttpError(404, "Solicitacao indisponivel para decisao."); return value; }
function parseInvitationToken(value: string): string { if (!/^INV-[A-Za-z0-9_-]{40,96}$/.test(value)) throw new HttpError(404, "Convite indisponivel."); return value; }
function parseMemberInvitationToken(value: string): string { if (!/^MINV-[A-Za-z0-9_-]{40,96}$/.test(value)) throw new HttpError(404, "Convite indisponivel."); return value; }
function parseInvitationActivation(body: unknown): { displayName: string; password: string } { if (!isObject(body)) throw new HttpError(400, "Ativacao indisponivel."); const displayName = requiredBoundedText(body.display_name, 2, 120, "display_name"); const password = typeof body.password === "string" ? body.password : ""; if (password.length < 12 || password.length > 128 || /[\u0000-\u001f\u007f]/.test(password)) throw new HttpError(400, "Ativacao indisponivel."); return { displayName, password }; }
function parseMemberInvitation(body: unknown): { email: string; role: OrganizationRole } { if (!isObject(body)) throw new HttpError(400, "Convite indisponivel."); const email = requiredBoundedText(body.email, 5, 254, "email").toLowerCase(); if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new HttpError(400, "Convite indisponivel."); return { email, role: parseOrganizationRole(body) }; }
function parseUsagePolicy(body: unknown): { thresholdUnits: number; isActive: boolean } { if (!isObject(body) || typeof body.threshold_units !== "number" || !Number.isSafeInteger(body.threshold_units) || body.threshold_units < 1 || typeof body.is_active !== "boolean") throw new HttpError(400, "Politica de consumo invalida."); return { thresholdUnits: body.threshold_units, isActive: body.is_active }; }
function parseComparisonVersionIds(body: unknown): [string, string] { if (!isObject(body) || !Array.isArray(body.technical_sheet_version_ids) || body.technical_sheet_version_ids.length !== 2 || body.technical_sheet_version_ids.some((id) => typeof id !== "string")) throw new HttpError(400, "Comparacao invalida."); const ids = body.technical_sheet_version_ids.map((id) => parseCatalogId(id)); if (ids[0] === ids[1]) throw new HttpError(400, "Comparacao invalida."); return [ids[0], ids[1]]; }
function parseResearchSessionInput(body: unknown): { idempotencyKey: string; focus: ResearchFocus; category?: string; variables?: string[] } { if (!isObject(body) || typeof body.idempotency_key !== "string" || !/^[A-Za-z0-9._:-]{16,128}$/.test(body.idempotency_key) || typeof body.focus !== "string" || !researchFocuses.includes(body.focus as ResearchFocus)) throw new HttpError(400, "Sessao de pesquisa invalida."); const category = typeof body.category === "string" && /^[a-z_]{1,80}$/.test(body.category) ? body.category : undefined; const variables = Array.isArray(body.variables) && body.variables.length <= 100 && body.variables.every((item) => typeof item === "string" && /^[a-z_]+\.[a-z_]+$/.test(item)) ? body.variables : undefined; if ((body.category !== undefined && !category) || (body.variables !== undefined && !variables) || (body.focus === "CATEGORY" && !category) || (body.focus === "VARIABLES" && !variables)) throw new HttpError(400, "Sessao de pesquisa invalida."); return { idempotencyKey: body.idempotency_key, focus: body.focus as ResearchFocus, category, variables }; }
function parseFieldPath(value: unknown): string { if (typeof value !== "string" || !/^[a-z_]+\.[a-z_]+$/.test(value)) throw new HttpError(400, "Variavel invalida."); return value; }
function parseGovernanceReason(body: unknown, kind: "primary"): string { if (!isObject(body) || typeof body.reason !== "string" || !["organization_reference", "reviewed_selection", "restore_previous_reference"].includes(body.reason)) throw new HttpError(400, "Motivo de governanca invalido."); return body.reason; }
function parseLifecycleInput(body: unknown): { state: string; reason: string } { if (!isObject(body) || typeof body.state !== "string" || typeof body.reason !== "string" || !["active", "stale", "archived"].includes(body.state) || !["manual_review", "freshness_policy", "superseded_by_review", "reactivated_after_review"].includes(body.reason)) throw new HttpError(400, "Transicao de ciclo de vida invalida."); return { state: body.state, reason: body.reason }; }
function parseManualTag(body: unknown): string { if (!isObject(body) || typeof body.tag !== "string" || !["needs_review", "pinned_for_review"].includes(body.tag)) throw new HttpError(400, "Tag manual invalida."); return body.tag; }
function comparisonCsv(item: Awaited<ReturnType<typeof readSavedComparison>>): string { const safe = (value: unknown) => { const text = value === null || value === undefined ? "" : String(value); const neutralized = /^[=+\-@]/.test(text) ? `'${text}` : text; return `"${neutralized.replace(/"/g, '""')}"`; }; const rows = [["comparacao_id", "campo", "esquerda", "direita", "diferenca"], ...item.comparison.fields.map((field) => [item.id, field.label, field.left?.value, field.right?.value, field.difference])]; return rows.map((row) => row.map(safe).join(",")).join("\r\n"); }
function technicalSheetCsv(item: any): string { const safe = (value: unknown) => { const text = value == null ? "" : String(value); const neutralized = /^[=+\-@]/.test(text) ? `'${text}` : text; return `"${neutralized.replace(/"/g, '""')}"`; }; const rows: unknown[][] = [["version_id", "version_number", "marca", "modelo", "versao", "ano_modelo", "mercado", "path", "valor"]]; const visit = (value: any, path = "") => { if (value && typeof value === "object" && !Array.isArray(value) && !("valor" in value)) Object.entries(value).forEach(([key, nested]) => visit(nested, path ? `${path}.${key}` : key)); else rows.push([item.technical_sheet.version_id, item.technical_sheet.version_number, item.technical_sheet.vehicle.marca, item.technical_sheet.vehicle.modelo, item.technical_sheet.vehicle.versao, item.technical_sheet.vehicle.ano_modelo, item.technical_sheet.vehicle.mercado, path, JSON.stringify(value)]); }; visit(item.technical_sheet.data); return rows.map((row) => row.map(safe).join(",")).join("\r\n"); }
function parseOrganizationRole(body: unknown): OrganizationRole { if (!isObject(body) || (body.role !== "viewer" && body.role !== "analyst" && body.role !== "admin")) throw new HttpError(400, "Papel indisponivel."); return body.role; }
function sanitizeRequestPath(value: string): string { return value.replace(/(\/api\/convites\/)[^/?]+(\/ativar(?:\?.*)?$)/, "$1[redacted]$2").replace(/(\/api\/organizacoes\/solicitacoes\/)[^/?]+(\/decisao(?:\?.*)?$)/, "$1[redacted]$2").replace(/(\/api\/convites\/membros\/)[^/?]+(\/ativar(?:\?.*)?$)/, "$1[redacted]$2"); }
function parseLogin(body: unknown): { email: string; password: string } { if (!isObject(body)) throw new HttpError(400, "Credenciais invalidas."); const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : ""; const password = typeof body.password === "string" ? body.password : ""; if (email.length < 5 || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 1 || password.length > 128 || /[\u0000-\u001f\u007f]/.test(password)) throw new HttpError(400, "Credenciais invalidas."); return { email, password }; }
function parsePositiveQuery(value: unknown, fallback: number, max: number): number { if (value === undefined) return fallback; if (typeof value !== "string" || !/^\d+$/.test(value)) throw new HttpError(400, "Consulta invalida."); const parsed = Number(value); if (!Number.isSafeInteger(parsed) || parsed < 1 || parsed > max) throw new HttpError(400, "Consulta invalida."); return parsed; }
function readCookie(req: Request, name: string): string | undefined { const raw = req.header("cookie"); if (!raw) return undefined; const prefix = `${name}=`; for (const part of raw.split(";")) { const item = part.trim(); if (item.startsWith(prefix)) return item.slice(prefix.length); } return undefined; }

async function prepareImportInput(body: unknown): Promise<{ idempotencyKey: string; items: PreparedImportItem[]; outputSchema: Record<string, unknown> }> {
  if (!isObject(body) || typeof body.idempotency_key !== "string" || !/^[A-Za-z0-9._:-]{16,128}$/.test(body.idempotency_key)) throw new HttpError(400, "Chave de idempotencia invalida.");
  if (!Array.isArray(body.items) || body.items.length < 1 || body.items.length > 10) throw new HttpError(400, "Lote deve conter entre 1 e 10 itens.");
  const [outputSchema, sourcePolicy, normalizationPolicy, fieldPolicy, qualityPolicy, fieldStatePolicy] = await Promise.all([readOutputSchema(), readSourcePolicy(), readNormalizationPolicy(), readFieldPolicy(), readQualityPolicy(), readFieldStatePolicy()]);
  const items = body.items.map((item, index) => {
    if (!isObject(item)) throw new HttpError(422, "Item de importacao invalido.", { index, code: "item_not_object" });
    const vehicle = parseVehicleInput(item.vehicle);
    const provider: PreparedImportItem["provider"] | null = item.provider === "openrouter" || item.provider === "claude" ? item.provider : item.provider === undefined || item.provider === "simulated" ? "simulated" : null;
    if (!provider) throw new HttpError(422, "Provider de importacao invalido.", { index, code: "provider_invalid" });
    const response = validateResponse(item.response, outputSchema, { vehicle, provider, sourcePolicy, normalizationPolicy, fieldPolicy, qualityPolicy, fieldStatePolicy });
    return { vehicle, provider, response, payloadSha256: hashImportPayload(response) };
  });
  return { idempotencyKey: body.idempotency_key, items, outputSchema };
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
