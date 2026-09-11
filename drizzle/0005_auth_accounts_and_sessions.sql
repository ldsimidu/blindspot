CREATE TABLE "accounts" ("id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL, "email" text NOT NULL, "status" text NOT NULL, "created_at" timestamp with time zone DEFAULT now() NOT NULL, CONSTRAINT "accounts_email_unique" UNIQUE("email"));
--> statement-breakpoint
ALTER TABLE "organization_members" ADD COLUMN "account_id" uuid;
--> statement-breakpoint
INSERT INTO "accounts" ("email", "status") SELECT DISTINCT lower("email"), 'active' FROM "organization_members" ON CONFLICT ("email") DO NOTHING;
--> statement-breakpoint
UPDATE "organization_members" AS member SET "account_id" = account."id" FROM "accounts" AS account WHERE lower(member."email") = account."email";
--> statement-breakpoint
ALTER TABLE "organization_members" ALTER COLUMN "account_id" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "organization_members_account_idx" ON "organization_members" USING btree ("account_id");
--> statement-breakpoint
CREATE TABLE "auth_sessions" ("id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL, "token_hash" text NOT NULL, "account_id" uuid NOT NULL, "organization_id" uuid NOT NULL, "member_id" uuid NOT NULL, "created_at" timestamp with time zone DEFAULT now() NOT NULL, "last_seen_at" timestamp with time zone DEFAULT now() NOT NULL, "expires_at" timestamp with time zone NOT NULL, "revoked_at" timestamp with time zone, CONSTRAINT "auth_sessions_token_hash_unique" UNIQUE("token_hash"));
--> statement-breakpoint
ALTER TABLE "auth_sessions" ADD CONSTRAINT "auth_sessions_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "auth_sessions" ADD CONSTRAINT "auth_sessions_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "auth_sessions" ADD CONSTRAINT "auth_sessions_member_id_organization_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."organization_members"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "auth_sessions_token_hash_idx" ON "auth_sessions" USING btree ("token_hash");
--> statement-breakpoint
CREATE INDEX "auth_sessions_account_idx" ON "auth_sessions" USING btree ("account_id");
--> statement-breakpoint
CREATE INDEX "auth_sessions_member_idx" ON "auth_sessions" USING btree ("member_id");
