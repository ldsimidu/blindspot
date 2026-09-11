CREATE TABLE "organization_member_invitations" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "organization_id" uuid NOT NULL,
  "account_id" uuid NOT NULL,
  "member_id" uuid NOT NULL,
  "created_by_member_id" uuid NOT NULL,
  "contact_email" text NOT NULL,
  "email_hash" text NOT NULL,
  "role" text NOT NULL,
  "token_hash" text NOT NULL,
  "status" text NOT NULL,
  "expires_at" timestamp with time zone NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "revoked_at" timestamp with time zone,
  "used_at" timestamp with time zone,
  CONSTRAINT "organization_member_invitations_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
ALTER TABLE "organization_member_invitations" ADD CONSTRAINT "organization_member_invitations_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "organization_member_invitations" ADD CONSTRAINT "organization_member_invitations_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "organization_member_invitations" ADD CONSTRAINT "organization_member_invitations_member_id_organization_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."organization_members"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "organization_member_invitations" ADD CONSTRAINT "organization_member_invitations_created_by_member_id_organization_members_id_fk" FOREIGN KEY ("created_by_member_id") REFERENCES "public"."organization_members"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "organization_member_invitations_organization_status_idx" ON "organization_member_invitations" USING btree ("organization_id","status");
--> statement-breakpoint
CREATE INDEX "organization_member_invitations_member_idx" ON "organization_member_invitations" USING btree ("member_id");
--> statement-breakpoint
CREATE INDEX "organization_member_invitations_token_hash_idx" ON "organization_member_invitations" USING btree ("token_hash");
