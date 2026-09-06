import { readFile } from "node:fs/promises";
import path from "node:path";
import type { VehicleInput, VehiclePayload } from "./types";

const PROMPT_ASSETS_DIR = path.resolve(process.cwd(), "packages", "agent-runtime", "assets");

interface PromptCompositionInput {
  baseAgentPrompt: string;
  outputSchema: unknown;
  vehiclePayload: VehiclePayload;
}

export async function readBaseAgentPrompt(): Promise<string> {
  const filePath = path.join(PROMPT_ASSETS_DIR, "base-agent-prompt.txt");
  return readFile(filePath, "utf-8");
}

export async function readOutputSchema(): Promise<Record<string, unknown>> {
  const filePath = path.join(PROMPT_ASSETS_DIR, "schema.json");
  const rawSchema = await readFile(filePath, "utf-8");
  return JSON.parse(rawSchema) as Record<string, unknown>;
}

export function buildVehiclePayload(vehicle: VehicleInput): VehiclePayload {
  return {
    context: {
      vehicle: {
        marca: vehicle.marca,
        modelo: vehicle.modelo,
        versao: vehicle.versao,
        ano_modelo: vehicle.ano_modelo,
        mercado: vehicle.mercado
      }
    }
  };
}

export function composeFinalPrompt(input: PromptCompositionInput): string {
  const schemaVariables = extractSchemaVariables(input.outputSchema);

  // This keeps each section explicit so the LLM can parse input and output constraints.
  return [
    "### BASE_AGENT_PROMPT",
    input.baseAgentPrompt.trim(),
    "",
    "### OUTPUT_SCHEMA_JSON",
    JSON.stringify(input.outputSchema, null, 2),
    "",
    "### VEHICLE_PAYLOAD_JSON",
    JSON.stringify(input.vehiclePayload, null, 2),
    "",
    "### SCHEMA_VARIABLES_TARGET",
    JSON.stringify(schemaVariables, null, 2),
    "",
    "### EXECUTION_RULES",
    "Interpret BASE_AGENT_PROMPT as the main instruction source.",
    "Research on the web for the exact vehicle from VEHICLE_PAYLOAD_JSON.",
    "Fill every variable listed in SCHEMA_VARIABLES_TARGET whenever reliable evidence exists.",
    "Use source references for each filled field as instructed by BASE_AGENT_PROMPT.",
    "Output must strictly match OUTPUT_SCHEMA_JSON.",
    "Return only valid JSON."
  ].join("\n");
}

function extractSchemaVariables(outputSchema: unknown): string[] {
  const schema = asObject(outputSchema);
  const properties = asObject(schema?.properties);
  const ficha = asObject(properties?.ficha_tecnica);
  const fichaProperties = asObject(ficha?.properties);
  if (!fichaProperties) {
    return [];
  }

  const paths: string[] = [];

  for (const [groupName, groupSchemaUnknown] of Object.entries(fichaProperties)) {
    const groupSchema = asObject(groupSchemaUnknown);
    const required = Array.isArray(groupSchema?.required) ? groupSchema.required : [];

    for (const variableName of required) {
      if (typeof variableName === "string") {
        paths.push(`${groupName}.${variableName}`);
      }
    }
  }

  return paths;
}

function asObject(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : null;
}

