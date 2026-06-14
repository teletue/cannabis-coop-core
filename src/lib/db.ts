import { Pool } from 'pg';

// Vi fjerner fallback til localhost for at undgå 'ECONNREFUSED' fejl i produktion.
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not defined');
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

export default pool;

export async function query(text: string, params?: any[]) {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  if (process.env.DEBUG_DB) {
    console.log('Executed query', { text, duration, rowsCount: res.rowCount });
  }
  return res;
}
