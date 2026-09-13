import { randomUUID } from "node:crypto";
import { Pool } from "@neondatabase/serverless";
import "../services/api/env";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const client = await pool.connect();
const token = randomUUID().replaceAll("-", "");

try {
  await client.query("BEGIN");
  const orgA = randomUUID(); const orgB = randomUUID(); const vehicle = randomUUID(); const contract = randomUUID();
  const sheetA = randomUUID(); const sheetB = randomUUID(); const runA = randomUUID(); const runB = randomUUID();
  const versionA = randomUUID(); const versionB = randomUUID();
  await client.query("insert into organizations (id, display_name, cnpj_hash, status) values ($1, $2, $3, 'active'), ($4, $5, $6, 'active')", [orgA, `lineage-a-${token}`, `hash-a-${token}`, orgB, `lineage-b-${token}`, `hash-b-${token}`]);
  await client.query("insert into vehicle_configurations (id, brand, model, trim, model_year, market, catalog_slug) values ($1, 'Fixture', 'Lineage', 'Test', 2099, 'Brasil', $2)", [vehicle, `lineage-${token}`]);
  await client.query("insert into schema_contracts (id, sha256, runtime_asset_path) values ($1, $2, 'fixture')", [contract, `schema-${token}`]);
  await client.query("insert into technical_sheets (id, vehicle_configuration_id, organization_id, state) values ($1, $2, $3, 'active'), ($4, $2, $5, 'active')", [sheetA, vehicle, orgA, sheetB, orgB]);
  await client.query("insert into collection_runs (id, request_id, vehicle_configuration_id, technical_sheet_id, organization_id, provider, model_name, status, schema_contract_id, prompt_sha256, started_at, finished_at) values ($1, $2, $3, $4, $5, 'simulated', 'fixture', 'succeeded', $6, $7, now(), now()), ($8, $9, $3, $10, $11, 'simulated', 'fixture', 'succeeded', $6, $12, now(), now())", [runA, `run-a-${token}`, vehicle, sheetA, orgA, contract, `prompt-a-${token}`, runB, `run-b-${token}`, sheetB, orgB, `prompt-b-${token}`]);
  await client.query("insert into technical_sheet_versions (id, collection_run_id, technical_sheet_id, vehicle_configuration_id, schema_contract_id, version_number, payload, completeness_summary, payload_sha256) values ($1, $2, $3, $4, $5, 1, '{}'::jsonb, '{}'::jsonb, $6), ($7, $8, $9, $4, $5, 2, '{}'::jsonb, '{}'::jsonb, $10)", [versionA, runA, sheetA, vehicle, contract, `payload-a-${token}`, versionB, runB, sheetB, `payload-b-${token}`]);
  const a = await client.query("select count(1)::int as count from technical_sheet_versions v inner join collection_runs r on r.id = v.collection_run_id where r.organization_id = $1", [orgA]);
  const b = await client.query("select count(1)::int as count from technical_sheet_versions v inner join collection_runs r on r.id = v.collection_run_id where r.organization_id = $1", [orgB]);
  const cross = await client.query("select count(1)::int as count from technical_sheet_versions v inner join collection_runs r on r.id = v.collection_run_id where v.id = $1 and r.organization_id = $2", [versionA, orgB]);
  if (a.rows[0].count !== 1 || b.rows[0].count !== 1 || cross.rows[0].count !== 0) throw new Error("TENANT_ISOLATION=FAIL");
  console.log("TENANT_ISOLATION=PASS");
} finally {
  await client.query("ROLLBACK").catch(() => undefined);
  client.release();
  await pool.end();
}
