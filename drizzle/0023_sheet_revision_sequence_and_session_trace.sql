ALTER TABLE "technical_sheet_versions" DROP CONSTRAINT "technical_sheet_versions_vehicle_version_key";
--> statement-breakpoint
ALTER TABLE "technical_sheet_versions" ALTER COLUMN "technical_sheet_id" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "technical_sheet_versions" ADD CONSTRAINT "technical_sheet_versions_sheet_version_key" UNIQUE("technical_sheet_id", "version_number");
--> statement-breakpoint
ALTER TABLE "research_sessions" ADD COLUMN "runtime_contract_version" text NOT NULL DEFAULT 'legacy';
--> statement-breakpoint
ALTER TABLE "research_sessions" ADD COLUMN "stop_reason" text;
--> statement-breakpoint
ALTER TABLE "research_sessions" ADD CONSTRAINT "research_sessions_state_check" CHECK ("state" IN ('queued', 'running', 'succeeded', 'partial', 'failed', 'cancelled', 'needs_rebase', 'research_exhausted'));
