import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const runtime = 'nodejs';

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const res = await query(`SELECT * FROM profiles WHERE id = $1`, [id]);
    if (res.rowCount === 0) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    const mediaRes = await query(
      `SELECT * FROM media_items WHERE profile_id = $1 ORDER BY created_at DESC`,
      [id]
    );
    return NextResponse.json({ profile: res.rows[0], media: mediaRes.rows });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const body = await request.json();

    const hasName       = 'name' in body;
    const hasEntityType = 'entity_type' in body;
    const hasRole       = 'role_or_title' in body;
    const hasBio        = 'bio' in body;
    const hasImage      = 'image_url' in body;
    const hasWebsite    = 'website_url' in body;
    const hasSocial     = 'social_links' in body;
    const hasTags       = 'tags' in body;
    const hasStatus     = 'status' in body;

    const res = await query(
      `UPDATE profiles
       SET
         name          = CASE WHEN $2::boolean THEN $3 ELSE name END,
         entity_type   = CASE WHEN $4::boolean THEN $5 ELSE entity_type END,
         role_or_title = CASE WHEN $6::boolean THEN $7 ELSE role_or_title END,
         bio           = CASE WHEN $8::boolean THEN $9 ELSE bio END,
         image_url     = CASE WHEN $10::boolean THEN $11 ELSE image_url END,
         website_url   = CASE WHEN $12::boolean THEN $13 ELSE website_url END,
         social_links  = CASE WHEN $14::boolean THEN $15::jsonb ELSE social_links END,
         tags          = CASE WHEN $16::boolean THEN $17::text[] ELSE tags END,
         status        = CASE WHEN $18::boolean THEN $19 ELSE status END,
         updated_at    = NOW()
       WHERE id = $1
       RETURNING *`,
      [
        id,
        hasName,       body.name ?? '',
        hasEntityType, body.entity_type ?? 'person',
        hasRole,       body.role_or_title || null,
        hasBio,        body.bio || null,
        hasImage,      body.image_url || null,
        hasWebsite,    body.website_url || null,
        hasSocial,     JSON.stringify(body.social_links || {}),
        hasTags,       Array.isArray(body.tags) ? body.tags : [],
        hasStatus,     body.status ?? 'published',
      ]
    );

    if (res.rowCount === 0) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({ profile: res.rows[0] });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const res = await query(`DELETE FROM profiles WHERE id = $1 RETURNING id`, [id]);
    if (res.rowCount === 0) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json({ deleted: id });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

