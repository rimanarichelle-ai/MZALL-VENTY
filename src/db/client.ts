import 'dotenv/config';
import { Pool, neon } from '@neondatabase/serverless';

export interface DbQueryResult<T = any> {
  rows: T[];
  rowCount?: number;
}

export interface DatabaseAdapter {
  isPostgres: boolean;
  query<T = any>(sql: string, params?: any[]): Promise<DbQueryResult<T>>;
  transaction<T = any>(callback: (client: { query<R = any>(sql: string, params?: any[]): Promise<DbQueryResult<R>> }) => Promise<T>): Promise<T>;
}

const getDatabaseUrl = (): string | null => {
  const url =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.NEON_DATABASE_URL ||
    '';
  return url.trim() ? url.trim() : null;
};

let neonPool: Pool | null = null;
let neonHttpQuery: any = null;

export const isPostgresConfigured = (): boolean => {
  return Boolean(getDatabaseUrl());
};

export const getPostgresPool = (): Pool => {
  const dbUrl = getDatabaseUrl();
  if (!dbUrl) {
    throw new Error('DATABASE_URL is not set.');
  }
  if (!neonPool) {
    neonPool = new Pool({ connectionString: dbUrl, max: 10 });
  }
  return neonPool;
};

export const getNeonHttpClient = () => {
  const dbUrl = getDatabaseUrl();
  if (!dbUrl) {
    throw new Error('DATABASE_URL is not set.');
  }
  if (!neonHttpQuery) {
    neonHttpQuery = neon(dbUrl);
  }
  return neonHttpQuery;
};

/**
 * Execute a query against Postgres using connection pooling or HTTP driver
 */
export const query = async <T = any>(sqlText: string, params: any[] = []): Promise<DbQueryResult<T>> => {
  const pool = getPostgresPool();
  const result = await pool.query(sqlText, params);
  return {
    rows: (result.rows || []) as T[],
    rowCount: result.rowCount ?? result.rows?.length ?? 0,
  };
};

/**
 * Execute a multi-statement transaction atomically with BEGIN / COMMIT / ROLLBACK
 */
export const transaction = async <T = any>(
  callback: (client: { query<R = any>(sqlText: string, params?: any[]): Promise<DbQueryResult<R>> }) => Promise<T>,
): Promise<T> => {
  const pool = getPostgresPool();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const wrappedClient = {
      query: async <R = any>(sqlText: string, params: any[] = []): Promise<DbQueryResult<R>> => {
        const res = await client.query(sqlText, params);
        return {
          rows: (res.rows || []) as R[],
          rowCount: res.rowCount ?? res.rows?.length ?? 0,
        };
      },
    };
    const result = await callback(wrappedClient);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    try {
      await client.query('ROLLBACK');
    } catch (rbErr) {
      console.error('[DB Transaction] Rollback error:', rbErr);
    }
    throw err;
  } finally {
    client.release();
  }
};

/**
 * Perform a live ping / connection check to verify database reachability
 */
export const testConnection = async (): Promise<{ success: boolean; latencyMs?: number; version?: string; error?: string }> => {
  if (!isPostgresConfigured()) {
    return { success: false, error: 'DATABASE_URL is not configured.' };
  }
  const start = Date.now();
  try {
    const res = await query('SELECT NOW() as current_time, version() as version');
    const latencyMs = Date.now() - start;
    return {
      success: true,
      latencyMs,
      version: res.rows[0]?.version,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || String(err),
    };
  }
};
