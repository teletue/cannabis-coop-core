'use client';

import Link from 'next/link';

interface CheckoutSuccessProps {
  orderId: string;
  productName: string;
  amount: number;
}

export default function CheckoutSuccess({ orderId, productName, amount }: CheckoutSuccessProps) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center">
        {/* Success Icon */}
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[#9CAF88]/20 flex items-center justify-center">
          <svg className="w-10 h-10 text-[#6B8E6B]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 className="text-2xl font-light text-[#2D3748] mb-2">
          Thank You
        </h1>
        <p className="text-[#718096] mb-6">
          Your order has been confirmed and is being prepared.
        </p>

        {/* Order Details */}
        <div className="bg-[#F7F5F0] rounded-lg p-6 mb-6 text-left">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-[#718096]">Order ID</span>
              <p className="font-medium text-[#2D3748] truncate">{orderId}</p>
            </div>
            <div>
              <span className="text-[#718096]">Amount</span>
              <p className="font-medium text-[#2D3748]">{amount.toLocaleString('da-DK')} DKK</p>
            </div>
            <div className="col-span-2">
              <span className="text-[#718096]">Product</span>
              <p className="font-medium text-[#2D3748]">{productName}</p>
            </div>
          </div>
        </div>

        {/* Cooperative Message */}
        <p className="text-xs text-[#718096] mb-8">
          As a cooperative member, you&apos;ll receive share points for this purchase. 
          Check your dashboard for details.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/shop"
            className="flex-1 px-6 py-3 bg-[#2D3748] text-white text-sm font-medium rounded-md hover:bg-[#4A5568] transition-colors"
          >
            Continue Shopping
          </Link>
          <Link
            href="/dashboard"
            className="flex-1 px-6 py-3 border border-[#E2E8F0] text-[#2D3748] text-sm font-medium rounded-md hover:bg-[#F7F5F0] transition-colors"
          >
            View Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
