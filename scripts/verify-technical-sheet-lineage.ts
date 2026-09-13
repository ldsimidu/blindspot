import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const schema = await read("services/api/db/schema.ts");
const repository = await read("services/api/db/repository.ts");
const migration = await read("drizzle/0017_technical_sheets_lineage.sql");
const defaultScopeMigration = await read("drizzle/0019_technical_sheets_default_scope.sql");
const revisionMigration = await read("drizzle/0023_sheet_revision_sequence_and_session_trace.sql");
const journal = await read("drizzle/meta/_journal.json");

const checks: Array<[string, boolean]> = [
  ["technical_sheets schema", schema.includes('pgTable("technical_sheets"')],
  ["versions retain public id and add sheet link", schema.includes('id: uuid("id").defaultRandom().primaryKey()') && schema.includes('technicalSheetId: uuid("technical_sheet_id")')],
  ["runs add sheet link", schema.includes('collectionRuns') && schema.includes('technicalSheetId: uuid("technical_sheet_id").references(() => technicalSheets.id)')],
  ["migration backfills by vehicle and organization", migration.includes('INSERT INTO "technical_sheets"') && migration.includes('r."organization_id"')],
  ["migration isolates unassigned legacy", migration.includes("legacy_unassigned")],
  ["migration preserves version ids", !migration.includes('DROP TABLE "technical_sheet_versions"') && !migration.includes('ALTER TABLE "technical_sheet_versions" RENAME')],
  ["migration journaled", journal.includes('0017_technical_sheets_lineage')],
  ["default sheet permits independent active sheets", schema.includes('isDefault: boolean("is_default")') && defaultScopeMigration.includes('"is_default" = true') && defaultScopeMigration.includes('DROP INDEX "technical_sheets_active_scope_key"') && journal.includes('0019_technical_sheets_default_scope')],
  ["revision sequence is local to sheet", schema.includes('unique("technical_sheet_versions_sheet_version_key").on(t.technicalSheetId, t.versionNumber)') && revisionMigration.includes('DROP CONSTRAINT "technical_sheet_versions_vehicle_version_key"') && revisionMigration.includes('UNIQUE("technical_sheet_id", "version_number")') && journal.includes('0023_sheet_revision_sequence_and_session_trace')],
  ["publication locks the target sheet", repository.includes('for update') && repository.includes('eq(technicalSheetVersions.technicalSheetId, technicalSheet.id)')],
  ["session trace is versioned and bounded", schema.includes('runtimeContractVersion: text("runtime_contract_version")') && schema.includes('stopReason: text("stop_reason")') && revisionMigration.includes('research_sessions_state_check')],
  ["writes derive default sheet from actor organization", repository.includes('eq(technicalSheets.organizationId, input.actor.organizationId)') && repository.includes('eq(technicalSheets.isDefault, true)') && repository.includes('technicalSheetId: technicalSheet.id')],
  ["latest is tenant scoped", repository.includes('readLatestTechnicalSheet(actor: AuthContext)') && repository.includes('eq(collectionRuns.organizationId, actor.organizationId)')],
  ["history is tenant scoped", repository.includes('readTechnicalSheetHistory(limit: number, actor: AuthContext)')],
  ["export is tenant scoped", repository.includes('readTechnicalSheetExport(versionId: string, actor: AuthContext)')]
];

const failed = checks.filter(([, ok]) => !ok).map(([name]) => name);
if (failed.length > 0) throw new Error(`LINEAGE_CONTRACT=FAIL: ${failed.join(", ")}`);
console.log("LINEAGE_CONTRACT=PASS");

async function read(path: string): Promise<string> {
  return readFile(new URL(path, root), "utf8");
}
