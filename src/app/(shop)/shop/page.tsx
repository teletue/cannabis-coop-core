import { headers } from 'next/headers';
import { query } from '@/lib/db';
import { getCountryCompliance } from '@/lib/compliance';
import ProductCard from '@/components/shop/ProductCard';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  thc_percentage: number;
  category: string;
}

async function getProducts(countryCode: string): Promise<Product[]> {
  try {
    // Get country compliance rules
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
        category
      FROM products
      WHERE thc_percentage <= $1
      ORDER BY category, name`,
      [thcThreshold]
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
    console.error('Failed to fetch products:', error);
    return [];
  }
}

export default async function ShopPage() {
  // Get country code for compliance
  const headersList = await headers();
  const countryCode = headersList.get('x-country-code') || 'DK';
  
  const products = await getProducts(countryCode);

  // Group products by category
  const productsByCategory = products.reduce((acc, product) => {
    if (!acc[product.category]) {
      acc[product.category] = [];
    }
    acc[product.category].push(product);
    return acc;
  }, {} as Record<string, Product[]>);

  const categoryOrder = ['oils', 'topicals', 'edibles', 'teas', 'aromatherapy'];

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="py-16 px-6 text-center border-b border-[#E2E8F0]">
        <p className="text-[#718096] text-xs tracking-[0.3em] uppercase mb-4">
          weeds.dk — Shop
        </p>
        <h1 className="text-4xl md:text-5xl font-light text-[#2D3748] mb-4 tracking-tight">
          Botanical Collection
        </h1>
        <p className="text-[#718096] text-lg max-w-2xl mx-auto font-light leading-relaxed">
          Premium hemp-derived botanicals. Ethically sourced, scientifically formulated.
        </p>
        
        {/* Compliance Badge */}
        <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-[#F7F5F0] rounded-full text-xs text-[#718096]">
          <span className="w-2 h-2 rounded-full bg-[#9CAF88]" />
          Compliant for {countryCode} Region
        </div>
      </header>

      {/* Products */}
      <section className="max-w-7xl mx-auto px-6 py-12">
        {products.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-[#718096] text-lg">No products available in your region.</p>
            <p className="text-[#718096] text-sm mt-2">Please check back later.</p>
          </div>
        ) : (
          <div className="space-y-16">
            {categoryOrder.map((category) => {
              const categoryProducts = productsByCategory[category];
              if (!categoryProducts || categoryProducts.length === 0) return null;

              return (
                <section key={category}>
                  <h2 className="text-xs tracking-[0.2em] uppercase text-[#718096] mb-8 pb-2 border-b border-[#E2E8F0]">
                    {category}
                  </h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {categoryProducts.map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </section>

      {/* Attribution Notice */}
      <div className="max-w-7xl mx-auto px-6 pb-12">
        <p className="text-center text-xs text-[#718096]">
          Purchases are tracked for cooperative share attribution using 30-day first-party cookies.
        </p>
      </div>
    </div>
  );
}
