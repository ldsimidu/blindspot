import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { researchSessionEventTypes, sanitizeHistoryMetadata } from "../services/api/research-session-history";

const sanitized = sanitizeHistoryMetadata({ state: "partial", stop_reason: "eligible_targets_unresolved", provider_calls_used: 1, prompt: "never persist", url: "https://example.test/private", raw_response: { unsafe: true }, token: "secret", nested: ["unsafe"] });
assert.deepEqual(sanitized, { state: "partial", stop_reason: "eligible_targets_unresolved", provider_calls_used: 1 });
assert.equal(researchSessionEventTypes.includes("revision_published"), true);
assert.equal(researchSessionEventTypes.includes("session_failed"), true);

const migration = readFileSync("drizzle/0028_research_session_events.sql", "utf-8");
assert.match(migration, /research_session_events_session_sequence_key/);
assert.match(migration, /research_session_events_type_check/);
assert.doesNotMatch(migration, /prompt|raw_response|canonical_url|token/i);

const historySource = readFileSync("services/api/research-session-history.ts", "utf-8");
assert.match(historySource, /eq\(researchSessionEvents\.organizationId, actor\.organizationId\)/);
assert.match(historySource, /RETENTION_DAYS = 180/);
console.log("RESEARCH_SESSION_HISTORY=PASS");
