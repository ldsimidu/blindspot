ALTER TABLE "collection_runs" ADD COLUMN "organization_id" uuid;
--> statement-breakpoint
ALTER TABLE "collection_runs" ADD COLUMN "account_id" uuid;
--> statement-breakpoint
ALTER TABLE "collection_runs" ADD COLUMN "member_id" uuid;
--> statement-breakpoint
ALTER TABLE "import_runs" ADD COLUMN "organization_id" uuid;
--> statement-breakpoint
ALTER TABLE "import_runs" ADD COLUMN "account_id" uuid;
--> statement-breakpoint
ALTER TABLE "import_runs" ADD COLUMN "member_id" uuid;
--> statement-breakpoint
ALTER TABLE "collection_runs" ADD CONSTRAINT "collection_runs_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "collection_runs" ADD CONSTRAINT "collection_runs_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "collection_runs" ADD CONSTRAINT "collection_runs_member_id_organization_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."organization_members"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "import_runs" ADD CONSTRAINT "import_runs_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "import_runs" ADD CONSTRAINT "import_runs_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "import_runs" ADD CONSTRAINT "import_runs_member_id_organization_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."organization_members"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "collection_runs_organization_idx" ON "collection_runs" USING btree ("organization_id");
--> statement-breakpoint
CREATE INDEX "import_runs_organization_idx" ON "import_runs" USING btree ("organization_id");
--> statement-breakpoint
CREATE TABLE "audit_events" ("id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL, "organization_id" uuid, "account_id" uuid, "member_id" uuid, "action" text NOT NULL, "resource_type" text NOT NULL, "resource_id" text, "outcome" text NOT NULL, "request_id" text NOT NULL, "created_at" timestamp with time zone DEFAULT now() NOT NULL);
--> statement-breakpoint
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_member_id_organization_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."organization_members"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "audit_events_organization_created_idx" ON "audit_events" USING btree ("organization_id", "created_at");
--> statement-breakpoint
CREATE INDEX "audit_events_request_idx" ON "audit_events" USING btree ("request_id");
