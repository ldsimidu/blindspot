ALTER TABLE "organization_requests" ADD COLUMN "operator_reference" text;
--> statement-breakpoint
ALTER TABLE "organization_requests" ADD CONSTRAINT "organization_requests_operator_reference_unique" UNIQUE("operator_reference");
--> statement-breakpoint
ALTER TABLE "organization_requests" ADD COLUMN "account_id" uuid;
--> statement-breakpoint
ALTER TABLE "organization_requests" ADD COLUMN "initial_member_id" uuid;
--> statement-breakpoint
ALTER TABLE "organization_requests" ADD CONSTRAINT "organization_requests_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "organization_requests" ADD CONSTRAINT "organization_requests_initial_member_id_organization_members_id_fk" FOREIGN KEY ("initial_member_id") REFERENCES "public"."organization_members"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "organization_requests_account_idx" ON "organization_requests" USING btree ("account_id");
