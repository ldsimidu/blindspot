import { createHash } from "node:crypto";
import { and, desc, eq } from "drizzle-orm";
import { getDatabase } from "./db/client";
import { auditEvents, importRunItems, importRuns, technicalSheetVersions, vehicleConfigurations } from "./db/schema";
import { persistTechnicalSheetInTransaction } from "./db/repository";
import type { AuthContext } from "./authentication";
import { HttpError, type FichaTecnicaResponse, type ImportDryRunItem, type ImportItemResult, type ImportItemState, type ImportRunResult } from "./types";

export interface PreparedImportItem extends ImportDryRunItem { response: FichaTecnicaResponse; payloadSha256: string; }

export async function createImportDryRun(idempotencyKey: string, payloadSha256: string, items: PreparedImportItem[], outputSchema: Record<string, unknown>, actor: AuthContext, requestId: string): Promise<ImportRunResult> {
  const db = requireDatabase();
  const [existing] = await db.select().from(importRuns).where(and(eq(importRuns.idempotencyKey, idempotencyKey), eq(importRuns.organizationId, actor.organizationId))).limit(1);
  if (existing) {
    if (existing.payloadSha256 !== payloadSha256) throw new HttpError(409, "Chave de idempotencia ja usada para outro lote.");
    return readImportRun(existing.id, actor);
  }

  const seen = new Map<string, string>();
  const classified: Array<PreparedImportItem & { state: ImportItemState; code: string | null }> = [];
  for (const item of items) {
    const identity = identityKey(item.vehicle);
    const previous = seen.get(identity);
    let state: ImportItemState = "valid";
    let code: string | null = null;
    if (previous) {
      state = previous === item.payloadSha256 ? "duplicate" : "collision";
      code = previous === item.payloadSha256 ? "duplicate_in_batch" : "identity_collision_in_batch";
    } else {
      seen.set(identity, item.payloadSha256);
      const [vehicle] = await db.select({ id: vehicleConfigurations.id }).from(vehicleConfigurations).where(and(eq(vehicleConfigurations.brand, item.vehicle.marca), eq(vehicleConfigurations.model, item.vehicle.modelo), eq(vehicleConfigurations.trim, item.vehicle.versao), eq(vehicleConfigurations.modelYear, item.vehicle.ano_modelo), eq(vehicleConfigurations.market, item.vehicle.mercado))).limit(1);
      if (vehicle) {
        const [latest] = await db.select({ payloadSha256: technicalSheetVersions.payloadSha256 }).from(technicalSheetVersions).where(eq(technicalSheetVersions.vehicleConfigurationId, vehicle.id)).orderBy(desc(technicalSheetVersions.versionNumber)).limit(1);
        if (latest?.payloadSha256 === item.payloadSha256) {
          state = "duplicate";
          code = "duplicate_persisted";
        } else {
          state = "collision";
          code = "identity_collision_persisted";
        }
      }
    }
    classified.push({ ...item, state, code });
  }

  const counts = countStates(classified.map((item) => item.state));
  return db.transaction(async (tx) => {
    const [run] = await tx.insert(importRuns).values({ idempotencyKey, organizationId: actor.organizationId, accountId: actor.accountId, memberId: actor.memberId, payloadSha256, status: "dry_run", totalItems: items.length, ...counts }).returning();
    await tx.insert(importRunItems).values(classified.map((item, index) => ({ importRunId: run.id, itemIndex: index, vehicle: item.vehicle, response: item.response, provider: item.provider, payloadSha256: item.payloadSha256, state: item.state, diagnosticCode: item.code })));
    await tx.insert(auditEvents).values({ organizationId: actor.organizationId, accountId: actor.accountId, memberId: actor.memberId, action: "import.dry_run_created", resourceType: "import_run", resourceId: run.id, outcome: "allowed", requestId });
    return toResult(run, classified.map((item, index) => ({ index, state: item.state, code: item.code })));
  });
}

