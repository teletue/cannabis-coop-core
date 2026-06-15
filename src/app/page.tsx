import Link from 'next/link';
import { headers } from 'next/headers';
import { query } from '@/lib/db';
import { getCountryCompliance } from '@/lib/compliance';

// Types
interface Article {
  slug: string;
  title: string;
  author: string;
  hero_image_url: string;
  tags: string[];
  published_at: string;
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  thc_percentage: number;
  image_url?: string;
  category: string;
}

// Data fetching
async function getLatestArticles(): Promise<Article[]> {
  try {
    const result = await query(
      `SELECT slug, title, author, hero_image_url, tags, published_at
       FROM journal_articles
       ORDER BY published_at DESC
       LIMIT 3`
    );
    return result.rows;
  } catch (error) {
    console.error('Failed to fetch articles:', error);
    return [];
  }
}

async function getFeaturedProducts(countryCode: string): Promise<Product[]> {
  try {
    const compliance = await getCountryCompliance(countryCode);
    const thcThreshold = compliance?.thc_threshold ?? 0.30;
    const medicalClaimsForbidden = compliance?.medical_claims_forbidden ?? true;

    const result = await query(
      `SELECT 
        id,
        name,
        ${medicalClaimsForbidden ? 'description_compliant' : 'description_standard'} as description,
        price,
        thc_percentage,
        category,
        image_url
      FROM products
      WHERE thc_percentage <= $1
      ORDER BY price DESC
      LIMIT 2`,
      [thcThreshold]
    );

    return result.rows.map(row => ({
      id: row.id,
      name: row.name,
      description: row.description,
      price: parseFloat(row.price),
      thc_percentage: parseFloat(row.thc_percentage),
      category: row.category,
      image_url: row.image_url,
    }));
  } catch (error) {
    console.error('Failed to fetch products:', error);
    return [];
  }
}

