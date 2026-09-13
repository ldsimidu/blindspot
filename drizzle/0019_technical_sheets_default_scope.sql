DROP INDEX "technical_sheets_active_scope_key";
--> statement-breakpoint
ALTER TABLE "technical_sheets" ADD COLUMN "is_default" boolean NOT NULL DEFAULT true;
--> statement-breakpoint
CREATE UNIQUE INDEX "technical_sheets_default_scope_key" ON "technical_sheets" USING btree ("vehicle_configuration_id", "organization_id") WHERE "is_default" = true AND "organization_id" IS NOT NULL;
