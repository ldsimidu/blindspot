import { readFile } from "node:fs/promises";
import path from "node:path";

const RUNTIME_ASSETS_DIR = path.resolve(process.cwd(), "packages", "agent-runtime", "assets");

export async function readRuntimeAsset(fileName: "base-agent-prompt.txt" | "schema.json" | "mock-response.json"): Promise<string> {
  return readFile(path.join(RUNTIME_ASSETS_DIR, fileName), "utf-8");
}

export async function readRuntimeSchema(): Promise<Record<string, unknown>> {
  return JSON.parse(await readRuntimeAsset("schema.json")) as Record<string, unknown>;
}

export async function readRuntimeMockResponse(): Promise<Record<string, unknown>> {
  return JSON.parse(await readRuntimeAsset("mock-response.json")) as Record<string, unknown>;
}
