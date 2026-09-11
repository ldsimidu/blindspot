CREATE TABLE "collection_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"request_id" text NOT NULL,
	"vehicle_configuration_id" uuid NOT NULL,
	"provider" text NOT NULL,
	"model_name" text NOT NULL,
	"status" text NOT NULL,
	"schema_contract_id" uuid NOT NULL,
	"prompt_sha256" text NOT NULL,
	"started_at" timestamp with time zone NOT NULL,
	"finished_at" timestamp with time zone NOT NULL,
	"failure_code" text,
	CONSTRAINT "collection_runs_request_id_unique" UNIQUE("request_id")
);
--> statement-breakpoint
CREATE TABLE "schema_contracts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"label" text,
	"sha256" text NOT NULL,
	"runtime_asset_path" text NOT NULL,
	"recorded_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "schema_contracts_sha256_unique" UNIQUE("sha256")
);
--> statement-breakpoint
CREATE TABLE "sources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"canonical_url" text NOT NULL,
	"title" text NOT NULL,
	"source_type" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sources_canonical_url_unique" UNIQUE("canonical_url")
);
--> statement-breakpoint
CREATE TABLE "technical_sheet_sources" (
	"technical_sheet_version_id" uuid NOT NULL,
	"source_id" uuid NOT NULL,
	"source_ref" text NOT NULL,
	CONSTRAINT "technical_sheet_sources_version_ref_key" UNIQUE("technical_sheet_version_id","source_ref")
);
--> statement-breakpoint
CREATE TABLE "technical_sheet_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"collection_run_id" uuid NOT NULL,
	"vehicle_configuration_id" uuid NOT NULL,
	"schema_contract_id" uuid NOT NULL,
	"version_number" integer NOT NULL,
	"payload" jsonb NOT NULL,
	"completeness_summary" jsonb NOT NULL,
	"payload_sha256" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "technical_sheet_versions_collection_run_id_unique" UNIQUE("collection_run_id"),
	CONSTRAINT "technical_sheet_versions_vehicle_version_key" UNIQUE("vehicle_configuration_id","version_number")
);
--> statement-breakpoint
CREATE TABLE "vehicle_configurations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"brand" text NOT NULL,
	"model" text NOT NULL,
	"trim" text NOT NULL,
	"model_year" integer NOT NULL,
	"market" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "vehicle_configurations_identity_key" UNIQUE("brand","model","trim","model_year","market")
);
--> statement-breakpoint
ALTER TABLE "collection_runs" ADD CONSTRAINT "collection_runs_vehicle_configuration_id_vehicle_configurations_id_fk" FOREIGN KEY ("vehicle_configuration_id") REFERENCES "public"."vehicle_configurations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collection_runs" ADD CONSTRAINT "collection_runs_schema_contract_id_schema_contracts_id_fk" FOREIGN KEY ("schema_contract_id") REFERENCES "public"."schema_contracts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "technical_sheet_sources" ADD CONSTRAINT "technical_sheet_sources_technical_sheet_version_id_technical_sheet_versions_id_fk" FOREIGN KEY ("technical_sheet_version_id") REFERENCES "public"."technical_sheet_versions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "technical_sheet_sources" ADD CONSTRAINT "technical_sheet_sources_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "technical_sheet_versions" ADD CONSTRAINT "technical_sheet_versions_collection_run_id_collection_runs_id_fk" FOREIGN KEY ("collection_run_id") REFERENCES "public"."collection_runs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "technical_sheet_versions" ADD CONSTRAINT "technical_sheet_versions_vehicle_configuration_id_vehicle_configurations_id_fk" FOREIGN KEY ("vehicle_configuration_id") REFERENCES "public"."vehicle_configurations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "technical_sheet_versions" ADD CONSTRAINT "technical_sheet_versions_schema_contract_id_schema_contracts_id_fk" FOREIGN KEY ("schema_contract_id") REFERENCES "public"."schema_contracts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "collection_runs_finished_at_idx" ON "collection_runs" USING btree ("finished_at");--> statement-breakpoint
CREATE INDEX "technical_sheet_versions_vehicle_created_idx" ON "technical_sheet_versions" USING btree ("vehicle_configuration_id","created_at");