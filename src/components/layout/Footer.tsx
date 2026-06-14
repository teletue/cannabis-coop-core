import Link from 'next/link';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="border-t border-[#E2E8F0] bg-[#FAF9F6]">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Brand */}
          <div>
            <h3 className="text-lg font-light text-[#2D3748] mb-2">
              weeds<span className="font-medium">.dk</span>
            </h3>
            <p className="text-sm text-[#718096] leading-relaxed">
              Democratic cooperative dedicated to Nordic botanical wellness. 
              Member-governed, transparently sourced.
            </p>
          </div>
          
          {/* Navigation */}
          <div>
            <h4 className="text-xs font-medium text-[#4A5568] uppercase tracking-wider mb-4">
              Explore
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/journal" className="text-[#718096] hover:text-[#2D3748] transition-colors">
                  Journal
                </Link>
              </li>
              <li>
                <Link href="/shop" className="text-[#718096] hover:text-[#2D3748] transition-colors">
                  Shop
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="text-[#718096] hover:text-[#2D3748] transition-colors">
                  Member Dashboard
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Legal */}
          <div>
            <h4 className="text-xs font-medium text-[#4A5568] uppercase tracking-wider mb-4">
              Compliance
            </h4>
            <p className="text-xs text-[#718096] leading-relaxed">
              All products comply with EU regulations. THC content below 0.3%. 
              Not intended to diagnose, treat, cure, or prevent any disease.
            </p>
          </div>
        </div>
        
        {/* Bottom bar */}
        <div className="pt-8 border-t border-[#E2E8F0] flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-[#718096]">
            © {currentYear} weeds.dk — A Digital Cooperative
          </p>
          <p className="text-xs text-[#718096]">
            Democratically verified suppliers • Transparent governance
          </p>
        </div>
      </div>
    </footer>
  );
}
