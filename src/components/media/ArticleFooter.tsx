import Link from 'next/link';
import { query } from '@/lib/db';
import { getCountryCompliance } from '@/lib/compliance';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  thc_percentage: number;
  category: string;
}

interface ArticleFooterProps {
  articleTags: string[];
  countryCode?: string;
}

/**
 * Server Component: Queries PostgreSQL for products matching article tags
 * Returns products with compliant descriptions based on country rules
 */
async function getRelatedProducts(tags: string[], countryCode: string = 'DK'): Promise<Product[]> {
  try {
    // Get country compliance rules
    const compliance = await getCountryCompliance(countryCode);
    const thcThreshold = compliance?.thc_threshold ?? 0.30;
    const medicalClaimsForbidden = compliance?.medical_claims_forbidden ?? true;

    // Query products that share any tag with the article
    // Uses array overlap operator && to find matching tags
    const result = await query(
      `SELECT 
        id,
        name,
        ${medicalClaimsForbidden ? 'description_compliant' : 'description_standard'} as description,
        price,
        thc_percentage,
        category
      FROM products
      WHERE tags && $1::varchar[]
        AND thc_percentage <= $2
      ORDER BY price DESC
      LIMIT 3`,
      [tags, thcThreshold]
    );

    return result.rows.map(row => ({
      id: row.id,
      name: row.name,
      description: row.description,
      price: parseFloat(row.price),
      thc_percentage: parseFloat(row.thc_percentage),
      category: row.category,
    }));
  } catch (error) {
    console.error('Failed to fetch related products:', error);
    return [];
  }
}

export default async function ArticleFooter({ articleTags, countryCode = 'DK' }: ArticleFooterProps) {
  const relatedProducts = await getRelatedProducts(articleTags, countryCode);
  
  if (relatedProducts.length === 0) {
    return null;
  }

  return (
    <footer className="mt-16 pt-12 border-t border-[#E2E8F0]">
      <div className="max-w-3xl mx-auto">
        {/* Section Header */}
        <div className="mb-8">
          <p className="text-xs font-medium text-[#9CAF88] uppercase tracking-wider mb-2">
            From the Shop
          </p>
          <h3 className="text-xl font-light text-[#2D3748]">
            Explore Related Products
          </h3>
          <p className="text-sm text-[#718096] mt-1">
            Based on this article&apos;s topics: {articleTags.join(', ')}
          </p>
        </div>

        {/* Product Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {relatedProducts.map((product) => (
            <div 
              key={product.id}
              className="group bg-white rounded-lg border border-[#E2E8F0] p-4 hover:shadow-md transition-shadow"
            >
              {/* Product Image Placeholder */}
              <div className="aspect-square bg-[#F7F5F0] rounded-md mb-4 flex items-center justify-center">
                <span className="text-xs text-[#718096] capitalize">{product.category}</span>
              </div>

              {/* Product Info */}
              <h4 className="font-medium text-[#2D3748] mb-2 group-hover:text-[#6B8E6B] transition-colors">
                {product.name}
              </h4>
              
              <p className="text-xs text-[#718096] leading-relaxed mb-3 line-clamp-3">
                {product.description}
              </p>

              {/* Price & CTA */}
              <div className="flex items-center justify-between">
                <div className="flex items-baseline gap-1">
                  <span className="text-lg font-light text-[#2D3748]">
                    {product.price.toLocaleString('da-DK')}
                  </span>
                  <span className="text-xs text-[#718096]">DKK</span>
                </div>
                <Link
                  href="/shop"
                  className="text-xs font-medium text-[#2D3748] hover:text-[#6B8E6B] transition-colors"
                >
                  View →
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Shop CTA */}
        <div className="mt-8 text-center">
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#2D3748] text-white text-sm font-medium rounded-md hover:bg-[#4A5568] transition-colors"
          >
            Browse Full Collection
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </div>
    </footer>
  );
}
