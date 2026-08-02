import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const runtime = 'nodejs';

const VALID_STATUSES = ['active', 'paused', 'rejected'];

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      name, source_type, channel, url, social_url, country, language,
      topic_tags, trust_score, commercial_interest, collection_method, status, notes,
    } = body;

    if (status && !VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: `Invalid status: ${status}` }, { status: 400 });
    }

    const res = await query(
      `UPDATE sources SET
         name               = COALESCE($2,  name),
         source_type        = COALESCE($3,  source_type),
         channel            = COALESCE($4,  channel),
         url                = $5,
         social_url         = $6,
         country            = COALESCE($7,  country),
         language           = COALESCE($8,  language),
         topic_tags         = COALESCE($9,  topic_tags),
         trust_score        = $10,
         commercial_interest = COALESCE($11, commercial_interest),
         collection_method  = COALESCE($12, collection_method),
         status             = COALESCE($13, status),
         notes              = $14
       WHERE id = $1
       RETURNING id, name, status, updated_at`,
      [
        id,
        name ?? null, source_type ?? null, channel ?? null,
        url ?? null, social_url ?? null,
        country ?? null, language ?? null,
        Array.isArray(topic_tags) ? topic_tags : null,
        trust_score ?? null,
        commercial_interest ?? null, collection_method ?? null,
        status ?? null, notes ?? null,
      ]
    );

    if (res.rows.length === 0) {
      return NextResponse.json({ error: 'Source not found' }, { status: 404 });
    }

    return NextResponse.json({ source: res.rows[0] });
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
    const res = await query(`DELETE FROM sources WHERE id = $1 RETURNING id`, [id]);
    if (res.rows.length === 0) {
      return NextResponse.json({ error: 'Source not found' }, { status: 404 });
    }
    return NextResponse.json({ deleted: res.rows[0].id });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
