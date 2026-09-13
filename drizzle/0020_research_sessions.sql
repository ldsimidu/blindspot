CREATE TABLE "research_sessions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "technical_sheet_id" uuid NOT NULL REFERENCES "technical_sheets"("id"),
  "base_revision_id" uuid NOT NULL REFERENCES "technical_sheet_versions"("id"),
  "organization_id" uuid NOT NULL REFERENCES "organizations"("id"),
  "account_id" uuid NOT NULL REFERENCES "accounts"("id"),
  "member_id" uuid NOT NULL REFERENCES "organization_members"("id"),
  "idempotency_key" text NOT NULL, "focus" text NOT NULL, "requested_targets" jsonb NOT NULL, "resolved_targets" jsonb NOT NULL,
  "source_policy_version" text NOT NULL, "schema_contract_id" uuid NOT NULL REFERENCES "schema_contracts"("id"), "budget" jsonb NOT NULL,
  "state" text DEFAULT 'queued' NOT NULL, "failure_code" text, "created_at" timestamptz DEFAULT now() NOT NULL, "started_at" timestamptz, "finished_at" timestamptz
);
--> statement-breakpoint
CREATE UNIQUE INDEX "research_sessions_org_sheet_idempotency_key" ON "research_sessions" ("organization_id", "technical_sheet_id", "idempotency_key");
--> statement-breakpoint
CREATE INDEX "research_sessions_sheet_created_idx" ON "research_sessions" ("technical_sheet_id", "created_at");
--> statement-breakpoint
CREATE INDEX "research_sessions_organization_state_idx" ON "research_sessions" ("organization_id", "state");
