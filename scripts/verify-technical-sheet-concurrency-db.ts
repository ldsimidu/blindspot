import { randomUUID } from "node:crypto";
import { Pool } from "@neondatabase/serverless";
import "../services/api/env";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const a = await pool.connect(); const b = await pool.connect();
const token = randomUUID().replaceAll("-", ""); const organization = randomUUID(); const vehicle = randomUUID();
try {
  await a.query("insert into organizations (id, display_name, cnpj_hash, status) values ($1, $2, $3, 'active')", [organization, `concurrency-${token}`, `hash-${token}`]);
  await a.query("insert into vehicle_configurations (id, brand, model, trim, model_year, market, catalog_slug) values ($1, 'Fixture', 'Concurrency', 'Test', 2099, 'Brasil', $2)", [vehicle, `concurrency-${token}`]);
  await a.query("begin"); await b.query("begin");
  const first = await a.query("insert into technical_sheets (vehicle_configuration_id, organization_id, state, is_default) values ($1, $2, 'active', true) on conflict do nothing returning id", [vehicle, organization]);
  const secondPromise = b.query("insert into technical_sheets (vehicle_configuration_id, organization_id, state, is_default) values ($1, $2, 'active', true) on conflict do nothing returning id", [vehicle, organization]);
  await a.query("commit");
  const second = await secondPromise; await b.query("commit");
  const count = await a.query("select count(1)::int as count from technical_sheets where vehicle_configuration_id = $1 and organization_id = $2 and state = 'active' and is_default = true", [vehicle, organization]);
  const derived = await a.query("insert into technical_sheets (vehicle_configuration_id, organization_id, state, is_default) values ($1, $2, 'active', false) returning id", [vehicle, organization]);
  const activeCount = await a.query("select count(1)::int as count from technical_sheets where vehicle_configuration_id = $1 and organization_id = $2 and state = 'active'", [vehicle, organization]);
  if (first.rowCount !== 1 || second.rowCount !== 0 || count.rows[0].count !== 1 || derived.rowCount !== 1 || activeCount.rows[0].count !== 2) throw new Error("SHEET_CONCURRENCY=FAIL");
  console.log("SHEET_CONCURRENCY=PASS");
} finally {
  await a.query("rollback").catch(() => undefined); await b.query("rollback").catch(() => undefined);
  await a.query("delete from technical_sheets where vehicle_configuration_id = $1", [vehicle]).catch(() => undefined);
  await a.query("delete from vehicle_configurations where id = $1", [vehicle]).catch(() => undefined);
  await a.query("delete from organizations where id = $1", [organization]).catch(() => undefined);
  a.release(); b.release(); await pool.end();
}
