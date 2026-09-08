import { createCatalogSlug, createDeterministicAliases, normalizeCatalogText } from "../services/api/catalog";
import type { VehicleInput } from "../services/api/types";

const vehicle: VehicleInput = { marca: "Ford", modelo: "Ranger", versao: "Raptor", ano_modelo: 2025, mercado: "Brasil" };

assert(normalizeCatalogText("  Citroën   C4–Cactus  ") === "citroen c4 cactus", "normalizacao deve ignorar caixa, espacos e acentos");
assert(createCatalogSlug(vehicle) === "ford-ranger-raptor-2025-brasil", "slug deve ser legivel e deterministico");
const aliases = createDeterministicAliases(vehicle);
assert(aliases.some((alias) => alias.normalized === "ranger" && alias.kind === "model"), "modelo precisa gerar alias deterministico");
assert(aliases.some((alias) => alias.normalized === "ford ranger raptor 2025 brasil" && alias.kind === "identity"), "identidade completa precisa gerar alias deterministico");
assert(new Set(aliases.map((alias) => alias.normalized)).size === aliases.length, "aliases da mesma configuracao nao podem duplicar");

console.log("CATALOG_CONTRACT_CHECK=PASS");

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}
