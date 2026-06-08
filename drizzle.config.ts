import { defineConfig } from "drizzle-kit";

/**
 * drizzle-kit uses DIRECT_URL (port 5432) because migrations need a direct
 * Postgres connection — the Supabase pgbouncer-pooled URL on port 6543 runs
 * in transaction mode and rejects the DDL/prepared statements drizzle-kit emits.
 *
 * Application runtime queries go through DATABASE_URL instead; see lib/db/index.ts.
 */
export default defineConfig({
  schema: "./lib/db/schema/*",
  out: "./lib/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
});
