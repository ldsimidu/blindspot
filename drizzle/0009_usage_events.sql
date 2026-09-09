CREATE TABLE "usage_events" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "organization_id" uuid NOT NULL,
  "account_id" uuid,
  "member_id" uuid,
  "collection_run_id" uuid,
  "action" text NOT NULL,
  "outcome" text NOT NULL,
  "units" integer NOT NULL,
  "request_id" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "usage_events_collection_run_id_unique" UNIQUE("collection_run_id")
);
--> statement-breakpoint
ALTER TABLE "usage_events" ADD CONSTRAINT "usage_events_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "usage_events" ADD CONSTRAINT "usage_events_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "usage_events" ADD CONSTRAINT "usage_events_member_id_organization_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."organization_members"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "usage_events" ADD CONSTRAINT "usage_events_collection_run_id_collection_runs_id_fk" FOREIGN KEY ("collection_run_id") REFERENCES "public"."collection_runs"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "usage_events_organization_created_idx" ON "usage_events" USING btree ("organization_id","created_at");
--> statement-breakpoint
CREATE INDEX "usage_events_collection_run_idx" ON "usage_events" USING btree ("collection_run_id");
