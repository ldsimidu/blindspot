import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { getDatabase } from "./db/client";
import { organizationRequestEvents, organizationRequests, organizations } from "./db/schema";
import { HttpError } from "./types";

export interface OrganizationRequestInput { companyName: string; cnpj: string; contactName: string; contactEmail: string; privacyNoticeVersion: string; }

export async function submitOrganizationRequest(input: OrganizationRequestInput): Promise<{ protocol: string; state: "received" }> {
  const db = requireDb(); const protocol = `ORG-${randomBytes(18).toString("base64url")}`;
  const cnpjHash = secretHash("cnpj", input.cnpj); const emailHash = secretHash("email", input.contactEmail.toLowerCase());
  const [existing] = await db.select({ id: organizationRequests.id }).from(organizationRequests).where(and(eq(organizationRequests.cnpjHash, cnpjHash), eq(organizationRequests.emailHash, emailHash))).limit(1);
  if (existing) return { protocol: `ORG-${randomBytes(18).toString("base64url")}`, state: "received" };
  const [request] = await db.insert(organizationRequests).values({ protocolHash: secretHash("protocol", protocol), companyName: input.companyName, cnpjHash, contactName: input.contactName, contactEmail: input.contactEmail, emailHash, privacyNoticeVersion: input.privacyNoticeVersion, status: "received" }).returning();
  await db.insert(organizationRequestEvents).values({ organizationRequestId: request.id, eventType: "received", actorKind: "requester" });
  return { protocol, state: "received" };
}

export async function decideOrganizationRequest(protocol: string, decision: "approved" | "rejected", key: string): Promise<{ state: "approved" | "rejected" }> {
  assertOperatorKey(key); const db = requireDb(); const [request] = await db.select().from(organizationRequests).where(eq(organizationRequests.protocolHash, secretHash("protocol", protocol))).limit(1);
  if (!request || request.status !== "received") throw new HttpError(404, "Solicitacao indisponivel para decisao.");
  await db.transaction(async (tx) => {
    let organizationId: string | null = null;
    if (decision === "approved") { const [organization] = await tx.insert(organizations).values({ displayName: request.companyName, cnpjHash: request.cnpjHash, status: "pending_activation" }).onConflictDoNothing().returning(); organizationId = organization?.id ?? null; if (!organizationId) throw new HttpError(409, "Solicitacao indisponivel para decisao."); }
    await tx.update(organizationRequests).set({ status: decision, decidedAt: new Date(), decisionCode: decision === "approved" ? "approved" : "rejected", decidedBy: "temporary_operator", organizationId }).where(eq(organizationRequests.id, request.id));
    await tx.insert(organizationRequestEvents).values({ organizationRequestId: request.id, eventType: decision, actorKind: "temporary_operator", actorId: "temporary_operator", decisionCode: decision });
  });
  return { state: decision };
}

function requireDb() { const db = getDatabase(); if (!db) throw new HttpError(503, "Solicitacoes requerem persistencia PostgreSQL ativa."); return db; }
function secretHash(scope: string, value: string): string { const key = process.env.ORGANIZATION_HASH_KEY; if (!key || key.length < 32) throw new HttpError(503, "Solicitacoes indisponiveis."); return createHmac("sha256", key).update(`${scope}:${value}`).digest("hex"); }
function assertOperatorKey(value: string) { const expected = process.env.OPERATOR_APPROVAL_KEY; if (!expected || expected.length < 32) throw new HttpError(503, "Revisao indisponivel."); const actualBuffer = Buffer.from(value); const expectedBuffer = Buffer.from(expected); if (actualBuffer.length !== expectedBuffer.length || !timingSafeEqual(actualBuffer, expectedBuffer)) throw new HttpError(404, "Solicitacao indisponivel para decisao."); }
