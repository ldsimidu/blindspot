import type { Config } from "drizzle-kit";
import "./services/api/env";

export default {
  schema: "./services/api/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL ?? "postgresql://invalid.local/disabled" }
} satisfies Config;
