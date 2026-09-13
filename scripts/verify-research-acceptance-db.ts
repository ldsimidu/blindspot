import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { Pool } from "@neondatabase/serverless";
import "../services/api/env";
import { cancelResearchSession, createResearchSession, executeResearchSession } from "../services/api/research-sessions";
import { readResearchSessionHistory } from "../services/api/research-session-history";
import { readRuntimeMockResponse } from "../services/api/runtime-assets";
import { readVehicleWorkspace } from "../services/api/db/repository";
import { setTechnicalSheetPrimary } from "../services/api/technical-sheet-governance";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = await pool.connect();
const token = randomUUID().replaceAll("-", "");
const orgA = randomUUID(), orgB = randomUUID(), accountA = randomUUID(), accountB = randomUUID(), memberA = randomUUID(), memberB = randomUUID();
const vehicle = randomUUID(), contract = randomUUID(), sheetA = randomUUID(), siblingSheet = randomUUID(), sheetB = randomUUID();
const runA = randomUUID(), runSibling = randomUUID(), runB = randomUUID(), versionA = randomUUID(), versionSibling = randomUUID(), versionB = randomUUID();
const actorA = { organizationId: orgA, accountId: accountA, memberId: memberA, email: `${token}-a@example.test`, displayName: "aceite fixture A", role: "admin" as const };
const actorB = { organizationId: orgB, accountId: accountB, memberId: memberB, email: `${token}-b@example.test`, displayName: "aceite fixture B", role: "admin" as const };

