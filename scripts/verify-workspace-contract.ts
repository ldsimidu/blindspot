import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const [repository, sessions, api, audit] = await Promise.all([
  readFile(new URL("services/api/db/repository.ts", root), "utf8"),
  readFile(new URL("services/api/research-sessions.ts", root), "utf8"),
  readFile(new URL("services/api/index.ts", root), "utf8"),
  readFile(new URL("services/api/audit.ts", root), "utf8")
]);

const checks: Array<[string, boolean]> = [
  ["workspace versioned", repository.includes('workspace_contract_version: "vehicle-workspace-v2"')],
  ["empty sheets retained", repository.includes("const sheets = await db.select") && !repository.includes("leftJoin(technicalSheetVersions, eq(technicalSheetVersions.technicalSheetId, technicalSheets.id)).innerJoin(collectionRuns")],
  ["tenant-scoped versions", repository.includes("eq(collectionRuns.organizationId, actor.organizationId)")],
  ["workspace actions server-owned", repository.includes("available_actions: { create_sheet: canWrite, continue_research: canWrite }")],
  ["creation response locates workspace", repository.includes("vehicle_configuration_id: vehicle.id")],
  ["creation audited", api.includes('action: "technical_sheet.created"') && audit.includes('"technical_sheet.created"')],
  ["execution response locates workspace", sessions.includes("technical_sheet_id: session.session.technicalSheetId") && sessions.includes("vehicle_configuration_id: session.vehicle.id")]
];

const failed = checks.filter(([, ok]) => !ok).map(([name]) => name);
if (failed.length) throw new Error(`WORKSPACE_CONTRACT=FAIL: ${failed.join(", ")}`);
console.log("WORKSPACE_CONTRACT=PASS");
