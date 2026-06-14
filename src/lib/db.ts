import { Pool } from 'pg';

// Initialize connection pool to PostgreSQL database.
// Uses connection string from environment variables or defaults to local.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/cannabis_coop',
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
