import type { VehicleInput } from "./types";

export interface CatalogAlias {
  normalized: string;
  display: string;
  kind: "brand" | "model" | "trim" | "identity" | "slug";
}

export function normalizeCatalogText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

export function createCatalogSlug(vehicle: VehicleInput): string {
  return normalizeCatalogText([vehicle.marca, vehicle.modelo, vehicle.versao, vehicle.ano_modelo, vehicle.mercado].join(" ")).replace(/\s/g, "-");
}

export function createDeterministicAliases(vehicle: VehicleInput): CatalogAlias[] {
  const values: Array<Omit<CatalogAlias, "normalized">> = [
    { display: vehicle.marca, kind: "brand" },
    { display: vehicle.modelo, kind: "model" },
    { display: vehicle.versao, kind: "trim" },
    { display: [vehicle.marca, vehicle.modelo, vehicle.versao, vehicle.ano_modelo, vehicle.mercado].join(" "), kind: "identity" },
    { display: createCatalogSlug(vehicle), kind: "slug" }
  ];

  const aliases = new Map<string, CatalogAlias>();
  for (const value of values) {
    const normalized = normalizeCatalogText(value.display);
    if (normalized && !aliases.has(normalized)) aliases.set(normalized, { ...value, normalized });
  }
  return [...aliases.values()];
}
