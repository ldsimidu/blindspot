import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import { HttpError } from "../types";
import * as schema from "./schema";

export type PersistenceMode = "file" | "postgres";
export function getPersistenceMode(): PersistenceMode { const mode = (process.env.PERSISTENCE_MODE ?? "file").toLowerCase(); if (mode === "file" || mode === "postgres") return mode; throw new HttpError(500, "PERSISTENCE_MODE invalido."); }
let database: ReturnType<typeof drizzle<typeof schema>> | null = null;
export function getDatabase() { if (getPersistenceMode() !== "postgres") return null; if (database) return database; const url = getDatabaseUrl(); database = drizzle({ client: new Pool({ connectionString: url, max: getDatabasePoolMax() }), schema }); return database; }

function getDatabaseUrl(): string { const value = process.env.DATABASE_URL?.trim(); if (!value) throw new HttpError(503, "Persistencia PostgreSQL indisponivel."); try { const parsed = new URL(value); if (parsed.protocol !== "postgres:" && parsed.protocol !== "postgresql:") throw new Error("protocol"); return value; } catch { throw new HttpError(500, "DATABASE_URL invalida."); } }
function getDatabasePoolMax(): number { const value = Number(process.env.DATABASE_POOL_MAX ?? "4"); if (!Number.isInteger(value) || value < 1 || value > 10) throw new HttpError(500, "DATABASE_POOL_MAX invalido."); return value; }
