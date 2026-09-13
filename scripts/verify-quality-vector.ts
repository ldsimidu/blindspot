import { calculateQualityVector } from "../services/api/quality-vector";
const result = calculateQualityVector({ resolutions: [{ path: "a.x", status: "nao_encontrado" }, { path: "b.y", status: "conflitante" }, { path: "c.z", status: "confirmado" }], evidence: [], revisionCreatedAt: new Date() });
if (result.recommendation.focus !== "MISSING_VARIABLES" || result.consistency.rate >= 1 || result.evidence.rate !== 0) throw new Error("QUALITY_VECTOR=FAIL"); console.log("QUALITY_VECTOR=PASS");
