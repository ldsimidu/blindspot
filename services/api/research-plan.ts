import type { SourcePolicy } from "./runtime-assets";

export const researchFocuses = ["GENERAL", "MISSING_VARIABLES", "OFFICIAL_SOURCES", "CONFLICT_RESOLUTION", "LOW_CONFIDENCE", "VALIDATE_EXISTING", "CATEGORY", "VARIABLES"] as const;
export type ResearchFocus = typeof researchFocuses[number];
export type ResearchSourceStrategy = "evidence_aware" | "official_only";
export type ResearchStopReason = "no_eligible_targets" | "no_missing_targets" | "no_conflicting_targets" | "official_source_unavailable";

export interface ResearchPlanPolicy {
  version: string;
  maxTasksPerSession: number;
  maxProviderCallsPerTask: number;
  focuses: Record<ResearchFocus, { sourceStrategy: ResearchSourceStrategy; eligibleStatuses?: string[] }>;
}

export interface ResearchPlanTask {
  sequence: number;
  kind: "targeted_collection";
  targetPaths: string[];
  sourceStrategy: ResearchSourceStrategy;
  officialDomains: string[];
  allowedSourceTypes: string[];
  providerCallBudget: number;
}

export interface ResearchPlan {
  version: string;
  focus: ResearchFocus;
  sourceStrategy: ResearchSourceStrategy;
  targetCount: number;
  taskCount: number;
  providerCallBudget: number;
  tasks: ResearchPlanTask[];
  exhaustionReason?: ResearchStopReason;
}

interface BuildResearchPlanInput {
  payload: unknown;
  focus: ResearchFocus;
  category?: string;
  variables?: string[];
  brand: string;
  market: string;
  sourcePolicy: SourcePolicy;
  planPolicy: ResearchPlanPolicy;
}

export function buildResearchPlan(input: BuildResearchPlanInput): ResearchPlan {
  const fields = collectFields(input.payload);
  const all = fields.map((field) => field.path);
  const focusPolicy = input.planPolicy.focuses[input.focus];
  const targetPaths = resolveTargetPaths(fields, all, input.focus, input.category, input.variables, focusPolicy.eligibleStatuses);
  const market = input.sourcePolicy.markets.find((item) => item.brand === input.brand && item.market === input.market);
  const officialDomains = focusPolicy.sourceStrategy === "official_only" ? [...(market?.officialDomains ?? [])] : [];
  const allowedSourceTypes = focusPolicy.sourceStrategy === "official_only" ? [...input.sourcePolicy.officialSourceTypes] : [...input.sourcePolicy.officialSourceTypes, ...input.sourcePolicy.partnerSourceTypes];
  const exhaustionReason = resolveExhaustionReason(input.focus, targetPaths, officialDomains);
  if (exhaustionReason) {
    return { version: input.planPolicy.version, focus: input.focus, sourceStrategy: focusPolicy.sourceStrategy, targetCount: targetPaths.length, taskCount: 0, providerCallBudget: 0, tasks: [], exhaustionReason };
  }
  const task: ResearchPlanTask = { sequence: 1, kind: "targeted_collection", targetPaths, sourceStrategy: focusPolicy.sourceStrategy, officialDomains, allowedSourceTypes, providerCallBudget: input.planPolicy.maxProviderCallsPerTask };
  return { version: input.planPolicy.version, focus: input.focus, sourceStrategy: focusPolicy.sourceStrategy, targetCount: targetPaths.length, taskCount: 1, providerCallBudget: task.providerCallBudget, tasks: [task] };
}

function resolveTargetPaths(fields: Array<{ path: string; status?: string }>, all: string[], focus: ResearchFocus, category: string | undefined, variables: string[] | undefined, eligibleStatuses: string[] | undefined): string[] {
  if (focus === "CATEGORY") return category ? all.filter((path) => path.startsWith(`${category}.`)) : [];
  if (focus === "VARIABLES") return [...new Set((variables ?? []).filter((path) => all.includes(path)))];
  if (eligibleStatuses) return fields.filter((field) => field.status && eligibleStatuses.includes(field.status)).map((field) => field.path);
  return all;
}

function resolveExhaustionReason(focus: ResearchFocus, targetPaths: string[], officialDomains: string[]): ResearchStopReason | undefined {
  if (focus === "OFFICIAL_SOURCES" && officialDomains.length === 0) return "official_source_unavailable";
  if (targetPaths.length > 0) return undefined;
  if (focus === "MISSING_VARIABLES") return "no_missing_targets";
  if (focus === "CONFLICT_RESOLUTION") return "no_conflicting_targets";
  return "no_eligible_targets";
}

function collectFields(payload: unknown): Array<{ path: string; status?: string }> {
  const root = asRecord(payload)?.ficha_tecnica ?? payload;
  const fields: Array<{ path: string; status?: string }> = [];
  visit(root, "", fields);
  return fields;
}

function visit(value: unknown, prefix: string, out: Array<{ path: string; status?: string }>): void {
  const record = asRecord(value);
  if (!record) return;
  if ("valor" in record || "status" in record) { if (prefix) out.push({ path: prefix, status: typeof record.status === "string" ? record.status : undefined }); return; }
  for (const [key, nested] of Object.entries(record)) visit(nested, prefix ? `${prefix}.${key}` : key, out);
}

function asRecord(value: unknown): Record<string, unknown> | undefined { return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : undefined; }
