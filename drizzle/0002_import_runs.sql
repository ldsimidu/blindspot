CREATE TABLE "import_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"idempotency_key" text NOT NULL,
	"payload_sha256" text NOT NULL,
	"status" text NOT NULL,
	"total_items" integer NOT NULL,
	"valid_items" integer NOT NULL,
	"duplicate_items" integer NOT NULL,
	"collision_items" integer NOT NULL,
	"invalid_items" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"confirmed_at" timestamp with time zone,
	CONSTRAINT "import_runs_idempotency_key_unique" UNIQUE("idempotency_key")
);
--> statement-breakpoint
CREATE TABLE "import_run_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"import_run_id" uuid NOT NULL,
	"item_index" integer NOT NULL,
	"vehicle" jsonb NOT NULL,
	"response" jsonb NOT NULL,
	"provider" text NOT NULL,
	"payload_sha256" text NOT NULL,
	"state" text NOT NULL,
	"diagnostic_code" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "import_run_items_run_index_key" UNIQUE("import_run_id","item_index")
);
--> statement-breakpoint
ALTER TABLE "import_run_items" ADD CONSTRAINT "import_run_items_import_run_id_import_runs_id_fk" FOREIGN KEY ("import_run_id") REFERENCES "public"."import_runs"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "import_runs_created_at_idx" ON "import_runs" USING btree ("created_at");
--> statement-breakpoint
CREATE INDEX "import_run_items_run_state_idx" ON "import_run_items" USING btree ("import_run_id","state");
