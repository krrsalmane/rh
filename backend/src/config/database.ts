import mysql, { PoolConnection, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { env } from './env';

export interface QueryResult<T = Record<string, unknown>> {
  rows: T[];
  rowCount: number;
}

function normalizeSql(text: string): string {
  return text
    .replace(/\bILIKE\b/g, 'LIKE')
    .replace(/::[a-zA-Z_][a-zA-Z0-9_]*/g, '');
}

function mapPlaceholders(text: string, params: unknown[] = []): { sql: string; values: any[] } {
  if (params.length === 0) {
    return { sql: text, values: [] };
  }

  const orderedValues: any[] = [];
  const sql = text.replace(/\$(\d+)/g, (_match, index) => {
    const numericIndex = Number(index) - 1;
    orderedValues.push(params[numericIndex]);
    return '?';
  });

  return { sql, values: orderedValues };
}

async function executeQuery<T = Record<string, unknown>>(
  connection: mysql.Pool | PoolConnection,
  text: string,
  params: unknown[] = []
): Promise<QueryResult<T>> {
  const normalized = normalizeSql(text);
  const { sql, values } = mapPlaceholders(normalized, params);
  const [rows] = await connection.execute<RowDataPacket[] | ResultSetHeader>(sql, values);

  if (Array.isArray(rows)) {
    return { rows: rows as T[], rowCount: rows.length };
  }

  return { rows: [], rowCount: rows.affectedRows ?? 0 };
}

const pool = mysql.createPool(env.DATABASE_URL);

export async function query<T = Record<string, unknown>>(
  text: string,
  params?: unknown[]
): Promise<QueryResult<T>> {
  return executeQuery<T>(pool, text, params ?? []);
}

interface DbClient {
  query<T = Record<string, unknown>>(text: string, params?: unknown[]): Promise<QueryResult<T>>;
  release: () => void;
}

export async function getClient(): Promise<DbClient> {
  const connection = await pool.getConnection();
  return {
    query<T = Record<string, unknown>>(text: string, params?: unknown[]) {
      return executeQuery<T>(connection, text, params ?? []);
    },
    release() {
      connection.release();
    },
  };
}

export default pool;
