CREATE TABLE "technical_sheets" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "vehicle_configuration_id" uuid NOT NULL REFERENCES "vehicle_configurations"("id"),
  "organization_id" uuid REFERENCES "organizations"("id"),
  "created_by_member_id" uuid REFERENCES "organization_members"("id"),
  "state" text NOT NULL DEFAULT 'active',
  "parent_sheet_id" uuid,
  "origin_revision_id" uuid,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "technical_sheets_state_check" CHECK ("state" IN ('active', 'archived', 'legacy_imported', 'legacy_unassigned'))
);
--> statement-breakpoint
ALTER TABLE "collection_runs" ADD COLUMN "technical_sheet_id" uuid;
--> statement-breakpoint
ALTER TABLE "technical_sheet_versions" ADD COLUMN "technical_sheet_id" uuid;
--> statement-breakpoint
INSERT INTO "technical_sheets" ("vehicle_configuration_id", "organization_id", "state")
SELECT DISTINCT v."vehicle_configuration_id", r."organization_id", CASE WHEN r."organization_id" IS NULL THEN 'legacy_unassigned' ELSE 'legacy_imported' END
FROM "technical_sheet_versions" v INNER JOIN "collection_runs" r ON r."id" = v."collection_run_id";
--> statement-breakpoint
UPDATE "technical_sheet_versions" v SET "technical_sheet_id" = s."id"
FROM "collection_runs" r, "technical_sheets" s
WHERE r."id" = v."collection_run_id" AND s."vehicle_configuration_id" = v."vehicle_configuration_id" AND s."organization_id" IS NOT DISTINCT FROM r."organization_id";
--> statement-breakpoint
UPDATE "collection_runs" r SET "technical_sheet_id" = v."technical_sheet_id"
FROM "technical_sheet_versions" v WHERE v."collection_run_id" = r."id";
--> statement-breakpoint
ALTER TABLE "technical_sheet_versions" ADD CONSTRAINT "technical_sheet_versions_technical_sheet_id_technical_sheets_id_fk" FOREIGN KEY ("technical_sheet_id") REFERENCES "technical_sheets"("id");
--> statement-breakpoint
ALTER TABLE "collection_runs" ADD CONSTRAINT "collection_runs_technical_sheet_id_technical_sheets_id_fk" FOREIGN KEY ("technical_sheet_id") REFERENCES "technical_sheets"("id");
--> statement-breakpoint
CREATE INDEX "technical_sheets_vehicle_organization_idx" ON "technical_sheets" USING btree ("vehicle_configuration_id", "organization_id");
--> statement-breakpoint
CREATE INDEX "technical_sheets_organization_state_idx" ON "technical_sheets" USING btree ("organization_id", "state");
--> statement-breakpoint
CREATE INDEX "technical_sheet_versions_sheet_created_idx" ON "technical_sheet_versions" USING btree ("technical_sheet_id", "created_at");
--> statement-breakpoint
CREATE INDEX "collection_runs_sheet_idx" ON "collection_runs" USING btree ("technical_sheet_id");
