import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const runtime = 'nodejs';

const VALID_STATUSES = ['draft', 'review', 'published', 'archived'];

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      title, slug, body: articleBody, excerpt, author, status,
      category, tags, hero_image_url, image_alt, seo_title, meta_description,
    } = body;

    if (status && !VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: `Invalid status: ${status}` }, { status: 400 });
    }

    const res = await query(
      `UPDATE journal_articles
       SET
         title            = COALESCE($2, title),
         slug             = COALESCE($3, slug),
         body             = COALESCE($4, body),
         excerpt          = $5,
         author           = COALESCE($6, author),
         status           = COALESCE($7, status),
         category         = $8,
         tags             = COALESCE($9, tags),
         hero_image_url   = COALESCE($10, hero_image_url),
         image_alt        = $11,
         seo_title        = $12,
         meta_description = $13,
         published_at     = CASE WHEN $7 = 'published' AND status != 'published' THEN NOW() ELSE published_at END
       WHERE id = $1
       RETURNING id, slug, title, status, updated_at`,
      [
        id,
        title ?? null,
        slug ?? null,
        articleBody ?? null,
        excerpt ?? null,
        author ?? null,
        status ?? null,
        category ?? null,
        Array.isArray(tags) ? tags : null,
        hero_image_url ?? null,
        image_alt ?? null,
        seo_title ?? null,
        meta_description ?? null,
      ]
    );

    if (res.rows.length === 0) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }

    return NextResponse.json({ article: res.rows[0] });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
