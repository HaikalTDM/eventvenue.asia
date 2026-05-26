import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://localhost:5432/eventvenue",
  ssl: process.env.DATABASE_URL?.includes("supabase") || process.env.DATABASE_URL?.includes("pooler")
    ? { rejectUnauthorized: false }
    : undefined,
  max: 20,
  min: 2,
  idleTimeoutMillis: 30000,
});

export const db = drizzle(pool, { schema });
export { schema };
