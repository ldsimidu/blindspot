CREATE TABLE "saved_comparisons" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "organization_id" uuid NOT NULL,
  "account_id" uuid NOT NULL,
  "created_by_member_id" uuid NOT NULL,
  "left_technical_sheet_version_id" uuid NOT NULL,
  "right_technical_sheet_version_id" uuid NOT NULL,
  "comparison_contract_version" text NOT NULL,
  "result_sha256" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "saved_comparisons_organization_pair_key" UNIQUE("organization_id","left_technical_sheet_version_id","right_technical_sheet_version_id")
);
--> statement-breakpoint
ALTER TABLE "saved_comparisons" ADD CONSTRAINT "saved_comparisons_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "saved_comparisons" ADD CONSTRAINT "saved_comparisons_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "saved_comparisons" ADD CONSTRAINT "saved_comparisons_created_by_member_id_organization_members_id_fk" FOREIGN KEY ("created_by_member_id") REFERENCES "public"."organization_members"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "saved_comparisons" ADD CONSTRAINT "saved_comparisons_left_technical_sheet_version_id_technical_sheet_versions_id_fk" FOREIGN KEY ("left_technical_sheet_version_id") REFERENCES "public"."technical_sheet_versions"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "saved_comparisons" ADD CONSTRAINT "saved_comparisons_right_technical_sheet_version_id_technical_sheet_versions_id_fk" FOREIGN KEY ("right_technical_sheet_version_id") REFERENCES "public"."technical_sheet_versions"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "saved_comparisons_organization_created_idx" ON "saved_comparisons" USING btree ("organization_id","created_at");
