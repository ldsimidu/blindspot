CREATE TABLE "organizations" ("id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL, "display_name" text NOT NULL, "cnpj_hash" text NOT NULL, "status" text NOT NULL, "created_at" timestamp with time zone DEFAULT now() NOT NULL, CONSTRAINT "organizations_cnpj_hash_unique" UNIQUE("cnpj_hash"));
--> statement-breakpoint
CREATE TABLE "organization_requests" ("id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL, "protocol_hash" text NOT NULL, "company_name" text NOT NULL, "cnpj_hash" text NOT NULL, "contact_name" text NOT NULL, "contact_email" text NOT NULL, "email_hash" text NOT NULL, "privacy_notice_version" text NOT NULL, "status" text NOT NULL, "created_at" timestamp with time zone DEFAULT now() NOT NULL, "decided_at" timestamp with time zone, "decision_code" text, "decided_by" text, "organization_id" uuid, CONSTRAINT "organization_requests_protocol_hash_unique" UNIQUE("protocol_hash"));
--> statement-breakpoint
CREATE TABLE "organization_request_events" ("id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL, "organization_request_id" uuid NOT NULL, "event_type" text NOT NULL, "actor_kind" text NOT NULL, "actor_id" text, "decision_code" text, "created_at" timestamp with time zone DEFAULT now() NOT NULL);
--> statement-breakpoint
ALTER TABLE "organization_requests" ADD CONSTRAINT "organization_requests_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "organization_request_events" ADD CONSTRAINT "organization_request_events_organization_request_id_organization_requests_id_fk" FOREIGN KEY ("organization_request_id") REFERENCES "public"."organization_requests"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "organization_requests_dedupe_idx" ON "organization_requests" USING btree ("cnpj_hash","email_hash");
--> statement-breakpoint
CREATE INDEX "organization_requests_status_idx" ON "organization_requests" USING btree ("status");
--> statement-breakpoint
CREATE INDEX "organization_request_events_request_idx" ON "organization_request_events" USING btree ("organization_request_id","created_at");
