'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getTrackingData } from '@/components/ContentSensor';

interface Product {
  id: string;
  shopify_product_id: string;
  name: string;
  description: string;
  thc_percentage: number;
  price: number;
  image_url: string | null;
  category: string;
}

interface ComplianceInfo {
  thc_threshold: number;
  medical_claims_forbidden: boolean;
}

interface ProductsResponse {
  success: boolean;
  country: string;
  compliance: ComplianceInfo;
  products: Product[];
  count: number;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [compliance, setCompliance] = useState<ComplianceInfo | null>(null);
  const [country, setCountry] = useState<string>('DK');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checkoutStatus, setCheckoutStatus] = useState<{ [key: string]: 'idle' | 'loading' | 'success' | 'error' }>({});

  useEffect(() => {
    async function fetchProducts() {
      try {
        const response = await fetch('/api/products');
        if (!response.ok) {
          throw new Error('Failed to fetch products');
        }
        const data: ProductsResponse = await response.json();
        setProducts(data.products);
        setCompliance(data.compliance);
        setCountry(data.country);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, []);

  async function handlePurchase(product: Product) {
    setCheckoutStatus(prev => ({ ...prev, [product.id]: 'loading' }));

    try {
      // Retrieve tracking data from sessionStorage
      const trackingData = getTrackingData();

      const checkoutPayload = {
        productId: product.id,
        productName: product.name,
        price: product.price,
        email: `demo-${Date.now()}@example.com`, // Mock email for demo
        // Include tracking parameters if available
        gclid: trackingData?.gclid,
        click_id: trackingData?.click_id,
        utm_source: trackingData?.utm_source,
        affiliate_id: trackingData?.affiliate_id,
      };

      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(checkoutPayload),
      });

      if (!response.ok) {
        throw new Error('Checkout failed');
      }

      const result = await response.json();
      console.log('Checkout successful:', result);
      setCheckoutStatus(prev => ({ ...prev, [product.id]: 'success' }));

      // Reset status after 3 seconds
      setTimeout(() => {
        setCheckoutStatus(prev => ({ ...prev, [product.id]: 'idle' }));
      }, 3000);

    } catch (err) {
      console.error('Checkout error:', err);
      setCheckoutStatus(prev => ({ ...prev, [product.id]: 'error' }));
    }
  }

  // Group products by category
  const productsByCategory = products.reduce((acc, product) => {
    if (!acc[product.category]) {
      acc[product.category] = [];
    }
    acc[product.category].push(product);
    return acc;
  }, {} as Record<string, Product[]>);

  const categoryOrder = ['oils', 'topicals', 'edibles', 'teas', 'aromatherapy'];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center">
        <div className="text-[#4A5568] text-sm tracking-widest uppercase">Loading Collection...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center">
        <div className="text-red-600 text-sm">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#2D3748]">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-[#FAF9F6]/90 backdrop-blur-md border-b border-[#E2E8F0]">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-lg font-light tracking-wide text-[#2D3748]">
            Nordic<span className="font-medium">Botanicals</span>
          </Link>
          <div className="flex items-center gap-6 text-sm">
            <span className="text-[#718096]">Region: {country}</span>
            <Link href="/" className="text-[#4A5568] hover:text-[#2D3748] transition-colors">
              Return Home
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="py-20 px-6 text-center">
        <p className="text-[#718096] text-xs tracking-[0.3em] uppercase mb-4">Est. 2024 — Copenhagen</p>
        <h1 className="text-4xl md:text-5xl font-light text-[#2D3748] mb-4 tracking-tight">
          Botanical Wellness
        </h1>
        <p className="text-[#718096] text-lg max-w-xl mx-auto font-light leading-relaxed">
          Curated hemp-derived botanicals for the discerning individual. 
          Ethically sourced, scientifically formulated.
        </p>
        
        {/* Compliance Badge */}
        {compliance && (
          <div className="mt-8 inline-flex items-center gap-2 px-4 py-2 bg-[#F7F5F0] rounded-full text-xs text-[#718096]">
            <span className="w-2 h-2 rounded-full bg-[#9CAF88]" />
            Compliant for {country} — THC ≤ {compliance.thc_threshold}%
            {compliance.medical_claims_forbidden && ' • Wellness claims only'}
          </div>
        )}
      </header>

      {/* Products Grid */}
      <main className="max-w-7xl mx-auto px-6 pb-20">
        {categoryOrder.map(category => {
          const categoryProducts = productsByCategory[category];
          if (!categoryProducts || categoryProducts.length === 0) return null;

          return (
            <section key={category} className="mb-16">
              <h2 className="text-xs tracking-[0.2em] uppercase text-[#718096] mb-8 pb-2 border-b border-[#E2E8F0]">
                {category}
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {categoryProducts.map(product => {
                  const status = checkoutStatus[product.id] || 'idle';
                  
                  return (
                    <article 
                      key={product.id}
                      className="group bg-white rounded-lg overflow-hidden border border-[#E2E8F0] hover:shadow-lg transition-shadow duration-300"
                    >
                      {/* Product Image Placeholder */}
                      <div className="aspect-square bg-[#F7F5F0] flex items-center justify-center">
                        <div className="text-center">
                          <div className="w-16 h-16 mx-auto mb-2 rounded-full bg-[#9CAF88]/20 flex items-center justify-center">
                            <svg className="w-8 h-8 text-[#6B8E6B]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                          </div>
                          <span className="text-xs text-[#718096]">{product.category}</span>
                        </div>
                      </div>

                      {/* Product Details */}
                      <div className="p-6">
                        <h3 className="text-lg font-medium text-[#2D3748] mb-2 group-hover:text-[#6B8E6B] transition-colors">
                          {product.name}
                        </h3>
                        
                        <p className="text-sm text-[#718096] leading-relaxed mb-4 min-h-[3rem]">
                          {product.description}
                        </p>

                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-light text-[#2D3748]">
                              {product.price.toLocaleString('da-DK')}
                            </span>
                            <span className="text-sm text-[#718096]">DKK</span>
                          </div>
                          <span className="text-xs text-[#718096] bg-[#F7F5F0] px-2 py-1 rounded">
                            THC {product.thc_percentage}%
                          </span>
                        </div>

                        {/* Purchase Button */}
                        <button
                          onClick={() => handlePurchase(product)}
                          disabled={status === 'loading' || status === 'success'}
                          className={`w-full py-3 rounded-md text-sm font-medium transition-all duration-200 ${
                            status === 'success'
                              ? 'bg-[#9CAF88] text-white'
                              : status === 'error'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-[#2D3748] text-white hover:bg-[#4A5568]'
                          }`}
                          data-sensor-id={`buy-${product.shopify_product_id}`}
                        >
                          {status === 'loading' && 'Processing...'}
                          {status === 'success' && 'Order Confirmed'}
                          {status === 'error' && 'Error — Try Again'}
                          {status === 'idle' && 'Select & Buy'}
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          );
        })}

        {products.length === 0 && (
          <div className="text-center py-20">
            <p className="text-[#718096] text-lg">No products available in your region.</p>
            <p className="text-[#718096] text-sm mt-2">Please check back later or contact support.</p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-[#E2E8F0] py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-[#718096]">
            © 2024 Nordic Botanicals Cooperative. All rights reserved.
          </p>
          <p className="text-xs text-[#718096]">
            Member-governed • Democratically verified suppliers
          </p>
        </div>
      </footer>
    </div>
  );
}
