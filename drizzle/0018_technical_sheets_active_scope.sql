CREATE UNIQUE INDEX "technical_sheets_active_scope_key" ON "technical_sheets" USING btree ("vehicle_configuration_id", "organization_id") WHERE "state" = 'active' AND "organization_id" IS NOT NULL;
