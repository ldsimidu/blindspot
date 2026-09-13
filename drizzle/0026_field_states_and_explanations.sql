ALTER TABLE "field_resolutions" ADD COLUMN "state_version" text NOT NULL DEFAULT 'legacy';
--> statement-breakpoint
ALTER TABLE "field_resolutions" ADD COLUMN "resolution_state" text NOT NULL DEFAULT 'unknown';
--> statement-breakpoint
ALTER TABLE "field_resolutions" ADD COLUMN "explanation_reasons" jsonb NOT NULL DEFAULT '[]'::jsonb;
--> statement-breakpoint
UPDATE "field_resolutions" SET "resolution_state" = CASE "status"
  WHEN 'confirmado' THEN 'confirmed' WHEN 'parcial' THEN 'partial' WHEN 'inferido_minimamente' THEN 'inferred'
  WHEN 'informado_na_entrada' THEN 'user_provided' WHEN 'nao_encontrado' THEN 'not_found'
  WHEN 'nao_aplicavel' THEN 'not_applicable' WHEN 'conflitante' THEN 'conflicting' ELSE 'unknown' END,
  "explanation_reasons" = CASE WHEN "status" = 'conflitante' THEN '["legacy_conflict_without_alternatives"]'::jsonb ELSE '["legacy_status_mapping"]'::jsonb END;
--> statement-breakpoint
CREATE INDEX "field_resolutions_version_state_idx" ON "field_resolutions" ("technical_sheet_version_id", "resolution_state");
--> statement-breakpoint
CREATE TABLE "field_resolution_alternatives" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "field_resolution_id" uuid NOT NULL REFERENCES "field_resolutions"("id"),
  "ordinal" integer NOT NULL,
  "value" jsonb NOT NULL,
  "evidence_refs" jsonb NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT "field_resolution_alternatives_ordinal_key" UNIQUE("field_resolution_id", "ordinal")
);
--> statement-breakpoint
CREATE INDEX "field_resolution_alternatives_resolution_idx" ON "field_resolution_alternatives" ("field_resolution_id");
--> statement-breakpoint
CREATE TABLE "field_research_states" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "research_session_id" uuid NOT NULL REFERENCES "research_sessions"("id"),
  "technical_sheet_id" uuid NOT NULL REFERENCES "technical_sheets"("id"),
  "base_revision_id" uuid NOT NULL REFERENCES "technical_sheet_versions"("id"),
  "path" text NOT NULL,
  "state_version" text NOT NULL,
  "state" text NOT NULL,
  "reason_code" text NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT "field_research_states_session_path_key" UNIQUE("research_session_id", "path"),
  CONSTRAINT "field_research_states_state_check" CHECK ("state" IN ('research_exhausted', 'pending', 'blocked'))
);
--> statement-breakpoint
CREATE INDEX "field_research_states_sheet_revision_path_idx" ON "field_research_states" ("technical_sheet_id", "base_revision_id", "path");
