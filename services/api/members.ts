import { createHmac, randomBytes } from "node:crypto";
import { and, eq, isNull } from "drizzle-orm";
import { getDatabase } from "./db/client";
import { accounts, auditEvents, authSessions, organizationMemberInvitations, organizationMembers, passwordCredentials } from "./db/schema";
import { assertPassword, derivePassword, passwordAlgorithm } from "./credentials";
import type { AuthContext, OrganizationRole } from "./authentication";
import { HttpError } from "./types";

const invitationTtlMs = 72 * 60 * 60 * 1000;
type InvitationRole = OrganizationRole;

export interface MemberSummary { id: string; display_name: string; email: string; role: OrganizationRole; state: "active" | "inactive"; created_at: string; }
export interface InvitationSummary { id: string; email: string; role: OrganizationRole; state: "issued" | "revoked" | "used" | "expired"; expires_at: string; created_at: string; }

export async function listOrganizationPeople(actor: AuthContext): Promise<{ members: MemberSummary[]; invitations: InvitationSummary[] }> {
  const db = requireDb();
  const [members, invitations] = await Promise.all([
    db.select().from(organizationMembers).where(eq(organizationMembers.organizationId, actor.organizationId)),
    db.select().from(organizationMemberInvitations).where(eq(organizationMemberInvitations.organizationId, actor.organizationId))
  ]);
  const now = Date.now();
  return {
    members: members.map((member) => ({ id: member.id, display_name: member.displayName, email: member.email, role: roleOf(member.role), state: member.status === "active" ? "active" : "inactive", created_at: member.createdAt.toISOString() })),
    invitations: invitations.map((invitation) => ({ id: invitation.id, email: invitation.contactEmail, role: roleOf(invitation.role), state: invitation.status === "issued" && invitation.expiresAt.getTime() <= now ? "expired" : invitation.status as "issued" | "revoked" | "used", expires_at: invitation.expiresAt.toISOString(), created_at: invitation.createdAt.toISOString() }))
  };
}

export async function inviteOrganizationMember(actor: AuthContext, email: string, role: InvitationRole, requestId: string): Promise<{ invitation_id: string; activation_path: string; expires_at: string; state: "issued" }> {
  const db = requireDb(); const normalizedEmail = email.toLowerCase(); const emailHash = secretHash("email", normalizedEmail); const token = `MINV-${randomBytes(32).toString("base64url")}`; const expiresAt = new Date(Date.now() + invitationTtlMs);
  return db.transaction(async (tx) => {
    const [existingAccount] = await tx.select().from(accounts).where(eq(accounts.email, normalizedEmail)).limit(1);
    let accountId: string; let memberId: string;
    if (existingAccount) {
      const [pendingMember] = await tx.select().from(organizationMembers).where(and(eq(organizationMembers.accountId, existingAccount.id), eq(organizationMembers.organizationId, actor.organizationId), eq(organizationMembers.status, "pending"))).limit(1);
      if (!pendingMember || existingAccount.status !== "pending") throw new HttpError(409, "E-mail indisponivel para convite.");
      accountId = existingAccount.id; memberId = pendingMember.id;
      await tx.update(organizationMembers).set({ role }).where(eq(organizationMembers.id, memberId));
      await tx.update(organizationMemberInvitations).set({ status: "revoked", revokedAt: new Date() }).where(and(eq(organizationMemberInvitations.memberId, memberId), eq(organizationMemberInvitations.status, "issued")));
    } else {
      const [account] = await tx.insert(accounts).values({ email: normalizedEmail, status: "pending" }).returning({ id: accounts.id });
      const [member] = await tx.insert(organizationMembers).values({ organizationId: actor.organizationId, accountId: account.id, email: normalizedEmail, emailHash, displayName: "Convite pendente", role, status: "pending" }).returning({ id: organizationMembers.id });
      accountId = account.id; memberId = member.id;
    }
    const [invitation] = await tx.insert(organizationMemberInvitations).values({ organizationId: actor.organizationId, accountId, memberId, createdByMemberId: actor.memberId, contactEmail: normalizedEmail, emailHash, role, tokenHash: invitationHash(token), status: "issued", expiresAt }).returning({ id: organizationMemberInvitations.id });
    await audit(tx, actor, "member.invitation_issued", "member_invitation", invitation.id, "allowed", requestId);
    return { invitation_id: invitation.id, activation_path: `/convites/membros/${token}`, expires_at: expiresAt.toISOString(), state: "issued" as const };
  });
}

export async function activateOrganizationMemberInvitation(token: string, displayName: string, password: string, requestId: string): Promise<{ state: "activated" }> {
  assertPassword(password); const db = requireDb(); const tokenHash = invitationHash(token);
  await db.transaction(async (tx) => {
    const [invitation] = await tx.select().from(organizationMemberInvitations).where(eq(organizationMemberInvitations.tokenHash, tokenHash)).limit(1);
    if (!invitation || invitation.status !== "issued" || invitation.expiresAt.getTime() <= Date.now() || !isRole(invitation.role)) throw unavailableInvitation();
    const [consumed] = await tx.update(organizationMemberInvitations).set({ status: "used", usedAt: new Date() }).where(and(eq(organizationMemberInvitations.id, invitation.id), eq(organizationMemberInvitations.status, "issued"))).returning({ id: organizationMemberInvitations.id });
    if (!consumed) throw unavailableInvitation();
    const [account] = await tx.update(accounts).set({ status: "active" }).where(and(eq(accounts.id, invitation.accountId), eq(accounts.status, "pending"))).returning({ id: accounts.id });
    const [member] = await tx.update(organizationMembers).set({ displayName, role: invitation.role, status: "active" }).where(and(eq(organizationMembers.id, invitation.memberId), eq(organizationMembers.organizationId, invitation.organizationId), eq(organizationMembers.status, "pending"))).returning({ id: organizationMembers.id });
    if (!account || !member) throw unavailableInvitation();
    const passwordSalt = randomBytes(16).toString("base64url"); const passwordHash = await derivePassword(password, passwordSalt);
    await tx.insert(passwordCredentials).values({ memberId: member.id, passwordHash, passwordSalt, algorithm: passwordAlgorithm });
    await tx.insert(auditEvents).values({ organizationId: invitation.organizationId, accountId: invitation.accountId, memberId: invitation.memberId, action: "member.activated", resourceType: "organization_member", resourceId: member.id, outcome: "allowed", requestId });
  });
  return { state: "activated" };
}

