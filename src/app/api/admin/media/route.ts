import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const res = await query(
      `SELECT id, url, platform, media_type, title, description, thumbnail_url,
              embed_id, embed_url, author_name, curator_note, status, created_at
       FROM media_items
       ORDER BY created_at DESC
       LIMIT 100`
    );
    return NextResponse.json({ media: res.rows });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      url,
      platform,
      media_type,
      title,
      description,
      thumbnail_url,
      embed_id,
      embed_url,
      author_name,
      curator_note,
      status,
    } = body;

    if (!url || !platform) {
      return NextResponse.json({ error: 'URL and platform are required' }, { status: 400 });
    }

    const res = await query(
      `INSERT INTO media_items (
         url, platform, media_type, title, description, thumbnail_url,
         embed_id, embed_url, author_name, curator_note, status
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, COALESCE($11, 'published'))
       RETURNING *`,
      [
        url,
        platform,
        media_type || 'video',
        title || '',
        description || '',
        thumbnail_url || '',
        embed_id || null,
        embed_url || null,
        author_name || null,
        curator_note || null,
        status || 'published',
      ]
    );

    return NextResponse.json({ item: res.rows[0] });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

