CREATE TABLE "organization_members" ("id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL, "organization_id" uuid NOT NULL, "email" text NOT NULL, "email_hash" text NOT NULL, "display_name" text NOT NULL, "role" text NOT NULL, "status" text NOT NULL, "created_at" timestamp with time zone DEFAULT now() NOT NULL, CONSTRAINT "organization_members_organization_email_key" UNIQUE("organization_id","email_hash"));
--> statement-breakpoint
CREATE TABLE "password_credentials" ("member_id" uuid PRIMARY KEY NOT NULL, "password_hash" text NOT NULL, "password_salt" text NOT NULL, "algorithm" text NOT NULL, "created_at" timestamp with time zone DEFAULT now() NOT NULL);
--> statement-breakpoint
CREATE TABLE "organization_invitations" ("id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL, "organization_id" uuid NOT NULL, "organization_request_id" uuid NOT NULL, "contact_email" text NOT NULL, "email_hash" text NOT NULL, "token_hash" text NOT NULL, "status" text NOT NULL, "expires_at" timestamp with time zone NOT NULL, "created_at" timestamp with time zone DEFAULT now() NOT NULL, "revoked_at" timestamp with time zone, "used_at" timestamp with time zone, CONSTRAINT "organization_invitations_token_hash_unique" UNIQUE("token_hash"));
--> statement-breakpoint
CREATE TABLE "organization_invitation_events" ("id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL, "organization_invitation_id" uuid NOT NULL, "event_type" text NOT NULL, "actor_kind" text NOT NULL, "created_at" timestamp with time zone DEFAULT now() NOT NULL);
--> statement-breakpoint
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "password_credentials" ADD CONSTRAINT "password_credentials_member_id_organization_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."organization_members"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "organization_invitations" ADD CONSTRAINT "organization_invitations_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "organization_invitations" ADD CONSTRAINT "organization_invitations_organization_request_id_organization_requests_id_fk" FOREIGN KEY ("organization_request_id") REFERENCES "public"."organization_requests"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "organization_invitation_events" ADD CONSTRAINT "organization_invitation_events_organization_invitation_id_organization_invitations_id_fk" FOREIGN KEY ("organization_invitation_id") REFERENCES "public"."organization_invitations"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "organization_members_organization_idx" ON "organization_members" USING btree ("organization_id");
--> statement-breakpoint
CREATE INDEX "organization_invitations_organization_status_idx" ON "organization_invitations" USING btree ("organization_id","status");
--> statement-breakpoint
CREATE INDEX "organization_invitations_request_idx" ON "organization_invitations" USING btree ("organization_request_id");
--> statement-breakpoint
CREATE INDEX "organization_invitation_events_invitation_idx" ON "organization_invitation_events" USING btree ("organization_invitation_id","created_at");
