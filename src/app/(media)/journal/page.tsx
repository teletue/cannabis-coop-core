import Link from 'next/link';
import { query } from '@/lib/db';

interface Article {
  slug: string;
  title: string;
  author: string;
  hero_image_url: string;
  tags: string[];
  published_at: string;
}

async function getArticles(): Promise<Article[]> {
  try {
    const result = await query(
      `SELECT slug, title, author, hero_image_url, tags, published_at
       FROM journal_articles
       ORDER BY published_at DESC`
    );
    return result.rows;
  } catch (error) {
    console.error('Failed to fetch articles:', error);
    return [];
  }
}

export default async function JournalIndexPage() {
  const articles = await getArticles();

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="py-16 px-6 text-center border-b border-[#E2E8F0]">
        <p className="text-[#718096] text-xs tracking-[0.3em] uppercase mb-4">
          weeds.dk — Journal
        </p>
        <h1 className="text-4xl md:text-5xl font-light text-[#2D3748] mb-4 tracking-tight">
          Nordic Botanical Perspectives
        </h1>
        <p className="text-[#718096] text-lg max-w-2xl mx-auto font-light leading-relaxed">
          Scientific insights on hemp cultivation, wellness research, and cooperative commerce.
        </p>
      </header>

      {/* Articles Grid */}
      <section className="max-w-6xl mx-auto px-6 py-12">
        {articles.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-[#718096]">No articles available yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {articles.map((article) => (
              <article 
                key={article.slug}
                className="group bg-white rounded-lg border border-[#E2E8F0] overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* Hero Image */}
                <div className="aspect-video bg-[#F7F5F0] overflow-hidden">
                  {article.hero_image_url ? (
                    <img 
                      src={article.hero_image_url} 
                      alt={article.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-[#9CAF88]/20 flex items-center justify-center">
                        <svg className="w-6 h-6 text-[#6B8E6B]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-3">
                    {article.tags.slice(0, 2).map((tag) => (
                      <span 
                        key={tag}
                        className="text-xs text-[#718096] bg-[#F7F5F0] px-2 py-1 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <h2 className="text-xl font-medium text-[#2D3748] mb-2 group-hover:text-[#6B8E6B] transition-colors">
                    <Link href={`/journal/${article.slug}`}>
                      {article.title}
                    </Link>
                  </h2>

                  <p className="text-sm text-[#718096]">
                    By {article.author} · {new Date(article.published_at).toLocaleDateString('da-DK', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
