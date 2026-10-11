// Tiny database layer: plain SQL with numbered parameters ($1, $2 ...).
//
//  • Production: set DATABASE_URL (Neon / any Postgres) → uses `pg`.
//  • Local dev without DATABASE_URL → embedded Postgres (PGlite) stored in ./.data
//
// Both drivers speak real PostgreSQL, so the same SQL runs everywhere.

import { SCHEMA_SQL, SCHEMA_VERSION } from "./schema";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Row = Record<string, any>;

interface Driver {
  query(text: string, params?: unknown[]): Promise<{ rows: Row[] }>;
  /** Runs a multi-statement script while holding a migration lock. */
  migrate(script: string): Promise<void>;
}

const globalForDb = globalThis as unknown as {
  __steppayDriver?: Promise<Driver>;
  __steppayReady?: Promise<void>;
};

function connectionString() {
  return process.env.DATABASE_URL || process.env.POSTGRES_URL || "";
}

async function createDriver(): Promise<Driver> {
  const url = connectionString();

  if (url) {
    const { Pool } = await import("pg");
    const local = /localhost|127\.0\.0\.1/.test(url);
    const pool = new Pool({
      connectionString: url,
      max: 5,
      ssl: local || /sslmode=/.test(url) ? undefined : { rejectUnauthorized: false },
    });
    return {
      query: (text, params) => pool.query(text, params as unknown[]),
      async migrate(script) {
        const client = await pool.connect();
        try {
          await client.query("SELECT pg_advisory_lock(727001)");
          await client.query(script);
        } finally {
          await client.query("SELECT pg_advisory_unlock(727001)").catch(() => {});
          client.release();
        }
      },
    };
  }

  if (process.env.VERCEL) {
    throw new Error("DATABASE_URL is not set. Connect a Postgres database (e.g. Neon) in Vercel → Storage, then redeploy.");
  }

  const { PGlite } = await import("@electric-sql/pglite");
  const { mkdirSync } = await import("node:fs");
  const dir = process.env.PGLITE_DIR || "./.data/pglite";
  mkdirSync(dir, { recursive: true });
  const db = new PGlite(dir);
  await db.waitReady;
  return {
    query: (text, params) => db.query<Row>(text, params as unknown[]),
    migrate: async (script) => {
      await db.exec(script);
    },
  };
}

async function ensureSchema(driver: Driver) {
  try {
    const { rows } = await driver.query("SELECT value FROM app_meta WHERE key = 'schema_version'");
    if (rows[0]?.value === SCHEMA_VERSION) return;
  } catch {
    // app_meta does not exist yet — first run.
  }
  await driver.migrate(
    SCHEMA_SQL +
      `\nINSERT INTO app_meta (key, value) VALUES ('schema_version', '${SCHEMA_VERSION}')
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;`,
  );
}

async function getDriver(): Promise<Driver> {
  if (!globalForDb.__steppayDriver) {
    globalForDb.__steppayDriver = createDriver().catch((err) => {
      globalForDb.__steppayDriver = undefined;
      throw err;
    });
  }
  const driver = await globalForDb.__steppayDriver;
  if (!globalForDb.__steppayReady) {
    globalForDb.__steppayReady = ensureSchema(driver).catch((err) => {
      globalForDb.__steppayReady = undefined;
      throw err;
    });
  }
  await globalForDb.__steppayReady;
  return driver;
}

/** Run a query and return all rows. */
export async function sql<T extends Row = Row>(text: string, params: unknown[] = []): Promise<T[]> {
  const driver = await getDriver();
  const res = await driver.query(text, params);
  return res.rows as T[];
}

/** Run a query and return the first row (or null). */
export async function sqlOne<T extends Row = Row>(text: string, params: unknown[] = []): Promise<T | null> {
  const rows = await sql<T>(text, params);
  return rows[0] ?? null;
}
