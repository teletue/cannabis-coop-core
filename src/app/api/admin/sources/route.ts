import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const res = await query(
      `SELECT id, name, source_type, channel, url, status, trust_score
       FROM sources ORDER BY created_at DESC`
    );
    return NextResponse.json({ sources: res.rows });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      name, source_type, channel, url, social_url, country, language,
      topic_tags, trust_score, commercial_interest, collection_method, status, notes,
    } = body;

    if (!name) return NextResponse.json({ error: 'name is required' }, { status: 400 });

    const res = await query(
      `INSERT INTO sources
         (name, source_type, channel, url, social_url, country, language,
          topic_tags, trust_score, commercial_interest, collection_method, status, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
       RETURNING id, name, status`,
      [
        name, source_type ?? 'media', channel ?? 'website',
        url ?? null, social_url ?? null, country ?? null, language ?? 'da',
        Array.isArray(topic_tags) ? topic_tags : [],
        trust_score ?? null, commercial_interest ?? 'none',
        collection_method ?? 'manual', status ?? 'active', notes ?? null,
      ]
    );

    return NextResponse.json({ source: res.rows[0] }, { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
