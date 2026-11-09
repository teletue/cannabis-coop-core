import type { Metadata } from 'next';
import Link from 'next/link';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Guides — weeds.dk',
  description:
    'Praktiske guides til brug og indtagelse af lovlige hampeprodukter: opbevaring, decarboxylering, vaporizer, røgfri alternativer og mere.',
};

interface GuideArticle {
  slug: string;
  title: string;
  hero_image_url: string;
  published_at: string;
}

interface GuideSection {
  tag: string;
  label: string;
  heading: string;
  intro: string;
}

const SECTIONS: GuideSection[] = [
  {
    tag: 'guide-brug',
    label: 'Brug',
    heading: 'Brug',
    intro: 'Forstå, opbevar og vælg dine produkter med omtanke.',
  },
  {
    tag: 'guide-indtag',
    label: 'Indtag',
    heading: 'Indtag',
    intro: 'De forskellige indtagelsesformer, og hvordan de adskiller sig.',
  },
];

async function getGuides(tag: string): Promise<GuideArticle[]> {
  try {
    const result = await query(
      `SELECT slug, title, hero_image_url, published_at
       FROM journal_articles
       WHERE status = 'published' AND $1 = ANY(tags)
       ORDER BY published_at DESC`,
      [tag]
    );
    return result.rows;
  } catch (error) {
    console.error('Failed to fetch guides:', error);
    return [];
  }
}

export default async function GuidesPage() {
  const sections = await Promise.all(
    SECTIONS.map(async (section) => ({ ...section, guides: await getGuides(section.tag) }))
  );

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="py-16 px-6 text-center border-b border-[#E2E8F0]">
        <p className="text-[#718096] text-xs tracking-[0.3em] uppercase mb-4">weeds.dk — Guides</p>
        <h1 className="text-4xl md:text-5xl font-light text-[#2D3748] mb-4 tracking-tight">
          Viden før brug
        </h1>
        <p className="text-[#718096] text-lg max-w-2xl mx-auto font-light leading-relaxed">
          Rolige, faktabaserede guides til lovlige hampeprodukter. Uden anprisninger, uden genveje.
        </p>
        <nav className="mt-8 flex justify-center gap-6 text-sm">
          {SECTIONS.map((section) => (
            <a
              key={section.tag}
              href={`#${section.tag}`}
              className="text-[#718096] hover:text-[#2D3748] transition-colors"
            >
              {section.label}
            </a>
          ))}
        </nav>
      </header>

      {sections.map((section) => (
        <section
          key={section.tag}
          id={section.tag}
          className="max-w-6xl mx-auto px-6 py-12 border-b border-[#E2E8F0] last:border-b-0 scroll-mt-20"
        >
          <div className="mb-8">
            <h2 className="text-3xl font-light text-[#2D3748] tracking-tight mb-2">{section.heading}</h2>
            <p className="text-[#718096]">{section.intro}</p>
          </div>

          {section.guides.length === 0 ? (
            <p className="text-[#718096] py-8">Guides på vej.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {section.guides.map((guide) => (
                <Link
                  key={guide.slug}
                  href={`/journal/${guide.slug}`}
                  className="group bg-white rounded-lg border border-[#E2E8F0] overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="aspect-video bg-[#F7F5F0] overflow-hidden">
                    {guide.hero_image_url ? (
                      <img
                        src={guide.hero_image_url}
                        alt={guide.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-xs tracking-[0.3em] uppercase text-[#9CAF88]">
                          {section.label}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="p-5">
                    <h3 className="text-lg font-medium text-[#2D3748] group-hover:text-[#6B8E6B] transition-colors">
                      {guide.title}
                    </h3>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      ))}
    </div>
  );
}