export async function confirmImportRun(id: string, outputSchema: Record<string, unknown>, actor: AuthContext, requestId: string): Promise<ImportRunResult> {
  const db = requireDatabase();
  const result = await db.transaction(async (tx) => {
    const [run] = await tx.select().from(importRuns).where(and(eq(importRuns.id, id), eq(importRuns.organizationId, actor.organizationId))).limit(1);
    if (!run) throw new HttpError(404, "Importacao nao encontrada.");
    const rows = await tx.select().from(importRunItems).where(eq(importRunItems.importRunId, id)).orderBy(importRunItems.itemIndex);
    if (run.status === "confirmed") return toResult(run, rows.map(toItemResult));
    if (run.invalidItems > 0 || run.collisionItems > 0) throw new HttpError(409, "Importacao possui itens invalidos ou colisoes e nao pode ser confirmada.");
    for (const row of rows) {
      if (row.state !== "valid") continue;
      await persistTechnicalSheetInTransaction(tx, { requestId: `import:${id}:${row.itemIndex}`, provider: asProvider(row.provider), vehicle: row.vehicle as any, response: row.response as FichaTecnicaResponse, outputSchema, finalPrompt: `import:${row.payloadSha256}`, actor });
    }
    const [confirmed] = await tx.update(importRuns).set({ status: "confirmed", confirmedAt: new Date() }).where(eq(importRuns.id, id)).returning();
    await tx.insert(auditEvents).values({ organizationId: actor.organizationId, accountId: actor.accountId, memberId: actor.memberId, action: "import.confirmed", resourceType: "import_run", resourceId: confirmed.id, outcome: "allowed", requestId });
    return toResult(confirmed, rows.map(toItemResult));
  });
  return result;
}

export async function readImportRun(id: string, actor: AuthContext): Promise<ImportRunResult> {
  const db = requireDatabase();
  const [run] = await db.select().from(importRuns).where(and(eq(importRuns.id, id), eq(importRuns.organizationId, actor.organizationId))).limit(1);
  if (!run) throw new HttpError(404, "Importacao nao encontrada.");
  const rows = await db.select().from(importRunItems).where(eq(importRunItems.importRunId, id)).orderBy(importRunItems.itemIndex);
  return toResult(run, rows.map(toItemResult));
}

export function hashImportPayload(value: unknown): string { return createHash("sha256").update(JSON.stringify(value)).digest("hex"); }

function requireDatabase() { const db = getDatabase(); if (!db) throw new HttpError(503, "Importacao requer persistencia PostgreSQL ativa."); return db; }
function asProvider(value: string): "simulated" | "openrouter" | "claude" { return value === "openrouter" || value === "claude" ? value : "simulated"; }
function identityKey(vehicle: { marca: string; modelo: string; versao: string; ano_modelo: number; mercado: string }): string { return [vehicle.marca, vehicle.modelo, vehicle.versao, vehicle.ano_modelo, vehicle.mercado].map((value) => String(value).normalize("NFKC").trim().replace(/\s+/g, " ").toLocaleLowerCase("pt-BR")).join("|"); }
function countStates(states: ImportItemState[]) { return { validItems: states.filter((state) => state === "valid").length, duplicateItems: states.filter((state) => state === "duplicate").length, collisionItems: states.filter((state) => state === "collision").length, invalidItems: states.filter((state) => state === "invalid").length }; }
function toItemResult(row: { itemIndex: number; state: string; diagnosticCode: string | null }): ImportItemResult { return { index: row.itemIndex, state: row.state as ImportItemState, code: row.diagnosticCode }; }
function toResult(run: { id: string; status: string; totalItems: number; validItems: number; duplicateItems: number; collisionItems: number; invalidItems: number }, items: ImportItemResult[]): ImportRunResult { return { id: run.id, state: run.status === "confirmed" ? "confirmed" : "dry_run", total: run.totalItems, valid: run.validItems, duplicate: run.duplicateItems, collision: run.collisionItems, invalid: run.invalidItems, items }; }
