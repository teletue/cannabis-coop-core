import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

const MAX_PATH_LENGTH = 500;

function normalizePath(path: unknown): string | null {
  if (typeof path !== 'string' || !path.startsWith('/') || path.startsWith('//')) {
    return null;
  }
  if (path.length > MAX_PATH_LENGTH) return null;
  // Count only the path itself, never query strings (which may contain UTM data)
  return path.split('?')[0].split('#')[0];
}

/**
 * POST /api/page-view { path }
 * Counts every page view, regardless of sessions. Anonymous — no user data.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const path = normalizePath(body?.path);

    if (!path) {
      return NextResponse.json({ error: 'Missing or invalid path parameter' }, { status: 400 });
    }

    const res = await query(
      `INSERT INTO page_session_counts (page_path, view_count)
       VALUES ($1, 1)
       ON CONFLICT (page_path)
       DO UPDATE SET view_count = page_session_counts.view_count + 1,
                     updated_at = NOW()
       RETURNING view_count`,
      [path]
    );

    return NextResponse.json({ path, count: Number(res.rows[0].view_count) });
  } catch (error) {
    console.error('[PageView] Increment failed:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
