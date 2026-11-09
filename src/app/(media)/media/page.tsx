import type { Metadata } from 'next';
import { query } from '@/lib/db';
import MediaFeed, { type MediaItem } from '@/components/media/MediaFeed';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Media — weeds.dk',
  description: 'Kurateret viden, videoer, podcasts og perspektiver om hamp og botanisk velvære fra hele verden.',
};

async function getMediaItems(): Promise<MediaItem[]> {
  try {
    const res = await query(
      `SELECT id, url, platform, media_type, title, description, thumbnail_url,
              embed_id, embed_url, author_name, curator_note, created_at
       FROM media_items
       WHERE status = 'published'
       ORDER BY created_at DESC
       LIMIT 60`
    );
    return res.rows;
  } catch (error) {
    console.error('Failed to fetch media items:', error);
    return [];
  }
}

export default async function MediaPage() {
  const items = await getMediaItems();

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <header className="py-16 px-6 text-center border-b border-[#E2E8F0] mb-12">
        <p className="text-[#718096] text-xs tracking-[0.3em] uppercase mb-4">
          weeds.dk — Media Hub
        </p>
        <h1 className="text-4xl md:text-5xl font-light text-[#2D3748] mb-4 tracking-tight">
          Kurateret Viden & Medier
        </h1>
        <p className="text-[#718096] text-lg max-w-2xl mx-auto font-light leading-relaxed">
          En håndplukket samling af videoer, interviews og faglige perspektiver fra YouTube, Instagram og det globale vidensnetværk.
        </p>
      </header>

      {/* Main Grid Feed */}
      <main className="max-w-7xl mx-auto px-6">
        <MediaFeed initialItems={items} />
      </main>
    </div>
  );
}

