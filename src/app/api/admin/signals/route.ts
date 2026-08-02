import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, original_url, raw_text, editor_note, source_id, source_name, detected_topic } = body;

    if (!title?.trim()) {
      return NextResponse.json({ error: 'title is required' }, { status: 400 });
    }

    const res = await query(
      `INSERT INTO raw_content_inbox
         (source, source_id, source_name, source_url, original_url,
          title, raw_text, abstract, editor_note, detected_topic, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'new')
       RETURNING id, title, status, created_at`,
      [
        'manual',
        source_id  || null,
        source_name || null,
        original_url || null,
        original_url || null,
        title.trim(),
        raw_text   || null,
        raw_text   || null,   // abstract mirrors raw_text for manual captures
        editor_note || null,
        detected_topic || null,
      ]
    );

    return NextResponse.json({ signal: res.rows[0] }, { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
