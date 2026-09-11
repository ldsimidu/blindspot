CREATE TABLE "source_trust_anchors" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "brand_normalized" text NOT NULL,
  "market_normalized" text NOT NULL,
  "hostname" text NOT NULL,
  "state" text DEFAULT 'candidate' NOT NULL,
  "confidence" integer DEFAULT 0 NOT NULL,
  "observation_count" integer DEFAULT 0 NOT NULL,
  "policy_version" text NOT NULL,
  "first_observed_at" timestamp with time zone DEFAULT now() NOT NULL,
  "last_observed_at" timestamp with time zone DEFAULT now() NOT NULL,
  "expires_at" timestamp with time zone NOT NULL,
  CONSTRAINT "source_trust_anchors_scope_host_key" UNIQUE("brand_normalized", "market_normalized", "hostname")
);
--> statement-breakpoint
CREATE INDEX "source_trust_anchors_scope_active_idx" ON "source_trust_anchors" USING btree ("brand_normalized", "market_normalized", "state", "expires_at");