export async function changeOrganizationMemberRole(actor: AuthContext, memberId: string, role: InvitationRole, requestId: string): Promise<{ state: "updated" }> {
  const db = requireDb(); return db.transaction(async (tx) => {
    const member = await activeOtherMember(tx, actor, memberId);
    if (member.role === "admin" && role !== "admin" && await activeAdminCount(tx, actor.organizationId) <= 1) throw new HttpError(409, "A organizacao precisa manter um administrador ativo.");
    await tx.update(organizationMembers).set({ role }).where(eq(organizationMembers.id, member.id));
    await audit(tx, actor, "member.role_changed", "organization_member", member.id, "allowed", requestId); return { state: "updated" as const };
  });
}

export async function deactivateOrganizationMember(actor: AuthContext, memberId: string, requestId: string): Promise<{ state: "deactivated" }> {
  const db = requireDb(); return db.transaction(async (tx) => {
    const member = await activeOtherMember(tx, actor, memberId);
    if (member.role === "admin" && await activeAdminCount(tx, actor.organizationId) <= 1) throw new HttpError(409, "A organizacao precisa manter um administrador ativo.");
    await tx.update(organizationMembers).set({ status: "inactive" }).where(eq(organizationMembers.id, member.id));
    await tx.update(authSessions).set({ revokedAt: new Date() }).where(and(eq(authSessions.memberId, member.id), isNull(authSessions.revokedAt)));
    await audit(tx, actor, "member.deactivated", "organization_member", member.id, "allowed", requestId); return { state: "deactivated" as const };
  });
}

export async function revokeOrganizationMemberInvitation(actor: AuthContext, invitationId: string, requestId: string): Promise<{ state: "revoked" }> {
  const db = requireDb(); return db.transaction(async (tx) => {
    const [invitation] = await tx.update(organizationMemberInvitations).set({ status: "revoked", revokedAt: new Date() }).where(and(eq(organizationMemberInvitations.id, invitationId), eq(organizationMemberInvitations.organizationId, actor.organizationId), eq(organizationMemberInvitations.status, "issued"))).returning({ id: organizationMemberInvitations.id });
    if (!invitation) throw new HttpError(404, "Convite indisponivel.");
    await audit(tx, actor, "member.invitation_revoked", "member_invitation", invitation.id, "allowed", requestId); return { state: "revoked" as const };
  });
}

function requireDb() { const db = getDatabase(); if (!db) throw new HttpError(503, "Gestao de membros requer persistencia PostgreSQL ativa."); return db; }
function isRole(value: string): value is InvitationRole { return value === "viewer" || value === "analyst" || value === "admin"; }
function roleOf(value: string): OrganizationRole { if (!isRole(value)) throw new HttpError(503, "Membro indisponivel."); return value; }
function secretHash(scope: string, value: string): string { const key = process.env.ORGANIZATION_HASH_KEY; if (!key || key.length < 32) throw new HttpError(503, "Gestao de membros indisponivel."); return createHmac("sha256", key).update(`${scope}:${value}`).digest("hex"); }
function invitationHash(token: string): string { const key = process.env.INVITATION_TOKEN_HASH_KEY; if (!key || key.length < 32) throw new HttpError(503, "Convite indisponivel."); return createHmac("sha256", key).update(`member-invitation:${token}`).digest("hex"); }
function unavailableInvitation(): HttpError { return new HttpError(404, "Convite indisponivel."); }
async function activeOtherMember(tx: any, actor: AuthContext, memberId: string) { if (memberId === actor.memberId) throw new HttpError(409, "Nao e permitido alterar o proprio acesso."); const [member] = await tx.select().from(organizationMembers).where(and(eq(organizationMembers.id, memberId), eq(organizationMembers.organizationId, actor.organizationId), eq(organizationMembers.status, "active"))).limit(1); if (!member) throw new HttpError(404, "Membro indisponivel."); if (!isRole(member.role)) throw new HttpError(503, "Membro indisponivel."); return member; }
async function activeAdminCount(tx: any, organizationId: string): Promise<number> { const members = await tx.select({ id: organizationMembers.id }).from(organizationMembers).where(and(eq(organizationMembers.organizationId, organizationId), eq(organizationMembers.status, "active"), eq(organizationMembers.role, "admin"))); return members.length; }
async function audit(tx: any, actor: AuthContext, action: "member.invitation_issued" | "member.invitation_revoked" | "member.role_changed" | "member.deactivated", resourceType: "organization_member" | "member_invitation", resourceId: string, outcome: "allowed", requestId: string): Promise<void> { await tx.insert(auditEvents).values({ organizationId: actor.organizationId, accountId: actor.accountId, memberId: actor.memberId, action, resourceType, resourceId, outcome, requestId }); }
