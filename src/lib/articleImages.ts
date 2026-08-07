import { query } from '@/lib/db';

/**
 * Reusable article-image upload service.
 *
 * Uploads an image to the `article-images` Supabase Storage bucket via the
 * Storage REST API (service role key, server-side only) and registers the
 * result in the `article_images` metadata table.
 *
 * Called today by the CMS upload route (source: 'manual'). A future automated
 * image-generation or ingestion pipeline should call this same function with
 * source: 'automated' — no change to the article data model needed.
 */

const BUCKET = 'article-images';

const ALLOWED_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png':  'png',
  'image/webp': 'webp',
};

export interface UploadArticleImageInput {
  buffer:   ArrayBuffer | Buffer;
  filename: string;
  mimeType: string;
  altText?: string;
  source?:  'manual' | 'automated';
}

export interface ArticleImage {
  id:                string;
  storage_path:      string;
  public_url:        string;
  original_filename: string | null;
  alt_text:          string | null;
  mime_type:         string | null;
  size_bytes:        number | null;
  source:            string;
  uploaded_at:       string;
}

function getConfig() {
  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error('SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) is not set.');
  }
  if (!serviceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set. Add it in Vercel → Settings → Environment Variables (Supabase → Project Settings → API → service_role).');
  }
  return { supabaseUrl: supabaseUrl.replace(/\/$/, ''), serviceKey };
}

function sanitizeFilename(name: string): string {
  const base = name.replace(/\.[^.]+$/, '');
  const safe = base
    .toLowerCase()
    .replace(/[æ]/g, 'ae').replace(/[ø]/g, 'oe').replace(/[å]/g, 'aa')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 60);
  return safe || 'image';
}

export async function uploadArticleImage(input: UploadArticleImageInput): Promise<ArticleImage> {
  const ext = ALLOWED_MIME[input.mimeType];
  if (!ext) {
    throw new Error(`Unsupported image type "${input.mimeType}". Allowed: JPG, PNG, WebP.`);
  }

  const { supabaseUrl, serviceKey } = getConfig();
  const storagePath = `articles/${Date.now()}-${sanitizeFilename(input.filename)}.${ext}`;

  const uploadRes = await fetch(`${supabaseUrl}/storage/v1/object/${BUCKET}/${storagePath}`, {
    method: 'POST',
    headers: {
      Authorization:  `Bearer ${serviceKey}`,
      apikey:         serviceKey,
      'Content-Type': input.mimeType,
      'x-upsert':     'true',
    },
    body: input.buffer as BodyInit,
  });

  if (!uploadRes.ok) {
    const text = await uploadRes.text();
    throw new Error(`Supabase Storage upload failed (${uploadRes.status}): ${text}`);
  }

  const publicUrl = `${supabaseUrl}/storage/v1/object/public/${BUCKET}/${storagePath}`;

  const res = await query(
    `INSERT INTO article_images (
       storage_path, public_url, original_filename,
       alt_text, mime_type, size_bytes, source
     ) VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [
      storagePath,
      publicUrl,
      input.filename,
      input.altText ?? null,
      input.mimeType,
      input.buffer.byteLength,
      input.source ?? 'manual',
    ]
  );

  return res.rows[0] as ArticleImage;
}
