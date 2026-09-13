import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { Pool } from "@neondatabase/serverless";
import "../services/api/env";
import { persistTechnicalSheet } from "../services/api/db/repository";
import { readRuntimeMockResponse, readRuntimeSchema } from "../services/api/runtime-assets";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = await pool.connect();
const token = randomUUID().replaceAll("-", "");
const orgA = randomUUID(), orgB = randomUUID(), accountA = randomUUID(), accountB = randomUUID(), memberA = randomUUID(), memberB = randomUUID();
const vehicle = randomUUID(), inactiveSheet = randomUUID(), explicitInactiveSheet = randomUUID();
const actorA = { organizationId: orgA, accountId: accountA, memberId: memberA, email: `${token}-a@example.test`, displayName: "recovery fixture A", role: "analyst" as const };
const actorB = { organizationId: orgB, accountId: accountB, memberId: memberB, email: `${token}-b@example.test`, displayName: "recovery fixture B", role: "analyst" as const };
const [response, outputSchema] = await Promise.all([readRuntimeMockResponse(), readRuntimeSchema()]);

try {
  for (const [organization, account, member, actor] of [[orgA, accountA, memberA, actorA], [orgB, accountB, memberB, actorB]] as const) {
    await db.query("insert into organizations (id,display_name,cnpj_hash,status) values ($1,$2,$3,'active')", [organization, `recovery-${token}`, `hash-${organization}`]);
    await db.query("insert into accounts (id,email,status) values ($1,$2,'active')", [account, actor.email]);
    await db.query("insert into organization_members (id,organization_id,account_id,email,email_hash,display_name,role,status) values ($1,$2,$3,$4,$5,$6,'analyst','active')", [member, organization, account, actor.email, `email-${member}`, actor.displayName]);
  }
  await db.query("insert into vehicle_configurations (id,brand,model,trim,model_year,market,catalog_slug) values ($1,'Fixture',$2,'Recovery',2099,'Brasil',$3)", [vehicle, `Recovery-${token.slice(0, 12)}`, `recovery-${token}`]);
  await db.query("insert into technical_sheets (id,vehicle_configuration_id,organization_id,created_by_member_id,state,is_default) values ($1,$2,$3,$4,'archived',true),($5,$2,$3,$4,'archived',false)", [inactiveSheet, vehicle, orgA, memberA, explicitInactiveSheet]);
  const vehicleInput = { marca: "Fixture", modelo: `Recovery-${token.slice(0, 12)}`, versao: "Recovery", ano_modelo: 2099, mercado: "Brasil" };
  await persistTechnicalSheet({ requestId: `recovery-${token}`, provider: "simulated", vehicle: vehicleInput, response: response as any, outputSchema, finalPrompt: "fixture", actor: actorA, auditAction: "technical_sheet.generated" });
  const rows = await db.query("select id,state,is_default from technical_sheets where vehicle_configuration_id=$1 and organization_id=$2 order by id", [vehicle, orgA]);
  const activeDefaults = rows.rows.filter((row) => row.state === "active" && row.is_default === true);
  const oldSheet = rows.rows.find((row) => row.id === inactiveSheet);
  assert.equal(activeDefaults.length, 1);
  assert.equal(oldSheet?.is_default, false);
  await assert.rejects(() => persistTechnicalSheet({ requestId: `explicit-${token}`, provider: "simulated", vehicle: vehicleInput, response: response as any, outputSchema, finalPrompt: "fixture", actor: actorA, technicalSheetId: explicitInactiveSheet }), (error: { statusCode?: number }) => error.statusCode === 409);
  const otherTenant = await db.query("select count(1)::int as count from technical_sheets where vehicle_configuration_id=$1 and organization_id=$2", [vehicle, orgB]);
  assert.equal(otherTenant.rows[0]?.count, 0);
  console.log("INACTIVE_DEFAULT_SHEET_RECOVERY=PASS");
} finally {
  await db.query("delete from audit_events where organization_id in ($1,$2)", [orgA, orgB]).catch(() => undefined);
  await db.query("delete from usage_events where organization_id in ($1,$2)", [orgA, orgB]).catch(() => undefined);
  await db.query("delete from field_evidence where technical_sheet_version_id in (select id from technical_sheet_versions where technical_sheet_id in (select id from technical_sheets where organization_id in ($1,$2)))", [orgA, orgB]).catch(() => undefined);
  await db.query("delete from field_resolution_alternatives where field_resolution_id in (select id from field_resolutions where technical_sheet_version_id in (select id from technical_sheet_versions where technical_sheet_id in (select id from technical_sheets where organization_id in ($1,$2))))", [orgA, orgB]).catch(() => undefined);
  await db.query("delete from field_resolutions where technical_sheet_version_id in (select id from technical_sheet_versions where technical_sheet_id in (select id from technical_sheets where organization_id in ($1,$2)))", [orgA, orgB]).catch(() => undefined);
  await db.query("delete from technical_sheet_sources where technical_sheet_version_id in (select id from technical_sheet_versions where technical_sheet_id in (select id from technical_sheets where organization_id in ($1,$2)))", [orgA, orgB]).catch(() => undefined);
  await db.query("delete from technical_sheet_search_facets where technical_sheet_version_id in (select id from technical_sheet_versions where technical_sheet_id in (select id from technical_sheets where organization_id in ($1,$2)))", [orgA, orgB]).catch(() => undefined);
  await db.query("delete from technical_sheet_versions where technical_sheet_id in (select id from technical_sheets where organization_id in ($1,$2))", [orgA, orgB]).catch(() => undefined);
  await db.query("delete from collection_runs where technical_sheet_id in (select id from technical_sheets where organization_id in ($1,$2))", [orgA, orgB]).catch(() => undefined);
  await db.query("delete from technical_sheets where organization_id in ($1,$2)", [orgA, orgB]).catch(() => undefined);
  await db.query("delete from vehicle_configurations where id=$1", [vehicle]).catch(() => undefined);
  await db.query("delete from organization_members where id in ($1,$2)", [memberA, memberB]).catch(() => undefined);
  await db.query("delete from accounts where id in ($1,$2)", [accountA, accountB]).catch(() => undefined);
  await db.query("delete from organizations where id in ($1,$2)", [orgA, orgB]).catch(() => undefined);
  db.release();
  await pool.end();
}
