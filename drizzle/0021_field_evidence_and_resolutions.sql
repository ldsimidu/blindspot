CREATE TABLE "field_evidence" ("id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL, "technical_sheet_version_id" uuid NOT NULL REFERENCES "technical_sheet_versions"("id"), "source_id" uuid NOT NULL REFERENCES "sources"("id"), "source_ref" text NOT NULL, "path" text NOT NULL, "observation_method" text NOT NULL, "observed_at" timestamptz NOT NULL, "created_at" timestamptz DEFAULT now() NOT NULL);
--> statement-breakpoint
CREATE UNIQUE INDEX "field_evidence_version_path_ref_key" ON "field_evidence" ("technical_sheet_version_id","path","source_ref");
--> statement-breakpoint
CREATE INDEX "field_evidence_version_path_idx" ON "field_evidence" ("technical_sheet_version_id","path");
--> statement-breakpoint
CREATE TABLE "field_resolutions" ("id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL, "technical_sheet_version_id" uuid NOT NULL REFERENCES "technical_sheet_versions"("id"), "path" text NOT NULL, "value" jsonb, "status" text NOT NULL, "evidence_refs" jsonb NOT NULL, "resolution_kind" text NOT NULL, "created_at" timestamptz DEFAULT now() NOT NULL);
--> statement-breakpoint
CREATE UNIQUE INDEX "field_resolutions_version_path_key" ON "field_resolutions" ("technical_sheet_version_id","path");
--> statement-breakpoint
INSERT INTO "field_resolutions" ("technical_sheet_version_id","path","value","status","evidence_refs","resolution_kind") SELECT v.id, g.key || '.' || f.key, f.value->'valor', coalesce(f.value->>'status','unknown'), coalesce(f.value->'fonte_ref','[]'::jsonb), CASE WHEN f.value->>'status'='conflitante' THEN 'conflict_preserved' WHEN f.value->>'status' IN ('nao_encontrado','nao_aplicavel') THEN 'unknown_preserved' ELSE 'published' END FROM "technical_sheet_versions" v CROSS JOIN LATERAL jsonb_each(v.payload->'ficha_tecnica') g CROSS JOIN LATERAL jsonb_each(g.value) f WHERE f.value ? 'status' ON CONFLICT DO NOTHING;
--> statement-breakpoint
INSERT INTO "field_evidence" ("technical_sheet_version_id","source_id","source_ref","path","observation_method","observed_at") SELECT v.id, ts.source_id, ts.source_ref, g.key || '.' || f.key, 'payload_backfill', v.created_at FROM "technical_sheet_versions" v CROSS JOIN LATERAL jsonb_each(v.payload->'ficha_tecnica') g CROSS JOIN LATERAL jsonb_each(g.value) f CROSS JOIN LATERAL jsonb_array_elements_text(coalesce(f.value->'fonte_ref','[]'::jsonb)) ref(source_ref) JOIN "technical_sheet_sources" ts ON ts.technical_sheet_version_id=v.id AND ts.source_ref=ref.source_ref WHERE f.value ? 'status' ON CONFLICT DO NOTHING;
