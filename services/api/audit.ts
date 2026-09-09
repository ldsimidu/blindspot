import { getDatabase } from "./db/client";
import { auditEvents } from "./db/schema";
import { HttpError } from "./types";
import type { AuthContext } from "./authentication";

export type AuditAction = "technical_sheet.generated" | "technical_sheet.denied" | "import.dry_run_created" | "import.confirmed" | "import.denied" | "member.denied" | "member.invitation_issued" | "member.invitation_revoked" | "member.activated" | "member.role_changed" | "member.deactivated";
export type AuditResourceType = "technical_sheet" | "import_run" | "organization_member" | "member_invitation";
export interface AuditInput { actor: AuthContext; action: AuditAction; resourceType: AuditResourceType; resourceId?: string; outcome: "allowed" | "denied" | "failed"; requestId: string; }

export async function recordAudit(input: AuditInput): Promise<void> {
  const db = getDatabase();
  if (!db) throw new HttpError(503, "Auditoria indisponivel.");
  await db.insert(auditEvents).values({ organizationId: input.actor.organizationId, accountId: input.actor.accountId, memberId: input.actor.memberId, action: input.action, resourceType: input.resourceType, resourceId: input.resourceId, outcome: input.outcome, requestId: input.requestId });
}
