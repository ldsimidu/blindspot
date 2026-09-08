import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { getDatabase } from "./db/client";
import { accounts, organizationInvitationEvents, organizationInvitations, organizationMembers, organizationRequestEvents, organizationRequests, organizations, passwordCredentials } from "./db/schema";
import { assertPassword, derivePassword, passwordAlgorithm } from "./credentials";
import { HttpError } from "./types";

const invitationTtlMs = 72 * 60 * 60 * 1000;
export interface OrganizationRequestInput { companyName: string; cnpj: string; contactName: string; contactEmail: string; privacyNoticeVersion: string; }
export interface OrganizationRegistrationInput extends OrganizationRequestInput { password: string; }

/** Legacy technical request. New registrations use registerOrganization. */
export async function submitOrganizationRequest(input: OrganizationRequestInput): Promise<{ protocol: string; state: "received" }> {
  const db = requireDb(); const protocol = newProtocol(); const cnpjHash = secretHash("cnpj", input.cnpj); const emailHash = secretHash("email", input.contactEmail.toLowerCase());
  const [existing] = await db.select({ id: organizationRequests.id }).from(organizationRequests).where(and(eq(organizationRequests.cnpjHash, cnpjHash), eq(organizationRequests.emailHash, emailHash))).limit(1);
  if (existing) return neutralReceived();
  const [request] = await db.insert(organizationRequests).values({ protocolHash: secretHash("protocol", protocol), companyName: input.companyName, cnpjHash, contactName: input.contactName, contactEmail: input.contactEmail, emailHash, privacyNoticeVersion: input.privacyNoticeVersion, status: "received" }).returning();
  await db.insert(organizationRequestEvents).values({ organizationRequestId: request.id, eventType: "received", actorKind: "requester" }); return { protocol, state: "received" };
}

/** Creates organization, account, initial member and password credential in one pending transaction. */
export async function registerOrganization(input: OrganizationRegistrationInput): Promise<{ state: "received" }> {
  assertPassword(input.password); const db = requireDb(); const normalizedEmail = input.contactEmail.toLowerCase(); const cnpjHash = secretHash("cnpj", input.cnpj); const emailHash = secretHash("email", normalizedEmail); const protocol = newProtocol(); const passwordSalt = randomBytes(16).toString("base64url"); const passwordHash = await derivePassword(input.password, passwordSalt);
  try {
    await db.transaction(async (tx) => {
      const [requestByIdentity] = await tx.select({ id: organizationRequests.id }).from(organizationRequests).where(and(eq(organizationRequests.cnpjHash, cnpjHash), eq(organizationRequests.emailHash, emailHash))).limit(1);
      const [organizationByCnpj] = await tx.select({ id: organizations.id }).from(organizations).where(eq(organizations.cnpjHash, cnpjHash)).limit(1);
      const [accountByEmail] = await tx.select({ id: accounts.id }).from(accounts).where(eq(accounts.email, normalizedEmail)).limit(1);
      if (requestByIdentity || organizationByCnpj || accountByEmail) return;
      const [organization] = await tx.insert(organizations).values({ displayName: input.companyName, cnpjHash, status: "pending_review" }).returning({ id: organizations.id });
      const [account] = await tx.insert(accounts).values({ email: normalizedEmail, status: "pending" }).returning({ id: accounts.id });
      const [member] = await tx.insert(organizationMembers).values({ organizationId: organization.id, accountId: account.id, email: normalizedEmail, emailHash, displayName: input.contactName, role: "admin", status: "pending" }).returning({ id: organizationMembers.id });
      await tx.insert(passwordCredentials).values({ memberId: member.id, passwordHash, passwordSalt, algorithm: passwordAlgorithm });
      const [request] = await tx.insert(organizationRequests).values({ protocolHash: secretHash("protocol", protocol), operatorReference: protocol, companyName: input.companyName, cnpjHash, contactName: input.contactName, contactEmail: normalizedEmail, emailHash, privacyNoticeVersion: input.privacyNoticeVersion, status: "received", organizationId: organization.id, accountId: account.id, initialMemberId: member.id }).returning({ id: organizationRequests.id });
      await tx.insert(organizationRequestEvents).values({ organizationRequestId: request.id, eventType: "received", actorKind: "requester" });
    });
  } catch (error) { if (isUniqueViolation(error)) return { state: "received" }; throw error; }
  return { state: "received" };
}

