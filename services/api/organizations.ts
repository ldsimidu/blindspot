import { createHmac, randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { getDatabase } from "./db/client";
import { organizationInvitationEvents, organizationInvitations, organizationMembers, organizationRequestEvents, organizationRequests, organizations, passwordCredentials } from "./db/schema";
import { HttpError } from "./types";

const invitationTtlMs = 72 * 60 * 60 * 1000;
const passwordAlgorithm = "scrypt-v1:N=16384,r=8,p=1,dkLen=64";

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

export async function issueInitialAdminInvitation(protocol: string, key: string): Promise<{ invitationId: string; token: string; expiresAt: string; state: "issued" }> {
  assertOperatorKey(key); const db = requireDb();
  const [request] = await db.select().from(organizationRequests).where(eq(organizationRequests.protocolHash, secretHash("protocol", protocol))).limit(1);
  if (!request || request.status !== "approved" || !request.organizationId) throw new HttpError(404, "Solicitacao indisponivel para convite.");
  const [organization] = await db.select().from(organizations).where(eq(organizations.id, request.organizationId)).limit(1);
  if (!organization || organization.status !== "pending_activation") throw new HttpError(404, "Solicitacao indisponivel para convite.");
  const token = `INV-${randomBytes(32).toString("base64url")}`; const expiresAt = new Date(Date.now() + invitationTtlMs);
  const invitationId = await db.transaction(async (tx) => {
    const revoked = await tx.update(organizationInvitations).set({ status: "revoked", revokedAt: new Date() }).where(and(eq(organizationInvitations.organizationId, organization.id), eq(organizationInvitations.status, "issued"))).returning({ id: organizationInvitations.id });
    if (revoked.length > 0) await tx.insert(organizationInvitationEvents).values(revoked.map((item) => ({ organizationInvitationId: item.id, eventType: "revoked_reissued", actorKind: "temporary_operator" })));
    const [invitation] = await tx.insert(organizationInvitations).values({ organizationId: organization.id, organizationRequestId: request.id, contactEmail: request.contactEmail, emailHash: request.emailHash, tokenHash: invitationHash(token), status: "issued", expiresAt }).returning({ id: organizationInvitations.id });
    await tx.insert(organizationInvitationEvents).values({ organizationInvitationId: invitation.id, eventType: "issued", actorKind: "temporary_operator" });
    return invitation.id;
  });
  return { invitationId, token, expiresAt: expiresAt.toISOString(), state: "issued" };
}

export async function revokeInitialAdminInvitation(invitationId: string, key: string): Promise<{ state: "revoked" }> {
  assertOperatorKey(key); const db = requireDb();
  return db.transaction(async (tx) => {
    const [invitation] = await tx.update(organizationInvitations).set({ status: "revoked", revokedAt: new Date() }).where(and(eq(organizationInvitations.id, invitationId), eq(organizationInvitations.status, "issued"))).returning({ id: organizationInvitations.id });
    if (!invitation) throw new HttpError(404, "Convite indisponivel.");
    await tx.insert(organizationInvitationEvents).values({ organizationInvitationId: invitation.id, eventType: "revoked", actorKind: "temporary_operator" });
    return { state: "revoked" as const };
  });
}

export async function activateInitialAdmin(token: string, displayName: string, password: string): Promise<{ state: "activated" }> {
  assertPassword(password); const db = requireDb(); const tokenHash = invitationHash(token);
  await db.transaction(async (tx) => {
    const [invitation] = await tx.select().from(organizationInvitations).where(eq(organizationInvitations.tokenHash, tokenHash)).limit(1);
    if (!invitation || invitation.status !== "issued" || invitation.expiresAt.getTime() <= Date.now()) throw unavailableInvitation();
    const [organization] = await tx.select().from(organizations).where(and(eq(organizations.id, invitation.organizationId), eq(organizations.status, "pending_activation"))).limit(1);
    if (!organization) throw unavailableInvitation();
    const passwordSalt = randomBytes(16).toString("base64url"); const passwordHash = await derivePassword(password, passwordSalt);
    const [consumed] = await tx.update(organizationInvitations).set({ status: "used", usedAt: new Date() }).where(and(eq(organizationInvitations.id, invitation.id), eq(organizationInvitations.status, "issued"))).returning({ id: organizationInvitations.id });
    if (!consumed) throw unavailableInvitation();
    const [member] = await tx.insert(organizationMembers).values({ organizationId: organization.id, email: invitation.contactEmail, emailHash: invitation.emailHash, displayName, role: "admin", status: "active" }).returning({ id: organizationMembers.id });
    await tx.insert(passwordCredentials).values({ memberId: member.id, passwordHash, passwordSalt, algorithm: passwordAlgorithm });
    const [activated] = await tx.update(organizations).set({ status: "active" }).where(and(eq(organizations.id, organization.id), eq(organizations.status, "pending_activation"))).returning({ id: organizations.id });
    if (!activated) throw unavailableInvitation();
    await tx.insert(organizationInvitationEvents).values({ organizationInvitationId: invitation.id, eventType: "used", actorKind: "invitee" });
  });
  return { state: "activated" };
}

function requireDb() { const db = getDatabase(); if (!db) throw new HttpError(503, "Solicitacoes requerem persistencia PostgreSQL ativa."); return db; }
function secretHash(scope: string, value: string): string { return keyedHash("ORGANIZATION_HASH_KEY", scope, value, "Solicitacoes indisponiveis."); }
function invitationHash(token: string): string { return keyedHash("INVITATION_TOKEN_HASH_KEY", "invitation", token, "Convite indisponivel."); }
function keyedHash(environmentKey: string, scope: string, value: string, message: string): string { const key = process.env[environmentKey]; if (!key || key.length < 32) throw new HttpError(503, message); return createHmac("sha256", key).update(`${scope}:${value}`).digest("hex"); }
function assertOperatorKey(value: string) { const expected = process.env.OPERATOR_APPROVAL_KEY; if (!expected || expected.length < 32) throw new HttpError(503, "Revisao indisponivel."); const actualBuffer = Buffer.from(value); const expectedBuffer = Buffer.from(expected); if (actualBuffer.length !== expectedBuffer.length || !timingSafeEqual(actualBuffer, expectedBuffer)) throw new HttpError(404, "Solicitacao indisponivel para decisao."); }
function assertPassword(password: string) { if (password.length < 12 || password.length > 128) throw new HttpError(400, "Ativacao indisponivel."); }
async function derivePassword(password: string, salt: string): Promise<string> { const pepper = process.env.PASSWORD_PEPPER; if (!pepper || pepper.length < 32) throw new HttpError(503, "Ativacao indisponivel."); const output = await new Promise<Buffer>((resolve, reject) => scrypt(`${password}\u0000${pepper}`, salt, 64, { N: 16_384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 }, (error, derivedKey) => error ? reject(error) : resolve(derivedKey))); return output.toString("base64url"); }
function unavailableInvitation(): HttpError { return new HttpError(404, "Convite indisponivel."); }
