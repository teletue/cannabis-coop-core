import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

/**
 * GET /api/drafts
 * Returns all draft articles, optionally filtered by review_status.
 * ?status=pending_review|approved|rejected|published
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 100);

  try {
    const res = await query(
      `SELECT
         id, inbox_id, slug, title, excerpt, author,
         relevancy_score, review_status, pipeline_stage,
         tags, hero_image_url, affiliate_link, published_at,
         created_at, updated_at, scout_output
       FROM draft_articles
       WHERE ($1::text IS NULL OR review_status = $1)
       ORDER BY relevancy_score DESC, created_at DESC
       LIMIT $2`,
      [status ?? null, limit]
    );

    return NextResponse.json({ drafts: res.rows, total: res.rowCount });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/**
 * PATCH /api/drafts
 * Update a draft's review_status, body, slug, or rejection_note.
 * Body: { id, review_status?, body?, slug?, rejection_note?, reviewed_by? }
 */
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, review_status, body: articleBody, slug, rejection_note, reviewed_by, affiliate_link } = body;

    if (!id) {
      return NextResponse.json({ error: 'Missing draft id' }, { status: 400 });
    }

    const validStatuses = ['pending_review', 'approved', 'rejected', 'published'];
    if (review_status && !validStatuses.includes(review_status)) {
      return NextResponse.json({ error: `Invalid review_status: ${review_status}` }, { status: 400 });
    }

    const res = await query(
      `UPDATE draft_articles
       SET
         review_status  = COALESCE($2, review_status),
         body           = COALESCE($3, body),
         slug           = COALESCE($4, slug),
         rejection_note = COALESCE($5, rejection_note),
         reviewed_by    = COALESCE($6, reviewed_by),
         affiliate_link = COALESCE($7, affiliate_link),
         reviewed_at    = CASE WHEN $2 IN ('approved', 'rejected', 'published') THEN NOW() ELSE reviewed_at END
       WHERE id = $1
       RETURNING id, title, review_status, slug, affiliate_link, updated_at`,
      [id, review_status ?? null, articleBody ?? null, slug ?? null, rejection_note ?? null, reviewed_by ?? null, affiliate_link ?? null]
    );

    if (res.rows.length === 0) {
      return NextResponse.json({ error: 'Draft not found' }, { status: 404 });
    }

    return NextResponse.json({ draft: res.rows[0] });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/**
 * DELETE /api/drafts
 * Permanently delete a draft article.
 * Body: { id }
 */
export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: 'Missing draft id' }, { status: 400 });
    }

    const res = await query(
      `DELETE FROM draft_articles WHERE id = $1 RETURNING id`,
      [id]
    );

    if (res.rows.length === 0) {
      return NextResponse.json({ error: 'Draft not found' }, { status: 404 });
    }

    return NextResponse.json({ deleted: res.rows[0].id });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