export async function listPendingOrganizationRequests(key: string, page: number, pageSize: number): Promise<{ state: "received"; page: number; page_size: number; total: number; requests: Array<{ protocol: string; company_name: string; contact_name: string; contact_email: string; created_at: string; state: "received" }> }> {
  assertOperatorKey(key); const db = requireDb(); const pending = (await db.select().from(organizationRequests).where(eq(organizationRequests.status, "received"))).filter((request) => request.operatorReference !== null); const start = (page - 1) * pageSize;
  return { state: "received", page, page_size: pageSize, total: pending.length, requests: pending.slice(start, start + pageSize).map((request) => ({ protocol: request.operatorReference as string, company_name: request.companyName, contact_name: request.contactName, contact_email: request.contactEmail, created_at: request.createdAt.toISOString(), state: "received" })) };
}

export async function decideOrganizationRequest(protocol: string, decision: "approved" | "rejected", key: string): Promise<{ state: "approved" | "rejected" }> {
  assertOperatorKey(key); const db = requireDb(); return db.transaction(async (tx) => {
    const [request] = await tx.select().from(organizationRequests).where(eq(organizationRequests.protocolHash, secretHash("protocol", protocol))).limit(1);
    if (!request || request.status !== "received") throw unavailableDecision();
    if (request.organizationId && request.accountId && request.initialMemberId) {
      const targetStatus = decision === "approved" ? "active" : "rejected";
      const [organization] = await tx.update(organizations).set({ status: targetStatus }).where(and(eq(organizations.id, request.organizationId), eq(organizations.status, "pending_review"))).returning({ id: organizations.id });
      const [account] = await tx.update(accounts).set({ status: targetStatus }).where(and(eq(accounts.id, request.accountId), eq(accounts.status, "pending"))).returning({ id: accounts.id });
      const [member] = await tx.update(organizationMembers).set({ status: targetStatus }).where(and(eq(organizationMembers.id, request.initialMemberId), eq(organizationMembers.status, "pending"))).returning({ id: organizationMembers.id });
      if (!organization || !account || !member) throw unavailableDecision();
    } else if (decision === "approved") {
      const [organization] = await tx.insert(organizations).values({ displayName: request.companyName, cnpjHash: request.cnpjHash, status: "pending_activation" }).onConflictDoNothing().returning({ id: organizations.id }); if (!organization) throw unavailableDecision(); await tx.update(organizationRequests).set({ organizationId: organization.id }).where(eq(organizationRequests.id, request.id));
    }
    const [decided] = await tx.update(organizationRequests).set({ status: decision, decidedAt: new Date(), decisionCode: decision, decidedBy: "temporary_operator" }).where(and(eq(organizationRequests.id, request.id), eq(organizationRequests.status, "received"))).returning({ id: organizationRequests.id }); if (!decided) throw unavailableDecision();
    await tx.insert(organizationRequestEvents).values({ organizationRequestId: request.id, eventType: decision, actorKind: "temporary_operator", actorId: "temporary_operator", decisionCode: decision }); return { state: decision };
  });
}

export async function issueInitialAdminInvitation(protocol: string, key: string): Promise<{ invitationId: string; token: string; expiresAt: string; state: "issued" }> {
  assertOperatorKey(key); const db = requireDb(); const [request] = await db.select().from(organizationRequests).where(eq(organizationRequests.protocolHash, secretHash("protocol", protocol))).limit(1);
  if (!request || request.status !== "approved" || !request.organizationId || request.accountId) throw new HttpError(404, "Solicitacao indisponivel para convite."); const [organization] = await db.select().from(organizations).where(eq(organizations.id, request.organizationId)).limit(1); if (!organization || organization.status !== "pending_activation") throw new HttpError(404, "Solicitacao indisponivel para convite.");
  const token = `INV-${randomBytes(32).toString("base64url")}`; const expiresAt = new Date(Date.now() + invitationTtlMs); const invitationId = await db.transaction(async (tx) => { const revoked = await tx.update(organizationInvitations).set({ status: "revoked", revokedAt: new Date() }).where(and(eq(organizationInvitations.organizationId, organization.id), eq(organizationInvitations.status, "issued"))).returning({ id: organizationInvitations.id }); if (revoked.length > 0) await tx.insert(organizationInvitationEvents).values(revoked.map((item) => ({ organizationInvitationId: item.id, eventType: "revoked_reissued", actorKind: "temporary_operator" }))); const [invitation] = await tx.insert(organizationInvitations).values({ organizationId: organization.id, organizationRequestId: request.id, contactEmail: request.contactEmail, emailHash: request.emailHash, tokenHash: invitationHash(token), status: "issued", expiresAt }).returning({ id: organizationInvitations.id }); await tx.insert(organizationInvitationEvents).values({ organizationInvitationId: invitation.id, eventType: "issued", actorKind: "temporary_operator" }); return invitation.id; });
  return { invitationId, token, expiresAt: expiresAt.toISOString(), state: "issued" };
}