export default async function LandingPage() {
  const headersList = await headers();
  const countryCode = headersList.get('x-country-code') || 'DK';
  
  const [articles, products] = await Promise.all([
    getLatestArticles(),
    getFeaturedProducts(countryCode)
  ]);

  return (
    <div className="min-h-screen bg-[#FAF9F6] font-sans">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#FAF9F6]/80 backdrop-blur-md border-b border-[#E2E8F0]/50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="text-[#2D3748] font-medium tracking-tight">
            weeds.dk
          </Link>
          <div className="flex items-center gap-8">
            <Link 
              href="/journal" 
              className="text-sm text-[#718096] hover:text-[#2D3748] transition-colors"
            >
              Journal
            </Link>
            <Link 
              href="/shop" 
              className="text-sm text-[#718096] hover:text-[#2D3748] transition-colors"
            >
              Shop
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-[#718096] text-xs tracking-[0.3em] uppercase mb-6">
            Nordic Phytochemistry
          </p>
          <h1 className="text-4xl md:text-6xl font-light text-[#2D3748] mb-6 leading-tight tracking-tight">
            The Science of 
            <span className="italic font-normal"> Botanical</span> Wellness
          </h1>
          <p className="text-[#718096] text-lg md:text-xl max-w-2xl mx-auto leading-relaxed font-light">
            Research-driven hemp formulations. Transparent sourcing. 
            Member-governed from seed to shelf.
          </p>
          
          {/* CTA Links */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-12">
            <Link
              href="/shop"
              className="px-8 py-3 bg-[#2D3748] text-white text-sm tracking-wide hover:bg-[#1a202c] transition-colors"
            >
              Explore Collection
            </Link>
            <Link
              href="/journal"
              className="px-8 py-3 border border-[#2D3748] text-[#2D3748] text-sm tracking-wide hover:bg-[#2D3748] hover:text-white transition-colors"
            >
              Read Journal
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Articles */}
      <section className="py-20 px-6 border-t border-[#E2E8F0]">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-12">
            <div>
              <p className="text-[#718096] text-xs tracking-[0.2em] uppercase mb-2">From the Journal</p>
              <h2 className="text-2xl md:text-3xl font-light text-[#2D3748]">Latest Research</h2>
            </div>
            <Link 
              href="/journal" 
              className="text-sm text-[#718096] hover:text-[#2D3748] transition-colors flex items-center gap-1"
            >
              View all
              <span className="text-lg">→</span>
            </Link>
          </div>

          {articles.length === 0 ? (
            <p className="text-[#718096] text-center py-12">No articles available.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {articles.map((article) => (
                <article key={article.slug} className="group">
                  <Link href={`/journal/${article.slug}`} className="block">
                    {/* Article Image */}
                    <div className="aspect-[4/3] bg-[#F7F5F0] overflow-hidden mb-4">
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
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01" />
                            </svg>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Article Meta */}
                    <div className="flex items-center gap-2 mb-2">
                      {article.tags.slice(0, 2).map((tag) => (
                        <span 
                          key={tag}
                          className="text-[10px] tracking-wide uppercase text-[#718096] bg-[#F7F5F0] px-2 py-1"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    <h3 className="text-lg font-medium text-[#2D3748] mb-2 group-hover:text-[#6B8E6B] transition-colors leading-snug">
                      {article.title}
                    </h3>
                    <p className="text-sm text-[#718096]">
                      By {article.author} · {new Date(article.published_at).toLocaleDateString('da-DK', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                  </Link>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-12">
            <div>
              <p className="text-[#718096] text-xs tracking-[0.2em] uppercase mb-2">From the Shop</p>
              <h2 className="text-2xl md:text-3xl font-light text-[#2D3748]">Featured Products</h2>
            </div>
            <Link 
              href="/shop" 
              className="text-sm text-[#718096] hover:text-[#2D3748] transition-colors flex items-center gap-1"
            >
              View all
              <span className="text-lg">→</span>
            </Link>
          </div>

          {products.length === 0 ? (
            <p className="text-[#718096] text-center py-12">No products available in your region.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {products.map((product) => (
                <article key={product.id} className="group">
                  <Link href="/shop" className="block">
                    {/* Product Image */}
                    <div className="aspect-square bg-[#F7F5F0] overflow-hidden mb-4">
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <div className="w-16 h-16 rounded-full bg-[#9CAF88]/20 flex items-center justify-center">
                            <span className="text-xs text-[#6B8E6B] uppercase tracking-wide">{product.category}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[10px] tracking-wide uppercase text-[#718096]">
                          {product.category}
                        </span>
                        <h3 className="text-lg font-medium text-[#2D3748] mt-1 group-hover:text-[#6B8E6B] transition-colors">
                          {product.name}
                        </h3>
                      </div>
                      <span className="text-lg font-light text-[#2D3748]">
                        {product.price.toLocaleString('da-DK')} kr
                      </span>
                    </div>
                  </Link>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-20 px-6 border-t border-[#E2E8F0]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-light text-[#2D3748] mb-4">
            Member-Governed Cooperative
          </h2>
          <p className="text-[#718096] max-w-xl mx-auto mb-8 leading-relaxed">
            Join a community of research-driven wellness. Every purchase earns cooperative shares. 
            Every voice shapes our direction.
          </p>
          <Link
            href="/shop"
            className="inline-block px-8 py-3 bg-[#9CAF88] text-white text-sm tracking-wide hover:bg-[#8BA078] transition-colors"
          >
            Begin Exploring
          </Link>
        </div>
      </section>

      {/* Simple Footer */}
      <footer className="py-8 px-6 border-t border-[#E2E8F0]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-[#718096]">
            © 2024 weeds.dk — Nordic Botanical Cooperative
          </p>
          <div className="flex items-center gap-6">
            <Link href="/journal" className="text-xs text-[#718096] hover:text-[#2D3748] transition-colors">
              Journal
            </Link>
            <Link href="/shop" className="text-xs text-[#718096] hover:text-[#2D3748] transition-colors">
              Shop
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
