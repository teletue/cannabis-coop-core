'use client';

import { useState } from 'react';
import { getTrackingData } from '@/components/ContentSensor';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  thc_percentage: number;
  category: string;
  image_url?: string;
}

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  async function handlePurchase() {
    setStatus('loading');

    try {
      // Retrieve attribution data from 30-day cookies
      const trackingData = getTrackingData();

      const checkoutPayload = {
        productId: product.id,
        productName: product.name,
        price: product.price,
        email: `demo-${Date.now()}@example.com`,
        // Include attribution cookies if available
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
      setStatus('success');

      // Reset status after 3 seconds
      setTimeout(() => setStatus('idle'), 3000);

    } catch (err) {
      console.error('Checkout error:', err);
      setStatus('error');
    }
  }

  return (
    <article className="group bg-white rounded-lg border border-[#E2E8F0] overflow-hidden hover:shadow-lg transition-shadow duration-300">
      {/* Product Image */}
      <div className="aspect-square bg-[#F7F5F0] overflow-hidden">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-2 rounded-full bg-[#9CAF88]/20 flex items-center justify-center">
                <svg className="w-8 h-8 text-[#6B8E6B]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <span className="text-xs text-[#718096] capitalize">{product.category}</span>
            </div>
          </div>
        )}
      </div>

      {/* Product Details */}
      <div className="p-6">
        <h3 className="text-lg font-medium text-[#2D3748] mb-2 group-hover:text-[#6B8E6B] transition-colors">
          {product.name}
        </h3>
        
        <p className="text-sm text-[#718096] leading-relaxed mb-4 min-h-[3.5rem]">
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
          onClick={handlePurchase}
          disabled={status === 'loading' || status === 'success'}
          className={`w-full py-3 rounded-md text-sm font-medium transition-all duration-200 ${
            status === 'success'
              ? 'bg-[#9CAF88] text-white'
              : status === 'error'
              ? 'bg-red-100 text-red-700'
              : 'bg-[#2D3748] text-white hover:bg-[#4A5568]'
          }`}
          data-sensor-id={`buy-${product.id}`}
        >
          {status === 'loading' && 'Processing...'}
          {status === 'success' && 'Order Confirmed'}
          {status === 'error' && 'Error — Try Again'}
          {status === 'idle' && 'Select & Buy'}
        </button>
      </div>
    </article>
  );
}