export async function revokeInitialAdminInvitation(invitationId: string, key: string): Promise<{ state: "revoked" }> { assertOperatorKey(key); const db = requireDb(); return db.transaction(async (tx) => { const [invitation] = await tx.update(organizationInvitations).set({ status: "revoked", revokedAt: new Date() }).where(and(eq(organizationInvitations.id, invitationId), eq(organizationInvitations.status, "issued"))).returning({ id: organizationInvitations.id }); if (!invitation) throw new HttpError(404, "Convite indisponivel."); await tx.insert(organizationInvitationEvents).values({ organizationInvitationId: invitation.id, eventType: "revoked", actorKind: "temporary_operator" }); return { state: "revoked" as const }; }); }

export async function activateInitialAdmin(token: string, displayName: string, password: string): Promise<{ state: "activated" }> { assertPassword(password); const db = requireDb(); const tokenHash = invitationHash(token); await db.transaction(async (tx) => { const [invitation] = await tx.select().from(organizationInvitations).where(eq(organizationInvitations.tokenHash, tokenHash)).limit(1); if (!invitation || invitation.status !== "issued" || invitation.expiresAt.getTime() <= Date.now()) throw unavailableInvitation(); const [organization] = await tx.select().from(organizations).where(and(eq(organizations.id, invitation.organizationId), eq(organizations.status, "pending_activation"))).limit(1); if (!organization) throw unavailableInvitation(); const passwordSalt = randomBytes(16).toString("base64url"); const passwordHash = await derivePassword(password, passwordSalt); const [consumed] = await tx.update(organizationInvitations).set({ status: "used", usedAt: new Date() }).where(and(eq(organizationInvitations.id, invitation.id), eq(organizationInvitations.status, "issued"))).returning({ id: organizationInvitations.id }); if (!consumed) throw unavailableInvitation(); const normalizedEmail = invitation.contactEmail.toLowerCase(); const [createdAccount] = await tx.insert(accounts).values({ email: normalizedEmail, status: "active" }).onConflictDoNothing().returning({ id: accounts.id }); const accountId = createdAccount?.id ?? (await tx.select({ id: accounts.id }).from(accounts).where(eq(accounts.email, normalizedEmail)).limit(1))[0]?.id; if (!accountId) throw new HttpError(503, "Ativacao indisponivel."); const [member] = await tx.insert(organizationMembers).values({ organizationId: organization.id, accountId, email: normalizedEmail, emailHash: invitation.emailHash, displayName, role: "admin", status: "active" }).returning({ id: organizationMembers.id }); await tx.insert(passwordCredentials).values({ memberId: member.id, passwordHash, passwordSalt, algorithm: passwordAlgorithm }); const [activated] = await tx.update(organizations).set({ status: "active" }).where(and(eq(organizations.id, organization.id), eq(organizations.status, "pending_activation"))).returning({ id: organizations.id }); if (!activated) throw unavailableInvitation(); await tx.insert(organizationInvitationEvents).values({ organizationInvitationId: invitation.id, eventType: "used", actorKind: "invitee" }); }); return { state: "activated" }; }

function requireDb() { const db = getDatabase(); if (!db) throw new HttpError(503, "Solicitacoes requerem persistencia PostgreSQL ativa."); return db; }
function newProtocol(): string { return `ORG-${randomBytes(18).toString("base64url")}`; }
function neutralReceived(): { protocol: string; state: "received" } { return { protocol: newProtocol(), state: "received" }; }
function secretHash(scope: string, value: string): string { return keyedHash("ORGANIZATION_HASH_KEY", scope, value, "Solicitacoes indisponiveis."); }
function invitationHash(token: string): string { return keyedHash("INVITATION_TOKEN_HASH_KEY", "invitation", token, "Convite indisponivel."); }
function keyedHash(environmentKey: string, scope: string, value: string, message: string): string { const key = process.env[environmentKey]; if (!key || key.length < 32) throw new HttpError(503, message); return createHmac("sha256", key).update(`${scope}:${value}`).digest("hex"); }
function assertOperatorKey(value: string) { const expected = process.env.OPERATOR_APPROVAL_KEY; if (!expected || expected.length < 32) throw new HttpError(503, "Revisao indisponivel."); const actualBuffer = Buffer.from(value); const expectedBuffer = Buffer.from(expected); if (actualBuffer.length !== expectedBuffer.length || !timingSafeEqual(actualBuffer, expectedBuffer)) throw unavailableDecision(); }
function unavailableDecision(): HttpError { return new HttpError(404, "Solicitacao indisponivel para decisao."); }
function unavailableInvitation(): HttpError { return new HttpError(404, "Convite indisponivel."); }
function isUniqueViolation(error: unknown): boolean { return typeof error === "object" && error !== null && "code" in error && (error as { code?: string }).code === "23505"; }
