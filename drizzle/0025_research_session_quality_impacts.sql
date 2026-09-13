CREATE TABLE "research_session_quality_impacts" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "research_session_id" uuid NOT NULL REFERENCES "research_sessions"("id"),
  "organization_id" uuid NOT NULL REFERENCES "organizations"("id"),
  "base_revision_id" uuid NOT NULL REFERENCES "technical_sheet_versions"("id"),
  "result_revision_id" uuid REFERENCES "technical_sheet_versions"("id"),
  "policy_version" text NOT NULL,
  "outcome_kind" text NOT NULL,
  "before_vector" jsonb NOT NULL,
  "after_vector" jsonb,
  "delta" jsonb NOT NULL,
  "recommendation" jsonb NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT "research_session_quality_impacts_session_key" UNIQUE("research_session_id"),
  CONSTRAINT "research_session_quality_impacts_outcome_check" CHECK ("outcome_kind" IN ('published', 'partial_published', 'research_exhausted', 'failed', 'cancelled', 'needs_rebase'))
);
--> statement-breakpoint
CREATE INDEX "research_session_quality_impacts_org_created_idx" ON "research_session_quality_impacts" ("organization_id", "created_at");
