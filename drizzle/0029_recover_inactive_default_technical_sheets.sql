UPDATE "technical_sheets"
SET "state" = 'archived', "is_default" = false, "updated_at" = now()
WHERE "state" IN ('legacy_imported', 'legacy_unassigned');
--> statement-breakpoint
UPDATE "technical_sheets"
SET "is_default" = false, "updated_at" = now()
WHERE "state" <> 'active' AND "is_default" = true;
--> statement-breakpoint
ALTER TABLE "technical_sheets" DROP CONSTRAINT IF EXISTS "technical_sheets_state_check";
--> statement-breakpoint
ALTER TABLE "technical_sheets" ADD CONSTRAINT "technical_sheets_state_check" CHECK ("state" IN ('active', 'stale', 'archived'));
--> statement-breakpoint
DROP INDEX IF EXISTS "technical_sheets_default_scope_key";
--> statement-breakpoint
CREATE UNIQUE INDEX "technical_sheets_default_active_scope_key" ON "technical_sheets" USING btree ("vehicle_configuration_id", "organization_id") WHERE "is_default" = true AND "state" = 'active' AND "organization_id" IS NOT NULL;
