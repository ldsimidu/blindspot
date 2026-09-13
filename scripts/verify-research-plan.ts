import { readFile } from "node:fs/promises";
import { buildResearchPlan } from "../services/api/research-plan";
import { composeFinalPrompt } from "../services/api/prompt-builder";
import { readResearchPlanPolicy, readSourcePolicy } from "../services/api/runtime-assets";

const [sourcePolicy, planPolicy] = await Promise.all([readSourcePolicy(), readResearchPlanPolicy()]);
const payload = { ficha_tecnica: { motorizacao: { potencia_cv: { valor: null, status: "nao_encontrado" }, torque_nm: { valor: null, status: "conflitante" }, potencia_rpm: { valor: 4000, status: "confirmado" }, consumo_valor: { valor: null, status: "baixa_confianca" } }, seguranca: { airbags_qtd: { valor: null, status: "ausente" } } } };
const build = (focus: Parameters<typeof buildResearchPlan>[0]["focus"], brand = "Ford", market = "Brasil") => buildResearchPlan({ payload, focus, brand, market, sourcePolicy, planPolicy });
const missing = build("MISSING_VARIABLES");
const conflict = build("CONFLICT_RESOLUTION");
const officialUnavailable = build("OFFICIAL_SOURCES", "Marca sem ancora");
const lowConfidence = build("LOW_CONFIDENCE");
const category = buildResearchPlan({ payload, focus: "CATEGORY", category: "seguranca", brand: "Ford", market: "Brasil", sourcePolicy, planPolicy });
const prompt = composeFinalPrompt({ baseAgentPrompt: "base", outputSchema: {}, vehiclePayload: { context: { vehicle: { marca: "Ford", modelo: "Fixture", versao: "Test", ano_modelo: 2099, mercado: "Brasil" } } }, researchPlanTask: missing.tasks[0]! });
const files = await Promise.all(["services/api/db/schema.ts", "services/api/research-sessions.ts", "drizzle/0024_research_session_plans.sql"].map((file) => readFile(new URL(`../${file}`, import.meta.url), "utf8")));
const checks: Array<[string, boolean]> = [
  ["missing only", JSON.stringify(missing.tasks[0]?.targetPaths) === JSON.stringify(["motorizacao.potencia_cv", "seguranca.airbags_qtd"])],
  ["conflict only", JSON.stringify(conflict.tasks[0]?.targetPaths) === JSON.stringify(["motorizacao.torque_nm"])],
  ["low confidence only", JSON.stringify(lowConfidence.tasks[0]?.targetPaths) === JSON.stringify(["motorizacao.consumo_valor"])],
  ["category only", JSON.stringify(category.tasks[0]?.targetPaths) === JSON.stringify(["seguranca.airbags_qtd"])],
  ["official unavailable exhausts", officialUnavailable.taskCount === 0 && officialUnavailable.exhaustionReason === "official_source_unavailable"],
  ["plan reaches runtime", prompt.includes("RESEARCH_EXECUTION_PLAN_JSON") && prompt.includes("Research only the paths")],
  ["task persistence", files[0].includes('pgTable("research_session_tasks"') && files[1].includes("researchSessionTasks") && files[2].includes('CREATE TABLE "research_session_tasks"')]
];
const failed = checks.filter(([, ok]) => !ok).map(([name]) => name);
if (failed.length) throw new Error(`RESEARCH_PLAN_CONTRACT=FAIL: ${failed.join(", ")}`);
console.log("RESEARCH_PLAN_CONTRACT=PASS");
