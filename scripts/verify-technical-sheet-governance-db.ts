import { randomUUID } from "node:crypto";
import { Pool } from "@neondatabase/serverless";
import "../services/api/env";
import { clearTechnicalSheetPrimary, revokeManualTechnicalSheetTag, setManualTechnicalSheetTag, setTechnicalSheetPrimary, transitionTechnicalSheetLifecycle } from "../services/api/technical-sheet-governance";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = await pool.connect();
const token = randomUUID().replaceAll("-", "");
const org = randomUUID(), otherOrg = randomUUID(), account = randomUUID(), member = randomUUID(), analyst = randomUUID(), vehicle = randomUUID(), first = randomUUID(), second = randomUUID();
const adminActor = { organizationId: org, accountId: account, memberId: member, email: `${token}@example.test`, displayName: "fixture", role: "admin" as const };
const analystActor = { ...adminActor, memberId: analyst, role: "analyst" as const };
try {
  await db.query("insert into organizations (id, display_name, cnpj_hash, status) values ($1,$2,$3,'active'),($4,$5,$6,'active')", [org, `gov-${token}`, `hash-${token}`, otherOrg, `other-${token}`, `other-${token}`]);
  await db.query("insert into accounts (id,email,status) values ($1,$2,'active')", [account, `${token}@example.test`]);
  for (const [id, role] of [[member, "admin"], [analyst, "analyst"]] as const) await db.query("insert into organization_members (id,organization_id,account_id,email,email_hash,display_name,role,status) values ($1,$2,$3,$4,$5,$6,$7,'active')", [id, org, account, `${id}@example.test`, `hash-${id}`, role, role]);
  await db.query("insert into vehicle_configurations (id,brand,model,trim,model_year,market,catalog_slug) values ($1,'Governance',$2,'Test',2099,'Brasil',$3)", [vehicle, token, `gov-${token}`]);
  await db.query("insert into technical_sheets (id,vehicle_configuration_id,organization_id,created_by_member_id,state,is_default) values ($1,$2,$3,$4,'active',false),($5,$2,$3,$4,'active',false)", [first, vehicle, org, member, second]);
  await setTechnicalSheetPrimary(first, "organization_reference", adminActor);
  await setTechnicalSheetPrimary(second, "reviewed_selection", adminActor);
  const activePrimary = await db.query("select technical_sheet_id from technical_sheet_primary_assignments where organization_id=$1 and vehicle_configuration_id=$2 and revoked_at is null", [org, vehicle]);
  if (activePrimary.rows.length !== 1 || activePrimary.rows[0].technical_sheet_id !== second) throw new Error("PRIMARY_REPLACEMENT=FAIL");
  await transitionTechnicalSheetLifecycle(second, "archived", "superseded_by_review", adminActor);
  const afterArchive = await db.query("select count(1)::int as count from technical_sheet_primary_assignments where technical_sheet_id=$1 and revoked_at is null", [second]);
  await transitionTechnicalSheetLifecycle(second, "active", "reactivated_after_review", adminActor);
  await setTechnicalSheetPrimary(first, "restore_previous_reference", adminActor);
  await setManualTechnicalSheetTag(first, "needs_review", adminActor);
  await revokeManualTechnicalSheetTag(first, "needs_review", adminActor);
  let analystDenied = false; try { await setTechnicalSheetPrimary(second, "organization_reference", analystActor); } catch (error) { analystDenied = (error as { statusCode?: number }).statusCode === 403; }
  const sheetStates = await db.query("select id,state from technical_sheets where id in ($1,$2) order by id", [first, second]);
  const lifecycle = await db.query("select count(1)::int as count from technical_sheet_lifecycle_events where technical_sheet_id=$1", [second]);
  const tags = await db.query("select count(1)::int as count from technical_sheet_tags where technical_sheet_id=$1 and revoked_at is not null", [first]);
  await clearTechnicalSheetPrimary(first, adminActor);
  if (afterArchive.rows[0]?.count !== 0 || !analystDenied || lifecycle.rows[0]?.count !== 2 || tags.rows[0]?.count !== 1 || sheetStates.rows.some((row) => row.state !== "active")) throw new Error("TECHNICAL_SHEET_GOVERNANCE=FAIL");
  console.log("TECHNICAL_SHEET_GOVERNANCE=PASS");
} finally {
  await db.query("delete from technical_sheet_primary_assignments where organization_id=$1", [org]).catch(() => undefined);
  await db.query("delete from technical_sheet_lifecycle_events where organization_id=$1", [org]).catch(() => undefined);
  await db.query("delete from technical_sheet_tags where organization_id=$1", [org]).catch(() => undefined);
  await db.query("delete from technical_sheets where organization_id=$1", [org]).catch(() => undefined);
  await db.query("delete from vehicle_configurations where id=$1", [vehicle]).catch(() => undefined);
  await db.query("delete from organization_members where organization_id=$1", [org]).catch(() => undefined);
  await db.query("delete from accounts where id=$1", [account]).catch(() => undefined);
  await db.query("delete from organizations where id in ($1,$2)", [org, otherOrg]).catch(() => undefined);
  db.release(); await pool.end();
}
