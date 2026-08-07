import { NextResponse } from 'next/server';
import { uploadArticleImage } from '@/lib/articleImages';

export const runtime = 'nodejs';

// Vercel serverless caps request bodies at 4.5 MB — stay safely below it
// (multipart encoding adds overhead on top of the raw file size).
const MAX_SIZE_BYTES = 4 * 1024 * 1024; // 4 MB

/**
 * POST /api/admin/images
 * Multipart form upload: { file, alt_text? }
 * Uploads to the article-images bucket and registers metadata.
 */
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Missing file field' }, { status: 400 });
    }

    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json({ error: 'File is too large (max 5 MB)' }, { status: 400 });
    }

    const altText = formData.get('alt_text');

    const image = await uploadArticleImage({
      buffer:   await file.arrayBuffer(),
      filename: file.name,
      mimeType: file.type,
      altText:  typeof altText === 'string' && altText.trim() ? altText.trim() : undefined,
      source:   'manual',
    });

    return NextResponse.json({ image });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const status = msg.startsWith('Unsupported image type') ? 400 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
