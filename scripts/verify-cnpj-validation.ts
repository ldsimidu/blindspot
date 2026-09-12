import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { formatCnpj, isValidCnpj, normalizeCnpj } from "../packages/contracts/cnpj";

assert.equal(normalizeCnpj("04.252.011/0001-10"), "04252011000110");
assert.equal(formatCnpj("04252011000110"), "04.252.011/0001-10");
assert.equal(isValidCnpj("04.252.011/0001-10"), true);
assert.equal(isValidCnpj("40.688.134/0001-61"), true);
assert.equal(isValidCnpj("04.252.011/0001-11"), false);
assert.equal(isValidCnpj("11.111.111/1111-11"), false);
assert.equal(isValidCnpj("04.252.011/0001"), false);

const apiSource = readFileSync(new URL("../services/api/index.ts", import.meta.url), "utf8");
assert.match(apiSource, /isValidCnpj\(cnpj\)/);
assert.match(apiSource, /normalizeCnpj\(body\.cnpj\)/);

console.log("CNPJ validation: PASS");
