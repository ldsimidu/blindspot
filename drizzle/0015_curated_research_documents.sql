CREATE TABLE "curated_research_documents" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "vehicle_configuration_id" uuid NOT NULL REFERENCES "vehicle_configurations"("id"),
  "canonical_url" text NOT NULL,
  "source_hostname" text NOT NULL,
  "title" text NOT NULL,
  "document_type" text NOT NULL,
  "binary_sha256" text NOT NULL,
  "content_sha256" text NOT NULL,
  "extracted_pages" jsonb,
  "page_count" integer NOT NULL,
  "extraction_version" text NOT NULL,
  "state" text DEFAULT 'pending_review' NOT NULL,
  "adherence_status" text,
  "authority_basis" text,
  "uploaded_by_account_id" uuid NOT NULL REFERENCES "accounts"("id"),
  "uploaded_by_member_id" uuid NOT NULL REFERENCES "organization_members"("id"),
  "reviewed_by_account_id" uuid REFERENCES "accounts"("id"),
  "reviewed_by_member_id" uuid REFERENCES "organization_members"("id"),
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "reviewed_at" timestamp with time zone,
  "retired_at" timestamp with time zone,
  "content_purge_at" timestamp with time zone,
  "idempotency_key_hash" text NOT NULL UNIQUE,
  CONSTRAINT "curated_research_documents_vehicle_binary_key" UNIQUE("vehicle_configuration_id", "binary_sha256"),
  CONSTRAINT "curated_research_documents_state_check" CHECK ("state" IN ('pending_review','approved','rejected','retired')),
  CONSTRAINT "curated_research_documents_type_check" CHECK ("document_type" IN ('ficha_tecnica','catalogo_ou_brochura','manual_ou_documento_tecnico')),
  CONSTRAINT "curated_research_documents_review_check" CHECK ("state" = 'pending_review' OR "reviewed_at" IS NOT NULL),
  CONSTRAINT "curated_research_documents_approved_check" CHECK ("state" <> 'approved' OR ("extracted_pages" IS NOT NULL AND "adherence_status" IN ('exata','compativel') AND "authority_basis" IS NOT NULL))
);
--> statement-breakpoint
CREATE INDEX "curated_research_documents_vehicle_state_idx" ON "curated_research_documents" USING btree ("vehicle_configuration_id", "state", "created_at");
--> statement-breakpoint
CREATE INDEX "curated_research_documents_state_purge_idx" ON "curated_research_documents" USING btree ("state", "content_purge_at");
