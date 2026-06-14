'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navigation() {
  const pathname = usePathname();
  
  const isJournal = pathname?.startsWith('/journal');
  const isShop = pathname?.startsWith('/shop');
  
  return (
    <nav className="sticky top-0 z-50 bg-[#FAF9F6]/95 backdrop-blur-sm border-b border-[#E2E8F0]">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="text-lg font-light tracking-wide text-[#2D3748]">
          weeds<span className="font-medium">.dk</span>
        </Link>
        
        {/* Navigation Links */}
        <div className="flex items-center gap-8 text-sm">
          <Link 
            href="/journal" 
            className={`transition-colors ${
              isJournal 
                ? 'text-[#2D3748] font-medium' 
                : 'text-[#718096] hover:text-[#2D3748]'
            }`}
          >
            Journal
          </Link>
          <Link 
            href="/shop" 
            className={`transition-colors ${
              isShop 
                ? 'text-[#2D3748] font-medium' 
                : 'text-[#718096] hover:text-[#2D3748]'
            }`}
          >
            Shop
          </Link>
        </div>
      </div>
    </nav>
  );
}
