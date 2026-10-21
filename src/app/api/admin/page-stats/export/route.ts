import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { query } from '@/lib/db';

export const runtime = 'nodejs';

const ADMIN_COOKIE = 'weeds_admin_token';

/**
 * Escape a value for CSV (RFC 4180): wrap in quotes if it contains a
 * delimiter, quote or newline, and double any embedded quotes.
 */
function csvCell(value: string | number): string {
  const s = String(value);
  return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/**
 * GET /api/admin/page-stats/export
 * CSV of daily per-page sessions and page views. Admin-only.
 * Uses ";" as delimiter so Excel with Danish locale opens it directly.
 */
export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE)?.value;
  const expected = process.env.ADMIN_SECRET;

  if (!expected || token !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const res = await query(
      `SELECT to_char(day, 'YYYY-MM-DD') AS day, page_path, session_count, view_count
       FROM page_daily_counts
       ORDER BY day DESC, view_count DESC, page_path ASC`
    );

    const header = ['dato', 'side', 'sessioner', 'sidevisninger'];
    const lines = [
      header.join(';'),
      ...res.rows.map((r) =>
        [r.day, r.page_path, r.session_count, r.view_count].map(csvCell).join(';')
      ),
    ];

    // BOM so Excel detects UTF-8 (page paths may contain æøå)
    const csv = '\uFEFF' + lines.join('\r\n') + '\r\n';
    const today = new Date().toISOString().slice(0, 10);

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="weeds-sidestatistik-${today}.csv"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    console.error('[PageStatsExport] Failed:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
