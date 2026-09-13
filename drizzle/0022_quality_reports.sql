CREATE TABLE "quality_reports" ("id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL, "organization_id" uuid NOT NULL REFERENCES "organizations"("id"), "technical_sheet_version_id" uuid NOT NULL REFERENCES "technical_sheet_versions"("id"), "field_path" text, "reason" text NOT NULL, "note" text NOT NULL, "state" text DEFAULT 'received' NOT NULL, "reported_by_member_id" uuid NOT NULL REFERENCES "organization_members"("id"), "decided_by_member_id" uuid REFERENCES "organization_members"("id"), "decision_note" text, "corrected_revision_id" uuid REFERENCES "technical_sheet_versions"("id"), "created_at" timestamptz DEFAULT now() NOT NULL, "decided_at" timestamptz);
--> statement-breakpoint
CREATE UNIQUE INDEX "quality_reports_open_dedupe_key" ON "quality_reports" ("organization_id","technical_sheet_version_id","field_path","reason");
--> statement-breakpoint
CREATE INDEX "quality_reports_organization_state_idx" ON "quality_reports" ("organization_id","state");
