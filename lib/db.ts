// lib/db.ts
import { Pool } from 'pg';

// Usar any en el tipo del pool para evitar problema con las declaraciones faltantes
let pool: any | null = null;

export function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    });
  }
  return pool;
}

export async function query(text: string, params?: any[]) {
  const pool = getPool();
  return pool.query(text, params);
}

export async function getClient() {
  const pool = getPool();
  return pool.connect();
}
