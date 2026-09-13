import { readFile } from "node:fs/promises";
import { calculateQualityVector } from "../services/api/quality-vector";

const before = calculateQualityVector({ resolutions: [{ path: "motorizacao.potencia_cv", status: "ausente" }, { path: "motorizacao.torque_nm", status: "conflitante" }, { path: "seguranca.airbags_qtd", status: "confirmado" }], evidence: [], revisionCreatedAt: new Date("2025-01-01"), now: new Date("2025-02-01") });
const after = calculateQualityVector({ resolutions: [{ path: "motorizacao.potencia_cv", status: "confirmado" }, { path: "motorizacao.torque_nm", status: "conflitante" }, { path: "seguranca.airbags_qtd", status: "confirmado" }], evidence: [{ path: "motorizacao.potencia_cv" }, { path: "seguranca.airbags_qtd" }], revisionCreatedAt: new Date("2025-01-01"), now: new Date("2025-02-01") });
const root = new URL("../", import.meta.url);
const [service, sessions, schema, migration, api] = await Promise.all(["services/api/research-session-quality-impact.ts", "services/api/research-sessions.ts", "services/api/db/schema.ts", "drizzle/0025_research_session_quality_impacts.sql", "services/api/index.ts"].map((file) => readFile(new URL(file, root), "utf8")));
const checks: Array<[string, boolean]> = [
  ["absence is not positive", before.completeness.numerator === 1 && before.completeness.denominator === 3],
  ["conflict is not positive", before.consistency.numerator === 2 && before.consistency.denominator === 3],
  ["evidence is required", before.evidence.numerator === 0 && after.evidence.numerator === 2],
  ["recommendation revisable", after.recommendation.focus === "CONFLICT_RESOLUTION"],
  ["impact persistence", schema.includes('pgTable("research_session_quality_impacts"') && migration.includes('research_session_quality_impacts_session_key')],
  ["terminal recalculation", sessions.includes("recordResearchSessionQualityImpact") && service.includes("compareVectors")],
  ["tenant api", api.includes('/api/research-sessions/:id/impacto') && service.includes('eq(researchSessionQualityImpacts.organizationId, actor.organizationId)')],
  ["sanitized", !service.includes("prompt") && !service.includes("canonicalUrl")]
];
const failed = checks.filter(([, ok]) => !ok).map(([name]) => name);
if (failed.length) throw new Error(`RESEARCH_SESSION_QUALITY_IMPACT=FAIL: ${failed.join(", ")}`);
console.log("RESEARCH_SESSION_QUALITY_IMPACT=PASS");
