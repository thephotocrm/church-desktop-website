import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "@shared/schema";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  keepAlive: true,
});

// node-postgres emits 'error' on idle clients when the backend drops a pooled
// connection (Postgres/Neon idle timeout, DB restart, Replit sleep/wake). Without
// a listener Node treats it as an unhandled 'error' event and crashes the process.
// Log and let the pool recover instead of taking the whole server down mid-service.
pool.on("error", (err) => {
  console.error("[db] idle pool client error (recovering):", err);
});

export const db = drizzle(pool, { schema });
