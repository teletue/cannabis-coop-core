import { Pool } from 'pg';

let pool: Pool | null = null;

function getPool(): Pool {
  if (!process.env.DATABASE_URL) {
    throw new Error('[DB] DATABASE_URL environment variable is not set. Configure it in Vercel → Settings → Environment Variables.');
  }
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    });
  }
  return pool;
}

export default { query: (text: string, params?: any[]) => query(text, params) };

export async function query(text: string, params?: any[]) {
  const start = Date.now();
  
  try {
    const res = await getPool().query(text, params);
    const duration = Date.now() - start;
    
    // Debug logging in development
    if (process.env.NODE_ENV === 'development' || process.env.DEBUG_DB) {
      console.log('[DB Query]', {
        text: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
        duration: `${duration}ms`,
        rowsCount: res.rowCount,
      });
    }
    
    return res;
  } catch (error) {
    // Explicit error logging
    const errorMessage = error instanceof Error ? error.message : 'Unknown database error';
    
    console.error('[DB Error]', {
      error: errorMessage,
      text: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
      params: params ? '[REDACTED]' : undefined, // Don't log actual params for security
    });
    
    // Re-throw with more context
    throw new Error(`Database query failed: ${errorMessage}`);
  }
}
