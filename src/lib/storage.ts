/**
 * Resolves a hero_image_url to a fully qualified public URL.
 *
 * Handles three cases:
 * 1. Already a full URL (https://...) → return as-is
 * 2. A Supabase file path (e.g. "articles/hero.jpg") → prepend Supabase Storage URL
 * 3. Null/empty → return null
 */
export function resolveImageUrl(path: string | null | undefined): string | null {
  if (!path) return null;

  // Already a full URL (Unsplash, Supabase, etc.)
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  // Supabase Storage file path
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const bucketName = process.env.NEXT_PUBLIC_SUPABASE_BUCKET ?? 'media';

  if (!supabaseUrl) {
    console.warn('[storage] NEXT_PUBLIC_SUPABASE_URL is not set – cannot resolve image path:', path);
    return null;
  }

  return `${supabaseUrl}/storage/v1/object/public/${bucketName}/${path}`;
}
