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
       RETURNING id, title, review_status, slug, affiliate_link, body, author,
                 hero_image_url, tags, excerpt, updated_at`,
      [id, review_status ?? null, articleBody ?? null, slug ?? null, rejection_note ?? null, reviewed_by ?? null, affiliate_link ?? null]
    );

    if (res.rows.length === 0) {
      return NextResponse.json({ error: 'Draft not found' }, { status: 404 });
    }

    const draft = res.rows[0];

    // When publishing, copy into journal_articles so /journal can display it
    if (draft.review_status === 'published') {
      // Generate slug from title if missing
      const finalSlug = draft.slug ?? draft.title
        .toLowerCase()
        .replace(/[æ]/g, 'ae').replace(/[ø]/g, 'oe').replace(/[å]/g, 'aa')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .substring(0, 80);

      await query(
        `INSERT INTO journal_articles (slug, title, body, author, hero_image_url, tags, published_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())
         ON CONFLICT (slug) DO UPDATE SET
           title          = EXCLUDED.title,
           body           = EXCLUDED.body,
           author         = EXCLUDED.author,
           hero_image_url = EXCLUDED.hero_image_url,
           tags           = EXCLUDED.tags,
           published_at   = EXCLUDED.published_at`,
        [
          finalSlug,
          draft.title,
          draft.body ?? draft.excerpt ?? '',
          draft.author ?? 'Redaktionen',
          draft.hero_image_url ?? '',
          draft.tags ?? [],
        ]
      );

      // Store the final slug back on the draft
      if (!draft.slug) {
        await query(`UPDATE draft_articles SET slug = $1 WHERE id = $2`, [finalSlug, id]);
        draft.slug = finalSlug;
      }
    }

    return NextResponse.json({ draft });
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
