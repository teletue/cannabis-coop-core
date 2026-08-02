import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const res = await query(
      `SELECT id, slug, title, mood, status, author, created_at
       FROM feltnoter ORDER BY created_at DESC`
    );
    return NextResponse.json({ feltnoter: res.rows });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { slug, title, body: noteBody, excerpt, mood, status, author, seo_title, meta_description } = body;

    if (!title || !slug || !noteBody) {
      return NextResponse.json({ error: 'title, slug and body are required' }, { status: 400 });
    }

    const publishedAt = status === 'published' ? new Date().toISOString() : null;

    const res = await query(
      `INSERT INTO feltnoter
         (slug, title, body, excerpt, mood, status, author, published_at, seo_title, meta_description)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING id, slug, title, status`,
      [
        slug, title, noteBody,
        excerpt ?? null, mood ?? 'note', status ?? 'draft',
        author ?? 'Redaktionen', publishedAt,
        seo_title ?? null, meta_description ?? null,
      ]
    );

    return NextResponse.json({ feltnote: res.rows[0] }, { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
