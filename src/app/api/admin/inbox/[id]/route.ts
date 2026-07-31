import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const runtime = 'nodejs';

const VALID_STATUSES = [
  'pending', 'scored', 'below_threshold', 'promoted',
  'ignored', 'ready_for_draft', 'error',
];

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { title, abstract, source, source_url, relevancy_score, status, editor_notes } = body;

    if (status && !VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: `Invalid status: ${status}` }, { status: 400 });
    }

    if (relevancy_score != null && (relevancy_score < 1 || relevancy_score > 100)) {
      return NextResponse.json({ error: 'relevancy_score must be 1–100 or null' }, { status: 400 });
    }

    const res = await query(
      `UPDATE raw_content_inbox
       SET
         title           = COALESCE($2, title),
         abstract        = COALESCE($3, abstract),
         source          = COALESCE($4, source),
         source_url      = COALESCE($5, source_url),
         relevancy_score = $6,
         status          = COALESCE($7, status),
         editor_notes    = COALESCE($8, editor_notes)
       WHERE id = $1
       RETURNING id, title, status, relevancy_score, updated_at`,
      [
        id,
        title ?? null,
        abstract ?? null,
        source ?? null,
        source_url ?? null,
        relevancy_score ?? null,
        status ?? null,
        editor_notes ?? null,
      ]
    );

    if (res.rows.length === 0) {
      return NextResponse.json({ error: 'Signal not found' }, { status: 404 });
    }

    return NextResponse.json({ signal: res.rows[0] });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
