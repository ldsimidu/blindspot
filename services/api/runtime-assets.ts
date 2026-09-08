import { readFile } from "node:fs/promises";
import path from "node:path";

const RUNTIME_ASSETS_DIR = path.resolve(process.cwd(), "packages", "agent-runtime", "assets");

export interface SourcePolicyMarket {
  brand: string;
  market: string;
  officialDomains: string[];
}

export interface SourcePolicy {
  version: string;
  identityFields: ["marca", "modelo", "versao", "ano_modelo", "mercado"];
  officialSourceTypes: string[];
  partnerSourceTypes: string[];
  markets: SourcePolicyMarket[];
  partnerDomains: string[];
  simulated: {
    allowedHosts: string[];
    allowedSourceTypes: string[];
  };
}

export interface NormalizationPolicy {
  version: string;
  description: string;
  fields: Array<{
    path: string;
    canonicalUnit: string;
    kind: "engine_displacement" | "power" | "torque" | "fuel_consumption";
    acceptedUnits: string[];
  }>;
}

export interface FieldPolicy {
  version: string;
  coverage: { totalPaths: number; statusFields: number; collectionFields: number };
  body: { field: string; allowedValues: string[] };
  propulsion: { field: string; allowedValues: string[] };
  conditionalFields: Array<{ path: string; applicableTo: string[] }>;
  extensionFamilies: Record<string, string[]>;
}

export async function readRuntimeAsset(
  fileName: "base-agent-prompt.txt" | "schema.json" | "mock-response.json" | "source-policy.json" | "normalization-policy.json" | "field-policy.json"
): Promise<string> {
  return readFile(path.join(RUNTIME_ASSETS_DIR, fileName), "utf-8");
}

export async function readRuntimeSchema(): Promise<Record<string, unknown>> {
  return JSON.parse(await readRuntimeAsset("schema.json")) as Record<string, unknown>;
}

export async function readRuntimeMockResponse(): Promise<Record<string, unknown>> {
  return JSON.parse(await readRuntimeAsset("mock-response.json")) as Record<string, unknown>;
}

export async function readSourcePolicy(): Promise<SourcePolicy> {
  return JSON.parse(await readRuntimeAsset("source-policy.json")) as SourcePolicy;
}

export async function readNormalizationPolicy(): Promise<NormalizationPolicy> {
  return JSON.parse(await readRuntimeAsset("normalization-policy.json")) as NormalizationPolicy;
}

export async function readFieldPolicy(): Promise<FieldPolicy> {
  return JSON.parse(await readRuntimeAsset("field-policy.json")) as FieldPolicy;
}
