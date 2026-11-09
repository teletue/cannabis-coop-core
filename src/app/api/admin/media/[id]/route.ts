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
    const { status, curator_note, title, description } = body;

    const res = await query(
      `UPDATE media_items
       SET
         status = COALESCE($2, status),
         curator_note = COALESCE($3, curator_note),
         title = COALESCE($4, title),
         description = COALESCE($5, description),
         updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [id, status ?? null, curator_note ?? null, title ?? null, description ?? null]
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

