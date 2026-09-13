ALTER TABLE "research_sessions" ADD COLUMN "research_plan_version" text NOT NULL DEFAULT 'legacy';
--> statement-breakpoint
ALTER TABLE "research_sessions" ADD COLUMN "research_plan" jsonb NOT NULL DEFAULT '{"version":"legacy","tasks":[],"source_strategy":"legacy"}'::jsonb;
--> statement-breakpoint
CREATE TABLE "research_session_tasks" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "research_session_id" uuid NOT NULL REFERENCES "research_sessions"("id"),
  "sequence_number" integer NOT NULL,
  "kind" text NOT NULL,
  "target_paths" jsonb NOT NULL,
  "source_strategy" text NOT NULL,
  "official_domains" jsonb NOT NULL,
  "allowed_source_types" jsonb NOT NULL,
  "provider_call_budget" integer NOT NULL,
  "provider_calls_used" integer NOT NULL DEFAULT 0,
  "state" text NOT NULL DEFAULT 'queued',
  "stop_reason" text,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "started_at" timestamptz,
  "finished_at" timestamptz,
  CONSTRAINT "research_session_tasks_sequence_key" UNIQUE("research_session_id", "sequence_number"),
  CONSTRAINT "research_session_tasks_state_check" CHECK ("state" IN ('queued', 'running', 'succeeded', 'partial', 'failed', 'cancelled', 'needs_rebase', 'research_exhausted')),
  CONSTRAINT "research_session_tasks_strategy_check" CHECK ("source_strategy" IN ('evidence_aware', 'official_only')),
  CONSTRAINT "research_session_tasks_budget_check" CHECK ("provider_call_budget" >= 0 AND "provider_calls_used" >= 0 AND "provider_calls_used" <= "provider_call_budget")
);
--> statement-breakpoint
CREATE INDEX "research_session_tasks_session_sequence_idx" ON "research_session_tasks" ("research_session_id", "sequence_number");
