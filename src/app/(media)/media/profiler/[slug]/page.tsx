import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { query } from '@/lib/db';
import MediaFeed, { type MediaItem } from '@/components/media/MediaFeed';

export const dynamic = 'force-dynamic';

interface Profile {
  id: string;
  name: string;
  slug: string;
  entity_type: 'person' | 'company';
  role_or_title: string | null;
  bio: string | null;
  image_url: string | null;
  website_url: string | null;
  social_links: { instagram?: string; youtube?: string; facebook?: string; linkedin?: string; twitter?: string };
  tags: string[];
}

async function getProfileData(slug: string): Promise<{ profile: Profile; media: MediaItem[] } | null> {
  try {
    const res = await query(
      `SELECT id, name, slug, entity_type, role_or_title, bio, image_url, website_url, social_links, tags
       FROM profiles
       WHERE slug = $1 AND status = 'published'`,
      [slug]
    );
    if (res.rowCount === 0) return null;

    const profile = res.rows[0] as Profile;
    const mediaRes = await query(
      `SELECT id, url, platform, media_type, title, description, thumbnail_url,
              embed_id, embed_url, author_name, curator_note, created_at
       FROM media_items
       WHERE profile_id = $1 AND status = 'published'
       ORDER BY created_at DESC`,
      [profile.id]
    );

    return { profile, media: mediaRes.rows as MediaItem[] };
  } catch (err) {
    console.error('Failed to load profile:', err);
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const data = await getProfileData(slug);
  if (!data) return {};

  return {
    title: `${data.profile.name} — Blå Bog | weeds.dk`,
    description: data.profile.bio || `${data.profile.name} (${data.profile.role_or_title || 'Blå Bog'}) på weeds.dk`,
  };
}

export default async function ProfileDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getProfileData(slug);

  if (!data) {
    notFound();
  }

  const { profile, media } = data;
  const social = profile.social_links || {};

  return (
    <div className="min-h-screen pb-20">
      {/* Top Breadcrumb */}
      <div className="max-w-5xl mx-auto px-6 pt-10 pb-4">
        <div className="flex items-center gap-2 text-xs text-[#718096] uppercase tracking-wider">
          <Link href="/media" className="hover:text-[#2D3748] transition-colors">
            Media Hub
          </Link>
          <span>/</span>
          <Link href="/media#blaa-bog" className="hover:text-[#2D3748] transition-colors">
            Blå Bog
          </Link>
          <span>/</span>
          <span className="text-[#6B8E6B] font-medium">{profile.name}</span>
        </div>
      </div>

      {/* Profile Header Card */}
      <header className="max-w-5xl mx-auto px-6 mb-14">
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-8 md:p-10 shadow-sm flex flex-col md:flex-row gap-8 items-start">
          {profile.image_url ? (
            <img
              src={profile.image_url}
              alt={profile.name}
              className="w-28 h-28 md:w-36 md:h-36 rounded-2xl object-cover border border-[#E2E8F0] flex-shrink-0"
            />
          ) : (
            <div className="w-28 h-28 md:w-36 md:h-36 rounded-2xl bg-[#F7F5F0] border border-[#E2E8F0] text-[#2D3748] flex items-center justify-center text-4xl font-serif font-light flex-shrink-0">
              {profile.name.charAt(0)}
            </div>
          )}

          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <span className="text-[11px] uppercase tracking-widest px-2.5 py-0.5 rounded bg-[#F7F5F0] text-[#6B8E6B] font-medium">
                {profile.entity_type === 'company' ? 'Virksomhed & Organisation' : 'Blå Bog — Person'}
              </span>
              {profile.tags?.map(tag => (
                <span key={tag} className="text-xs text-[#718096] bg-[#FAF9F6] px-2 py-0.5 rounded border border-[#E2E8F0]">
                  #{tag}
                </span>
              ))}
            </div>

            <h1 className="text-3xl md:text-4xl font-light text-[#2D3748] tracking-tight font-serif mb-2">
              {profile.name}
            </h1>

            {profile.role_or_title && (
              <p className="text-sm font-medium text-[#718096] mb-5">{profile.role_or_title}</p>
            )}

            {profile.bio && (
              <p className="text-base text-[#4A5568] leading-relaxed font-light mb-6">
                {profile.bio}
              </p>
            )}

            {/* External Links */}
            <div className="flex flex-wrap gap-3 pt-4 border-t border-[#E2E8F0]">
              {profile.website_url && (
                <a
                  href={profile.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs px-3.5 py-1.5 rounded-full bg-[#2D3748] text-white hover:bg-[#4A5568] transition"
                >
                  Officiel Hjemmeside ↗
                </a>
              )}
              {social.youtube && (
                <a
                  href={social.youtube}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs px-3.5 py-1.5 rounded-full bg-[#FAF9F6] border border-[#E2E8F0] text-[#2D3748] hover:border-[#2D3748] transition"
                >
                  YouTube ↗
                </a>
              )}
              {social.instagram && (
                <a
                  href={social.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs px-3.5 py-1.5 rounded-full bg-[#FAF9F6] border border-[#E2E8F0] text-[#2D3748] hover:border-[#2D3748] transition"
                >
                  Instagram ↗
                </a>
              )}
              {social.facebook && (
                <a
                  href={social.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs px-3.5 py-1.5 rounded-full bg-[#FAF9F6] border border-[#E2E8F0] text-[#2D3748] hover:border-[#2D3748] transition"
                >
                  Facebook ↗
                </a>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Related Media Section */}
      <main className="max-w-7xl mx-auto px-6">
        <div className="mb-8 border-b border-[#E2E8F0] pb-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-light text-[#2D3748] font-serif">
              Medier &amp; Kilder med {profile.name}
            </h2>
            <p className="text-xs text-[#718096] mt-1">
              Videoer, interviews og artikler kurateret i weeds.dk Media Hub.
            </p>
          </div>
          <span className="text-xs text-[#718096] bg-white px-3 py-1 rounded-full border border-[#E2E8F0]">
            {media.length} {media.length === 1 ? 'indslag' : 'indslag'}
          </span>
        </div>

        <MediaFeed initialItems={media} />
      </main>
    </div>
  );
}

