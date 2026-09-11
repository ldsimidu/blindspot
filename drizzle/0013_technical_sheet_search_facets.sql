CREATE TABLE "technical_sheet_search_facets" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "technical_sheet_version_id" uuid NOT NULL,
  "vehicle_configuration_id" uuid NOT NULL,
  "facet_key" text NOT NULL,
  "value_text" text,
  "value_number" double precision,
  "unit" text,
  "source_refs" jsonb NOT NULL,
  "policy_version" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "technical_sheet_search_facets_version_key" UNIQUE("technical_sheet_version_id","facet_key")
);
--> statement-breakpoint
ALTER TABLE "technical_sheet_search_facets" ADD CONSTRAINT "technical_sheet_search_facets_technical_sheet_version_id_technical_sheet_versions_id_fk" FOREIGN KEY ("technical_sheet_version_id") REFERENCES "public"."technical_sheet_versions"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "technical_sheet_search_facets" ADD CONSTRAINT "technical_sheet_search_facets_vehicle_configuration_id_vehicle_configurations_id_fk" FOREIGN KEY ("vehicle_configuration_id") REFERENCES "public"."vehicle_configurations"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "technical_sheet_search_facets_text_idx" ON "technical_sheet_search_facets" USING btree ("facet_key","value_text");
--> statement-breakpoint
CREATE INDEX "technical_sheet_search_facets_number_idx" ON "technical_sheet_search_facets" USING btree ("facet_key","value_number");
--> statement-breakpoint
CREATE INDEX "technical_sheet_search_facets_vehicle_idx" ON "technical_sheet_search_facets" USING btree ("vehicle_configuration_id");
