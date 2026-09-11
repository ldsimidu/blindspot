import { sql } from "drizzle-orm";
import { getDatabase, getPersistenceMode } from "./db/client";

export type ReadinessResult =
  | { status: "ready"; code: "postgres_available" }
  | { status: "not_ready"; code: "persistence_mode_file" | "persistence_unavailable" };

export async function checkReadiness(): Promise<ReadinessResult> {
  if (getPersistenceMode() !== "postgres") {
    return { status: "not_ready", code: "persistence_mode_file" };
  }

  try {
    const database = getDatabase();
    if (!database) return { status: "not_ready", code: "persistence_unavailable" };
    await database.execute(sql`select 1`);
    return { status: "ready", code: "postgres_available" };
  } catch {
    return { status: "not_ready", code: "persistence_unavailable" };
  }
}
