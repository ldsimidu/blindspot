CREATE TABLE "organization_usage_policies" (
  "organization_id" uuid PRIMARY KEY NOT NULL,
  "threshold_units" integer NOT NULL,
  "is_active" boolean DEFAULT false NOT NULL,
  "version" integer DEFAULT 1 NOT NULL,
  "updated_by_member_id" uuid,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "usage_alerts" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "organization_id" uuid NOT NULL,
  "period" text NOT NULL,
  "threshold_units" integer NOT NULL,
  "total_units" integer NOT NULL,
  "policy_version" integer NOT NULL,
  "state" text DEFAULT 'open' NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "usage_alerts_organization_period_threshold_key" UNIQUE("organization_id","period","threshold_units")
);
--> statement-breakpoint
CREATE TABLE "usage_alert_recipients" (
  "usage_alert_id" uuid NOT NULL,
  "member_id" uuid NOT NULL,
  "acknowledged_at" timestamp with time zone,
  CONSTRAINT "usage_alert_recipients_alert_member_key" UNIQUE("usage_alert_id","member_id")
);
--> statement-breakpoint
ALTER TABLE "organization_usage_policies" ADD CONSTRAINT "organization_usage_policies_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "organization_usage_policies" ADD CONSTRAINT "organization_usage_policies_updated_by_member_id_organization_members_id_fk" FOREIGN KEY ("updated_by_member_id") REFERENCES "public"."organization_members"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "usage_alerts" ADD CONSTRAINT "usage_alerts_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "usage_alert_recipients" ADD CONSTRAINT "usage_alert_recipients_usage_alert_id_usage_alerts_id_fk" FOREIGN KEY ("usage_alert_id") REFERENCES "public"."usage_alerts"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "usage_alert_recipients" ADD CONSTRAINT "usage_alert_recipients_member_id_organization_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."organization_members"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "usage_alerts_organization_created_idx" ON "usage_alerts" USING btree ("organization_id","created_at");
--> statement-breakpoint
CREATE INDEX "usage_alert_recipients_member_idx" ON "usage_alert_recipients" USING btree ("member_id");
