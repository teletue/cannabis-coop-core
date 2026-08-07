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

    const signal = res.rows[0];

    // Promote to a draft when the editor marks it ready for the pipeline.
    if (status === 'ready_for_draft') {
      const existing = await query(
        `SELECT id FROM draft_articles WHERE inbox_id = $1 LIMIT 1`,
        [id]
      );

      if (existing.rowCount === 0) {
        const rawRes = await query(
          `SELECT title, abstract, source_url, relevancy_score, scout_output
           FROM raw_content_inbox
           WHERE id = $1`,
          [id]
        );

        const raw = rawRes.rows[0];
        if (raw) {
          const excerpt = raw.abstract
            ? raw.abstract.substring(0, 500)
            : null;

          const draftRes = await query(
            `INSERT INTO draft_articles (
               inbox_id,
               title,
               excerpt,
               body,
               review_status,
               pipeline_stage,
               relevancy_score,
               scout_output,
               author
             ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
             RETURNING id`,
            [
              id,
              raw.title ?? 'Uden titel',
              excerpt,
              raw.abstract ?? null,
              'pending_review',
              'editor_review',
              raw.relevancy_score ?? null,
              raw.scout_output ? JSON.stringify(raw.scout_output) : null,
              'Redaktionen',
            ]
          );
          signal.draft_id = draftRes.rows[0]?.id ?? null;
        }
      }
    }

    return NextResponse.json({ signal });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
