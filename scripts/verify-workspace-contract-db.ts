import { randomUUID } from "node:crypto";
import { Pool } from "@neondatabase/serverless";
import "../services/api/env";
import { createWorkspaceSheet, readVehicleWorkspace } from "../services/api/db/repository";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const client = await pool.connect();
const suffix = randomUUID().replaceAll("-", "");
const organizationA = randomUUID();
const accountA = randomUUID();
const memberA = randomUUID();
const organizationB = randomUUID();
const accountB = randomUUID();
const memberB = randomUUID();
const vehicle = randomUUID();
let sheetId: string | null = null;

const actorA = { organizationId: organizationA, accountId: accountA, memberId: memberA, email: `${suffix}-a@example.test`, displayName: "fixture A", role: "analyst" as const };
const actorB = { organizationId: organizationB, accountId: accountB, memberId: memberB, email: `${suffix}-b@example.test`, displayName: "fixture B", role: "analyst" as const };

try {
  for (const [organization, account, member, email] of [[organizationA, accountA, memberA, actorA.email], [organizationB, accountB, memberB, actorB.email]] as const) {
    await client.query("insert into organizations (id, display_name, cnpj_hash, status) values ($1,$2,$3,'active')", [organization, `workspace-${suffix}`, `cnpj-${organization}`]);
    await client.query("insert into accounts (id, email, status) values ($1,$2,'active')", [account, email]);
    await client.query("insert into organization_members (id, organization_id, account_id, email, email_hash, display_name, role, status) values ($1,$2,$3,$4,$5,'fixture','analyst','active')", [member, organization, account, email, `email-${member}`]);
  }
  await client.query("insert into vehicle_configurations (id, brand, model, trim, model_year, market, catalog_slug) values ($1,'Fixture','Workspace','Sem Revisao',2099,'Brasil',$2)", [vehicle, `workspace-${suffix}`]);

  const before = await readVehicleWorkspace(vehicle, actorA) as { sheets: unknown[] };
  const created = await createWorkspaceSheet(vehicle, actorA);
  sheetId = created.id;
  const workspaceA = await readVehicleWorkspace(vehicle, actorA) as { vehicle: { id: string }; sheets: Array<{ id: string; latest_revision: unknown }> };
  const workspaceB = await readVehicleWorkspace(vehicle, actorB) as { sheets: unknown[] };

  if (before.sheets.length !== 0 || created.vehicle_configuration_id !== vehicle || workspaceA.vehicle.id !== vehicle || workspaceA.sheets.length !== 1 || workspaceA.sheets[0]?.id !== created.id || workspaceA.sheets[0]?.latest_revision !== null || workspaceB.sheets.length !== 0) throw new Error("WORKSPACE_DB_CONTRACT=FAIL");
  console.log("WORKSPACE_DB_CONTRACT=PASS");
} finally {
  if (sheetId) await client.query("delete from technical_sheets where id=$1", [sheetId]).catch(() => undefined);
  await client.query("delete from vehicle_configurations where id=$1", [vehicle]).catch(() => undefined);
  for (const [organization, account, member] of [[organizationA, accountA, memberA], [organizationB, accountB, memberB]] as const) {
    await client.query("delete from organization_members where id=$1", [member]).catch(() => undefined);
    await client.query("delete from accounts where id=$1", [account]).catch(() => undefined);
    await client.query("delete from organizations where id=$1", [organization]).catch(() => undefined);
  }
  client.release();
  await pool.end();
}
