CREATE TABLE "research_session_events" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "research_session_id" uuid NOT NULL REFERENCES "research_sessions"("id"),
  "organization_id" uuid NOT NULL REFERENCES "organizations"("id"),
  "sequence_number" integer NOT NULL,
  "event_type" text NOT NULL,
  "correlation_id" text NOT NULL,
  "metadata" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "expires_at" timestamptz NOT NULL,
  CONSTRAINT "research_session_events_type_check" CHECK ("event_type" IN ('session_planned', 'execution_started', 'task_started', 'task_finished', 'session_cancelled', 'session_exhausted', 'session_failed', 'revision_published', 'impact_recorded')),
  CONSTRAINT "research_session_events_metadata_object_check" CHECK (jsonb_typeof("metadata") = 'object')
);
--> statement-breakpoint
CREATE UNIQUE INDEX "research_session_events_session_sequence_key" ON "research_session_events" ("research_session_id", "sequence_number");
--> statement-breakpoint
CREATE INDEX "research_session_events_org_created_idx" ON "research_session_events" ("organization_id", "created_at");
--> statement-breakpoint
CREATE INDEX "research_session_events_expiry_idx" ON "research_session_events" ("expires_at");
