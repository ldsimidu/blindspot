import { getDatabase } from "./db/client";
import { auditEvents } from "./db/schema";
import { HttpError } from "./types";
import type { AuthContext } from "./authentication";

export type AuditAction = "technical_sheet.generated" | "technical_sheet.denied" | "import.dry_run_created" | "import.confirmed" | "import.denied";
export interface AuditInput { actor: AuthContext; action: AuditAction; resourceType: "technical_sheet" | "import_run"; resourceId?: string; outcome: "allowed" | "denied" | "failed"; requestId: string; }

export async function recordAudit(input: AuditInput): Promise<void> {
  const db = getDatabase();
  if (!db) throw new HttpError(503, "Auditoria indisponivel.");
  await db.insert(auditEvents).values({ organizationId: input.actor.organizationId, accountId: input.actor.accountId, memberId: input.actor.memberId, action: input.action, resourceType: input.resourceType, resourceId: input.resourceId, outcome: input.outcome, requestId: input.requestId });
}
