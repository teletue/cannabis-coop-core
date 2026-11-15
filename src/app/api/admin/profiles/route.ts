import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const runtime = 'nodejs';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/æ/g, 'ae')
    .replace(/ø/g, 'oe')
    .replace(/å/g, 'aa')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 80);
}

export async function GET() {
  try {
    const res = await query(
      `SELECT p.*,
              (SELECT COUNT(*)::int FROM media_items m WHERE m.profile_id = p.id) AS media_count
       FROM profiles p
       ORDER BY p.is_featured DESC, p.created_at DESC`
    );
    return NextResponse.json({ profiles: res.rows });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      name,
      slug,
      entity_type,
      role_or_title,
      bio,
      image_url,
      website_url,
      social_links,
      tags,
      status,
    } = body;

    if (!name || !String(name).trim()) {
      return NextResponse.json({ error: 'Navn er påkrævet' }, { status: 400 });
    }

    const finalSlug = slug?.trim() || slugify(name);

    const res = await query(
      `INSERT INTO profiles (
         name, slug, entity_type, role_or_title, bio, image_url,
         website_url, social_links, tags, status
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, COALESCE($10, 'published'))
       RETURNING *`,
      [
        name.trim(),
        finalSlug,
        entity_type || 'person',
        role_or_title || null,
        bio || null,
        image_url || null,
        website_url || null,
        JSON.stringify(social_links || {}),
        Array.isArray(tags) ? tags : [],
        status || 'published',
      ]
    );

    return NextResponse.json({ profile: res.rows[0] });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('duplicate key')) {
      return NextResponse.json({ error: 'En profil med dette slug findes allerede' }, { status: 409 });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

