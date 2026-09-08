import { readFile } from "node:fs/promises";
import path from "node:path";
import { readRuntimeSchema } from "../services/api/runtime-assets";

const repositoryRoot = process.cwd();
const catalogPath = path.join(repositoryRoot, "docs", "product", "catalogo-variaveis-ficha-tecnica.md");
const [schema, catalog] = await Promise.all([readRuntimeSchema(), readFile(catalogPath, "utf-8")]);

const schemaFields = extractSchemaFields(schema);
const catalogFields = new Set(Array.from(catalog.matchAll(/`([a-z0-9_]+\.[a-z0-9_]+)`/g), (match) => match[1]));
const missing = schemaFields.filter((field) => !catalogFields.has(field));
const unexpected = Array.from(catalogFields).filter((field) => !schemaFields.includes(field));

if (missing.length > 0 || unexpected.length > 0) {
  throw new Error(`Catalogo divergente. Ausentes: ${missing.join(", ") || "nenhum"}. Extras: ${unexpected.join(", ") || "nenhum"}.`);
}

console.log(`TECHNICAL_SHEET_CATALOG_CHECK=PASS fields=${schemaFields.length}`);

function extractSchemaFields(schema: Record<string, unknown>): string[] {
  const rootProperties = asRecord(schema.properties);
  const ficha = asRecord(rootProperties?.ficha_tecnica);
  const groups = asRecord(ficha?.properties);
  if (!groups) throw new Error("Schema sem grupos de ficha_tecnica.");

  const fields: string[] = [];
  for (const [groupName, group] of Object.entries(groups)) {
    const required = asRecord(group)?.required;
    if (!Array.isArray(required)) throw new Error(`Grupo ${groupName} sem required.`);
    for (const field of required) {
      if (typeof field !== "string") throw new Error(`Campo invalido em ${groupName}.`);
      fields.push(`${groupName}.${field}`);
    }
  }
  return fields;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : null;
}
