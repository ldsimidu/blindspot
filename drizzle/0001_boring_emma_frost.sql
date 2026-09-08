CREATE TABLE "vehicle_configuration_aliases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vehicle_configuration_id" uuid NOT NULL,
	"alias_normalized" text NOT NULL,
	"alias_display" text NOT NULL,
	"kind" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "vehicle_configuration_aliases_configuration_alias_key" UNIQUE("vehicle_configuration_id","alias_normalized")
);
--> statement-breakpoint
ALTER TABLE "vehicle_configurations" ADD COLUMN "catalog_slug" text DEFAULT '' NOT NULL;--> statement-breakpoint
UPDATE "vehicle_configurations"
SET "catalog_slug" = lower(regexp_replace(concat_ws('-', "brand", "model", "trim", "model_year"::text, "market"), '[^[:alnum:]]+', '-', 'g'))
WHERE "catalog_slug" = '';--> statement-breakpoint
ALTER TABLE "vehicle_configuration_aliases" ADD CONSTRAINT "vehicle_configuration_aliases_vehicle_configuration_id_vehicle_configurations_id_fk" FOREIGN KEY ("vehicle_configuration_id") REFERENCES "public"."vehicle_configurations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "vehicle_configuration_aliases_normalized_idx" ON "vehicle_configuration_aliases" USING btree ("alias_normalized");--> statement-breakpoint
CREATE INDEX "vehicle_configurations_catalog_slug_idx" ON "vehicle_configurations" USING btree ("catalog_slug");
