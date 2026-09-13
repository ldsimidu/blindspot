DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'technical_sheets_state_check') THEN
    ALTER TABLE "technical_sheets" ADD CONSTRAINT "technical_sheets_state_check" CHECK ("state" IN ('active', 'stale', 'archived'));
  END IF;
END $$;
--> statement-breakpoint
CREATE TABLE "technical_sheet_tags" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "technical_sheet_id" uuid NOT NULL REFERENCES "technical_sheets"("id"),
  "organization_id" uuid NOT NULL REFERENCES "organizations"("id"),
  "tag" text NOT NULL,
  "origin" text NOT NULL,
  "policy_version" text NOT NULL,
  "reason_code" text NOT NULL,
  "created_by_member_id" uuid REFERENCES "organization_members"("id"),
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "revoked_at" timestamptz,
  "revoked_by_member_id" uuid REFERENCES "organization_members"("id"),
  CONSTRAINT "technical_sheet_tags_origin_check" CHECK ("origin" IN ('derived', 'manual'))
);
--> statement-breakpoint
CREATE INDEX "technical_sheet_tags_sheet_active_idx" ON "technical_sheet_tags" ("technical_sheet_id", "revoked_at");
--> statement-breakpoint
CREATE UNIQUE INDEX "technical_sheet_tags_active_unique" ON "technical_sheet_tags" ("technical_sheet_id", "tag", "origin") WHERE "revoked_at" IS NULL;
--> statement-breakpoint
CREATE TABLE "technical_sheet_lifecycle_events" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "technical_sheet_id" uuid NOT NULL REFERENCES "technical_sheets"("id"),
  "organization_id" uuid NOT NULL REFERENCES "organizations"("id"),
  "from_state" text,
  "to_state" text NOT NULL,
  "reason_code" text NOT NULL,
  "policy_version" text NOT NULL,
  "changed_by_member_id" uuid NOT NULL REFERENCES "organization_members"("id"),
  "created_at" timestamptz DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "technical_sheet_lifecycle_events_sheet_created_idx" ON "technical_sheet_lifecycle_events" ("technical_sheet_id", "created_at");
--> statement-breakpoint
CREATE TABLE "technical_sheet_primary_assignments" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "organization_id" uuid NOT NULL REFERENCES "organizations"("id"),
  "vehicle_configuration_id" uuid NOT NULL REFERENCES "vehicle_configurations"("id"),
  "technical_sheet_id" uuid NOT NULL REFERENCES "technical_sheets"("id"),
  "reason_code" text NOT NULL,
  "policy_version" text NOT NULL,
  "assigned_by_member_id" uuid NOT NULL REFERENCES "organization_members"("id"),
  "assigned_at" timestamptz DEFAULT now() NOT NULL,
  "revoked_at" timestamptz,
  "revoked_by_member_id" uuid REFERENCES "organization_members"("id")
);
--> statement-breakpoint
CREATE UNIQUE INDEX "technical_sheet_primary_active_scope_unique" ON "technical_sheet_primary_assignments" ("organization_id", "vehicle_configuration_id") WHERE "revoked_at" IS NULL;
--> statement-breakpoint
CREATE INDEX "technical_sheet_primary_assignments_sheet_idx" ON "technical_sheet_primary_assignments" ("technical_sheet_id");
