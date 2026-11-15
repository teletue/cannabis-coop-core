import type { Metadata } from 'next';
import Link from 'next/link';
import { query } from '@/lib/db';
import MediaFeed, { type MediaItem } from '@/components/media/MediaFeed';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Media & Blå Bog — weeds.dk',
  description: 'Kurateret viden, videoer, podcasts samt vores Blå Bog over markante personer og virksomheder.',
};

interface PublicProfile {
  id: string;
  name: string;
  slug: string;
  entity_type: 'person' | 'company';
  role_or_title: string | null;
  bio: string | null;
  image_url: string | null;
  media_count: number;
}

async function getMediaItems(): Promise<MediaItem[]> {
  try {
    const res = await query(
      `SELECT m.id, m.url, m.platform, m.media_type, m.title, m.description, m.thumbnail_url,
              m.embed_id, m.embed_url, m.author_name, m.curator_note, m.created_at,
              p.name AS profile_name, p.slug AS profile_slug
       FROM media_items m
       LEFT JOIN profiles p ON m.profile_id = p.id
       WHERE m.status = 'published'
       ORDER BY m.created_at DESC
       LIMIT 60`
    );
    return res.rows;
  } catch (error) {
    console.error('Failed to fetch media items:', error);
    return [];
  }
}

async function getProfiles(): Promise<PublicProfile[]> {
  try {
    const res = await query(
      `SELECT p.id, p.name, p.slug, p.entity_type, p.role_or_title, p.bio, p.image_url,
              (SELECT COUNT(*)::int FROM media_items m WHERE m.profile_id = p.id AND m.status = 'published') AS media_count
       FROM profiles p
       WHERE p.status = 'published'
       ORDER BY p.is_featured DESC, p.created_at DESC
       LIMIT 30`
    );
    return res.rows;
  } catch (error) {
    console.error('Failed to fetch profiles:', error);
    return [];
  }
}

export default async function MediaPage() {
  const [items, profiles] = await Promise.all([getMediaItems(), getProfiles()]);

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <header className="py-16 px-6 text-center border-b border-[#E2E8F0] mb-12">
        <p className="text-[#718096] text-xs tracking-[0.3em] uppercase mb-4">
          weeds.dk — Media Hub
        </p>
        <h1 className="text-4xl md:text-5xl font-light text-[#2D3748] mb-4 tracking-tight">
          Kurateret Viden &amp; Medier
        </h1>
        <p className="text-[#718096] text-lg max-w-2xl mx-auto font-light leading-relaxed">
          En håndplukket samling af videoer, interviews og faglige perspektiver samt vores Blå Bog over markante stemmer og aktører.
        </p>
        {profiles.length > 0 && (
          <div className="mt-6 flex justify-center gap-4 text-xs">
            <a
              href="#medier"
              className="px-4 py-1.5 rounded-full bg-white border border-[#E2E8F0] text-[#2D3748] hover:border-[#2D3748] transition"
            >
              Medie-feed ({items.length})
            </a>
            <a
              href="#blaa-bog"
              className="px-4 py-1.5 rounded-full bg-[#2D3748] text-white hover:bg-[#4A5568] transition"
            >
              Blå Bog: Personer &amp; Virksomheder ({profiles.length})
            </a>
          </div>
        )}
      </header>

      {/* Main Grid Feed */}
      <main id="medier" className="max-w-7xl mx-auto px-6 scroll-mt-24">
        <MediaFeed initialItems={items} />
      </main>

      {/* Blå Bog Directory Section */}
      {profiles.length > 0 && (
        <section id="blaa-bog" className="max-w-7xl mx-auto px-6 mt-20 pt-16 border-t border-[#E2E8F0] scroll-mt-24">
          <div className="text-center mb-12">
            <p className="text-[#6B8E6B] text-xs tracking-[0.25em] uppercase font-medium mb-2">
              Hvem er hvem
            </p>
            <h2 className="text-3xl font-light text-[#2D3748] tracking-tight font-serif mb-3">
              Blå Bog — Personer &amp; Virksomheder
            </h2>
            <p className="text-sm text-[#718096] max-w-xl mx-auto font-light">
              Portrætter, biografier og samlede mediearkiver for forfattere, forskere, organisationer og pionerer.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {profiles.map(profile => (
              <Link
                key={profile.id}
                href={`/media/profiler/${profile.slug}`}
                className="group bg-white rounded-xl border border-[#E2E8F0] p-6 hover:shadow-md hover:border-[#9CAF88] transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start gap-4 mb-4">
                    {profile.image_url ? (
                      <img
                        src={profile.image_url}
                        alt={profile.name}
                        className="w-16 h-16 rounded-full object-cover border border-[#E2E8F0] flex-shrink-0"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-[#F7F5F0] text-[#2D3748] flex items-center justify-center font-serif text-2xl font-light flex-shrink-0">
                        {profile.name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-[#F7F5F0] text-[#6B8E6B] font-medium inline-block mb-1">
                        {profile.entity_type === 'company' ? 'Virksomhed' : 'Person'}
                      </span>
                      <h3 className="text-lg font-medium text-[#2D3748] group-hover:text-[#6B8E6B] transition-colors font-serif">
                        {profile.name}
                      </h3>
                      {profile.role_or_title && (
                        <p className="text-xs text-[#718096]">{profile.role_or_title}</p>
                      )}
                    </div>
                  </div>

                  {profile.bio && (
                    <p className="text-sm text-[#4A5568] font-light line-clamp-3 leading-relaxed mb-4">
                      {profile.bio}
                    </p>
                  )}
                </div>

                <div className="pt-4 border-t border-[#E2E8F0] flex items-center justify-between text-xs text-[#718096]">
                  <span>
                    {profile.media_count} {profile.media_count === 1 ? 'tilknyttet medie' : 'tilknyttede medier'}
                  </span>
                  <span className="font-medium text-[#2D3748] group-hover:text-[#6B8E6B] transition-colors">
                    Se biografi →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
