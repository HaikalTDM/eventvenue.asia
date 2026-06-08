import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

/**
 * Postgres connection for the application.
 *
 * - DATABASE_URL points at Supabase's pooled connection (port 6543, transaction mode).
 *   Drizzle queries run through this at runtime. Prepared statements are disabled
 *   because the pooler does not support them in transaction mode.
 * - DIRECT_URL (port 5432) is reserved for drizzle-kit migrations; see drizzle.config.ts.
 *
 * The single global client is reused across hot reloads in development to avoid
 * exhausting the connection pool.
 */
const connectionString =
  process.env.DATABASE_URL ?? "postgresql://localhost:5432/eventvenue";

const globalForDb = globalThis as unknown as {
  __pgClient?: ReturnType<typeof postgres>;
};

const client =
  globalForDb.__pgClient ??
  postgres(connectionString, {
    prepare: false,
    max: process.env.NODE_ENV === "production" ? 20 : 5,
    idle_timeout: 30,
    connect_timeout: 10,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.__pgClient = client;
}

export const db = drizzle(client, { schema });
export { schema };
