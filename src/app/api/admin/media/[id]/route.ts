import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const runtime = 'nodejs';

interface Params {
  params: Promise<{ id: string }>;
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const res = await query(`DELETE FROM media_items WHERE id = $1 RETURNING id`, [id]);
    if (res.rowCount === 0) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json({ deleted: id });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const body = await request.json();

    const hasStatus = 'status' in body;
    const hasNote   = 'curator_note' in body;
    const hasTitle  = 'title' in body;
    const hasDesc   = 'description' in body;

    const res = await query(
      `UPDATE media_items
       SET
         status       = CASE WHEN $2::boolean THEN $3 ELSE status END,
         curator_note = CASE WHEN $4::boolean THEN $5 ELSE curator_note END,
         title        = CASE WHEN $6::boolean THEN $7 ELSE title END,
         description  = CASE WHEN $8::boolean THEN $9 ELSE description END,
         updated_at   = NOW()
       WHERE id = $1
       RETURNING *`,
      [
        id,
        hasStatus, body.status ?? 'published',
        hasNote,   body.curator_note !== undefined ? (body.curator_note ? String(body.curator_note).trim() : null) : null,
        hasTitle,  body.title ?? null,
        hasDesc,   body.description ?? null,
      ]
    );

    if (res.rowCount === 0) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({ item: res.rows[0] });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

