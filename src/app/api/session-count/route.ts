import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

const MAX_PATH_LENGTH = 500;

/**
 * Validate and normalize a public page path.
 * Only local paths are accepted to prevent abuse.
 */
function normalizePath(path: unknown): string | null {
  if (typeof path !== 'string' || !path.startsWith('/') || path.startsWith('//')) {
    return null;
  }
  if (path.length > MAX_PATH_LENGTH) return null;
  // Count only the path itself, never query strings (which may contain UTM data)
  return path.split('?')[0].split('#')[0];
}

/**
 * GET /api/session-count?path=/shop
 * Returns the current session-start counter for a page.
 */
export async function GET(request: Request) {
  const path = normalizePath(new URL(request.url).searchParams.get('path'));
  if (!path) {
    return NextResponse.json({ error: 'Missing or invalid path parameter' }, { status: 400 });
  }

  try {
    const res = await query(
      'SELECT session_count FROM page_session_counts WHERE page_path = $1',
      [path]
    );
    return NextResponse.json({
      path,
      count: res.rows.length > 0 ? Number(res.rows[0].session_count) : 0,
    });
  } catch (error) {
    console.error('[SessionCount] Lookup failed:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * POST /api/session-count { path }
 * Increments the session-start counter for a page once per session.
 * The client only calls this at session start (10-minute inactivity window).
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const path = normalizePath(body?.path);

    if (!path) {
      return NextResponse.json({ error: 'Missing or invalid path parameter' }, { status: 400 });
    }

    const res = await query(
      `INSERT INTO page_session_counts (page_path, session_count)
       VALUES ($1, 1)
       ON CONFLICT (page_path)
       DO UPDATE SET session_count = page_session_counts.session_count + 1,
                     updated_at = NOW()
       RETURNING session_count`,
      [path]
    );

    return NextResponse.json({ path, count: Number(res.rows[0].session_count) });
  } catch (error) {
    console.error('[SessionCount] Increment failed:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
