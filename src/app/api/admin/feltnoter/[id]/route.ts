import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const runtime = 'nodejs';

const VALID_STATUSES = ['draft', 'review', 'published', 'archived'];
const VALID_MOODS    = ['observation', 'essay', 'critique', 'rant', 'note'];

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { slug, title, body: noteBody, excerpt, mood, status, author, seo_title, meta_description } = body;

    if (status && !VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: `Invalid status: ${status}` }, { status: 400 });
    }
    if (mood && !VALID_MOODS.includes(mood)) {
      return NextResponse.json({ error: `Invalid mood: ${mood}` }, { status: 400 });
    }

    const res = await query(
      `UPDATE feltnoter SET
         slug             = COALESCE($2, slug),
         title            = COALESCE($3, title),
         body             = COALESCE($4, body),
         excerpt          = $5,
         mood             = COALESCE($6, mood),
         status           = COALESCE($7, status),
         author           = COALESCE($8, author),
         published_at     = CASE WHEN $7 = 'published' AND published_at IS NULL THEN NOW() ELSE published_at END,
         seo_title        = $9,
         meta_description = $10
       WHERE id = $1
       RETURNING id, slug, title, status, updated_at`,
      [
        id,
        slug ?? null, title ?? null, noteBody ?? null,
        excerpt ?? null, mood ?? null, status ?? null,
        author ?? null, seo_title ?? null, meta_description ?? null,
      ]
    );

    if (res.rows.length === 0) {
      return NextResponse.json({ error: 'Feltnote not found' }, { status: 404 });
    }

    return NextResponse.json({ feltnote: res.rows[0] });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const res = await query(`DELETE FROM feltnoter WHERE id = $1 RETURNING id`, [id]);
    if (res.rows.length === 0) {
      return NextResponse.json({ error: 'Feltnote not found' }, { status: 404 });
    }
    return NextResponse.json({ deleted: res.rows[0].id });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