try {
  for (const [organization, account, member, actor] of [[orgA, accountA, memberA, actorA], [orgB, accountB, memberB, actorB]] as const) {
    await db.query("insert into organizations (id,display_name,cnpj_hash,status) values ($1,$2,$3,'active')", [organization, `acceptance-${token}`, `hash-${organization}`]);
    await db.query("insert into accounts (id,email,status) values ($1,$2,'active')", [account, actor.email]);
    await db.query("insert into organization_members (id,organization_id,account_id,email,email_hash,display_name,role,status) values ($1,$2,$3,$4,$5,$6,'admin','active')", [member, organization, account, actor.email, `email-${member}`, actor.displayName]);
  }
  await db.query("insert into vehicle_configurations (id,brand,model,trim,model_year,market,catalog_slug) values ($1,'BYD',$2,'Fixture Simulado',2099,'Brasil',$3)", [vehicle, `Aceite-${token.slice(0, 12)}`, `acceptance-${token}`]);
  await db.query("insert into schema_contracts (id,sha256,runtime_asset_path) values ($1,$2,'fixture')", [contract, `contract-${token}`]);
  await db.query("insert into technical_sheets (id,vehicle_configuration_id,organization_id,created_by_member_id,state,is_default) values ($1,$2,$3,$4,'active',false),($5,$2,$3,$4,'active',false),($6,$2,$7,$8,'active',false)", [sheetA, vehicle, orgA, memberA, siblingSheet, sheetB, orgB, memberB]);
  const payload = JSON.stringify(await readRuntimeMockResponse());
  await db.query("insert into collection_runs (id,request_id,vehicle_configuration_id,technical_sheet_id,organization_id,account_id,member_id,provider,model_name,status,schema_contract_id,prompt_sha256,started_at,finished_at) values ($1,$2,$3,$4,$5,$6,$7,'simulated','fixture','succeeded',$8,'fixture',now(),now()),($9,$10,$3,$11,$5,$6,$7,'simulated','fixture','succeeded',$8,'fixture',now(),now()),($12,$13,$3,$14,$15,$16,$17,'simulated','fixture','succeeded',$8,'fixture',now(),now())", [runA, `run-a-${token}`, vehicle, sheetA, orgA, accountA, memberA, contract, runSibling, `run-s-${token}`, siblingSheet, runB, `run-b-${token}`, sheetB, orgB, accountB, memberB]);
  await db.query("insert into technical_sheet_versions (id,collection_run_id,technical_sheet_id,vehicle_configuration_id,schema_contract_id,version_number,payload,completeness_summary,payload_sha256) values ($1,$2,$3,$4,$5,1,$6,'{}','fixture'),($7,$8,$9,$4,$5,1,$6,'{}','fixture'),($10,$11,$12,$4,$5,1,$6,'{}','fixture')", [versionA, runA, sheetA, vehicle, contract, payload, versionSibling, runSibling, siblingSheet, versionB, runB, sheetB]);

  const focused = await createResearchSession({ sheetId: sheetA, idempotencyKey: `focused-${token}`, focus: "VARIABLES", variables: ["motorizacao.potencia_cv"], actor: actorA, requestId: `focused-${token}` });
  const executed = await executeResearchSession(focused.id, actorA, `execute-${token}`);
  assert.equal(executed.state, "partial", "simulated focused research must publish a partial, reviewable result");

  const cancellable = await createResearchSession({ sheetId: sheetA, idempotencyKey: `cancel-${token}`, focus: "VARIABLES", variables: ["motorizacao.torque_nm"], actor: actorA, requestId: `cancel-${token}` });
  assert.deepEqual(await cancelResearchSession(cancellable.id, actorA), { id: cancellable.id, state: "cancelled" });

  const exhausted = await createResearchSession({ sheetId: sheetA, idempotencyKey: `exhausted-${token}`, focus: "VARIABLES", variables: ["nao.existe"], actor: actorA, requestId: `exhausted-${token}` });
  assert.equal(exhausted.state, "research_exhausted");

  await setTechnicalSheetPrimary(sheetA, "reviewed_selection", actorA);
  const workspaceA = await readVehicleWorkspace(vehicle, actorA) as { latest_kind: string; recommended: { state: string }; primary: { technical_sheet_id: string } | null; sheets: Array<{ id: string; latest_revision: { number: number } | null }> };
  const workspaceB = await readVehicleWorkspace(vehicle, actorB) as { sheets: Array<{ id: string }> };
  assert.equal(workspaceA.latest_kind, "temporal");
  assert.equal(workspaceA.recommended.state, "not_available");
  assert.equal(workspaceA.primary?.technical_sheet_id, sheetA);
  assert.deepEqual(new Set(workspaceA.sheets.map((sheet) => sheet.id)), new Set([sheetA, siblingSheet]));
  assert.deepEqual(workspaceB.sheets.map((sheet) => sheet.id), [sheetB]);
  assert.equal(workspaceA.sheets.find((sheet) => sheet.id === siblingSheet)?.latest_revision?.number, 1, "one sheet cannot alter its sibling revision");

  const history = await readResearchSessionHistory(focused.id, actorA) as { events: Array<{ sequence: number; type: string; metadata: unknown }> };
  assert.equal(history.events.length >= 5, true);
  assert.deepEqual(history.events.map((event) => event.sequence), history.events.map((_, index) => index + 1));
  assert.equal(history.events.some((event) => event.type === "revision_published"), true);
  assert.equal(/https?:|prompt|raw|token/i.test(JSON.stringify(history)), false, "history must remain sanitized");
  await assert.rejects(() => readResearchSessionHistory(focused.id, actorB), (error: { statusCode?: number }) => error.statusCode === 404);

  console.log("RESEARCH_ACCEPTANCE_DB=PASS");
} finally {
  await db.query("delete from research_session_events where organization_id in ($1,$2)", [orgA, orgB]).catch(() => undefined);
  await db.query("delete from research_session_quality_impacts where organization_id in ($1,$2)", [orgA, orgB]).catch(() => undefined);
  await db.query("delete from field_research_states where technical_sheet_id in ($1,$2,$3)", [sheetA, siblingSheet, sheetB]).catch(() => undefined);
  await db.query("delete from research_session_tasks where research_session_id in (select id from research_sessions where organization_id in ($1,$2))", [orgA, orgB]).catch(() => undefined);
  await db.query("delete from research_sessions where organization_id in ($1,$2)", [orgA, orgB]).catch(() => undefined);
  await db.query("delete from research_session_quality_impacts where organization_id in ($1,$2)", [orgA, orgB]).catch(() => undefined);
  await db.query("delete from technical_sheet_primary_assignments where organization_id in ($1,$2)", [orgA, orgB]).catch(() => undefined);
  await db.query("delete from audit_events where organization_id in ($1,$2)", [orgA, orgB]).catch(() => undefined);
  await db.query("delete from usage_events where organization_id in ($1,$2)", [orgA, orgB]).catch(() => undefined);
  await db.query("delete from field_evidence where technical_sheet_version_id in ($1,$2,$3)", [versionA, versionSibling, versionB]).catch(() => undefined);
  await db.query("delete from field_resolution_alternatives where field_resolution_id in (select id from field_resolutions where technical_sheet_version_id in ($1,$2,$3))", [versionA, versionSibling, versionB]).catch(() => undefined);
  await db.query("delete from field_resolutions where technical_sheet_version_id in ($1,$2,$3)", [versionA, versionSibling, versionB]).catch(() => undefined);
  await db.query("delete from technical_sheet_sources where technical_sheet_version_id in (select id from technical_sheet_versions where technical_sheet_id in ($1,$2,$3))", [sheetA, siblingSheet, sheetB]).catch(() => undefined);
  await db.query("delete from technical_sheet_search_facets where technical_sheet_version_id in (select id from technical_sheet_versions where technical_sheet_id in ($1,$2,$3))", [sheetA, siblingSheet, sheetB]).catch(() => undefined);
  await db.query("delete from technical_sheet_versions where technical_sheet_id in ($1,$2,$3)", [sheetA, siblingSheet, sheetB]).catch(() => undefined);
  await db.query("delete from collection_runs where technical_sheet_id in ($1,$2,$3)", [sheetA, siblingSheet, sheetB]).catch(() => undefined);
  await db.query("delete from technical_sheets where id in ($1,$2,$3)", [sheetA, siblingSheet, sheetB]).catch(() => undefined);
  await db.query("delete from vehicle_configurations where id=$1", [vehicle]).catch(() => undefined);
  await db.query("delete from schema_contracts where id=$1", [contract]).catch(() => undefined);
  await db.query("delete from organization_members where id in ($1,$2)", [memberA, memberB]).catch(() => undefined);
  await db.query("delete from accounts where id in ($1,$2)", [accountA, accountB]).catch(() => undefined);
  await db.query("delete from organizations where id in ($1,$2)", [orgA, orgB]).catch(() => undefined);
  db.release();
  await pool.end();
}
