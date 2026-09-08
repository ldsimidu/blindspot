import { createHmac, randomBytes } from "node:crypto";
import type { CookieOptions } from "express";
import { eq } from "drizzle-orm";
import { verifyPassword, verifyPasswordFallback } from "./credentials";
import { getDatabase } from "./db/client";
import { accounts, authSessions, organizationMembers, organizations, passwordCredentials } from "./db/schema";
import { HttpError } from "./types";

const sessionTtlMs = 12 * 60 * 60 * 1000;
const loginWindowMs = 15 * 60 * 1000;
const loginAttemptLimit = 5;
const loginAttempts = new Map<string, { count: number; expiresAt: number }>();

export async function login(email: string, password: string, ip: string): Promise<{ token: string; expiresAt: Date }> {
  const normalizedEmail = email.toLowerCase(); const rateKey = loginRateKey(normalizedEmail, ip);
  assertRateLimit(rateKey);
  const db = requireDb(); const [account] = await db.select().from(accounts).where(eq(accounts.email, normalizedEmail)).limit(1);
  if (!account || account.status !== "active") return failedLogin(rateKey, password);
  const memberships = await db.select({ member: organizationMembers, organization: organizations, credential: passwordCredentials }).from(organizationMembers).innerJoin(organizations, eq(organizationMembers.organizationId, organizations.id)).leftJoin(passwordCredentials, eq(passwordCredentials.memberId, organizationMembers.id)).where(eq(organizationMembers.accountId, account.id));
  const eligible = memberships.filter((entry) => entry.member.status === "active" && entry.organization.status === "active" && entry.credential !== null);
  if (eligible.length !== 1) return failedLogin(rateKey, password);
  const candidate = eligible[0]; const credential = candidate.credential;
  if (!credential || !await verifyPassword(password, credential.passwordSalt, credential.passwordHash)) return failedLoginAfterVerification(rateKey);
  loginAttempts.delete(rateKey);
  const token = `SES-${randomBytes(32).toString("base64url")}`; const expiresAt = new Date(Date.now() + sessionTtlMs);
  await db.insert(authSessions).values({ tokenHash: sessionHash(token), accountId: account.id, organizationId: candidate.organization.id, memberId: candidate.member.id, expiresAt });
  return { token, expiresAt };
}

export async function logout(token: string | undefined): Promise<void> {
  if (!token || !/^SES-[A-Za-z0-9_-]{40,96}$/.test(token)) return;
  const db = requireDb();
  await db.update(authSessions).set({ revokedAt: new Date() }).where(eq(authSessions.tokenHash, sessionHash(token)));
}

export async function readCurrentSession(token: string | undefined): Promise<{ email: string; displayName: string }> {
  if (!token || !/^SES-[A-Za-z0-9_-]{40,96}$/.test(token)) throw unauthorized();
  const db = requireDb();
  const rows = await db.select({ session: authSessions, account: accounts, member: organizationMembers, organization: organizations }).from(authSessions).innerJoin(accounts, eq(authSessions.accountId, accounts.id)).innerJoin(organizationMembers, eq(authSessions.memberId, organizationMembers.id)).innerJoin(organizations, eq(authSessions.organizationId, organizations.id)).where(eq(authSessions.tokenHash, sessionHash(token))).limit(1);
  const current = rows[0];
  if (!current || current.session.revokedAt || current.session.expiresAt.getTime() <= Date.now() || current.account.status !== "active" || current.member.status !== "active" || current.organization.status !== "active") throw unauthorized();
  await db.update(authSessions).set({ lastSeenAt: new Date() }).where(eq(authSessions.id, current.session.id));
  return { email: current.account.email, displayName: current.member.displayName };
}

export function sessionCookieName(): string { return isProduction() ? "__Host-blindspot_session" : "blindspot_session"; }
export function sessionCookieOptions(expiresAt?: Date): CookieOptions { return { httpOnly: true, sameSite: "lax", secure: isProduction(), path: "/", ...(expiresAt ? { expires: expiresAt } : {}) }; }

function requireDb() { const db = getDatabase(); if (!db) throw new HttpError(503, "Autenticacao requer persistencia PostgreSQL ativa."); return db; }
function sessionHash(token: string): string { const key = process.env.SESSION_TOKEN_HASH_KEY; if (!key || key.length < 32) throw new HttpError(503, "Autenticacao indisponivel."); return createHmac("sha256", key).update(`session:${token}`).digest("hex"); }
function loginRateKey(email: string, ip: string): string { const key = process.env.ORGANIZATION_HASH_KEY; if (!key || key.length < 32) throw new HttpError(503, "Autenticacao indisponivel."); return createHmac("sha256", key).update(`login:${email}:${ip}`).digest("hex"); }
function assertRateLimit(key: string): void { const current = loginAttempts.get(key); if (!current || current.expiresAt <= Date.now()) { loginAttempts.delete(key); return; } if (current.count >= loginAttemptLimit) throw new HttpError(429, "Tentativa indisponivel. Tente novamente mais tarde."); }
async function failedLogin(key: string, password: string): Promise<never> { await verifyPasswordFallback(password); recordFailedLogin(key); throw new HttpError(401, "Credenciais invalidas."); }
function failedLoginAfterVerification(key: string): never { recordFailedLogin(key); throw new HttpError(401, "Credenciais invalidas."); }
function recordFailedLogin(key: string): void { const current = loginAttempts.get(key); const now = Date.now(); loginAttempts.set(key, { count: (current && current.expiresAt > now ? current.count : 0) + 1, expiresAt: now + loginWindowMs }); }
function isProduction(): boolean { return process.env.NODE_ENV === "production"; }
function unauthorized(): HttpError { return new HttpError(401, "Sessao indisponivel."); }
