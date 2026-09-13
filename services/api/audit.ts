import { getDatabase } from "./db/client";
import { auditEvents } from "./db/schema";
import { HttpError } from "./types";
import type { AuthContext } from "./authentication";

export type AuditAction = "technical_sheet.generated" | "technical_sheet.created" | "technical_sheet.denied" | "technical_sheet.primary_set" | "technical_sheet.primary_cleared" | "technical_sheet.lifecycle_changed" | "technical_sheet.manual_tag_set" | "technical_sheet.manual_tag_revoked" | "research_session.created" | "research_session.cancelled" | "research_session.impact_read" | "research_session.history_read" | "research_session.denied" | "field_resolution.explanation_read" | "import.dry_run_created" | "import.confirmed" | "import.denied" | "member.denied" | "member.invitation_issued" | "member.invitation_revoked" | "member.activated" | "member.role_changed" | "member.deactivated" | "usage.denied" | "usage.policy_updated" | "usage.alert_created" | "usage.alert_acknowledged" | "comparison.created" | "comparison.read" | "comparison.denied";
export type AuditResourceType = "technical_sheet" | "technical_sheet_primary" | "technical_sheet_lifecycle" | "technical_sheet_tag" | "research_session" | "research_session_quality_impact" | "field_resolution" | "import_run" | "organization_member" | "member_invitation" | "usage" | "usage_policy" | "usage_alert" | "saved_comparison";
export interface AuditInput { actor: AuthContext; action: AuditAction; resourceType: AuditResourceType; resourceId?: string; outcome: "allowed" | "denied" | "failed"; requestId: string; }

export async function recordAudit(input: AuditInput): Promise<void> {
  const db = getDatabase();
  if (!db) throw new HttpError(503, "Auditoria indisponivel.");
  await db.insert(auditEvents).values({ organizationId: input.actor.organizationId, accountId: input.actor.accountId, memberId: input.actor.memberId, action: input.action, resourceType: input.resourceType, resourceId: input.resourceId, outcome: input.outcome, requestId: input.requestId });
}
