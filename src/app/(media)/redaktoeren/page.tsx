import type { Metadata } from 'next';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Redaktørens Side — weeds.dk',
  description: 'Personlige essays, portrætter og kommentarer om hamp, samfund og menneskesyn fra redaktøren bag weeds.dk.',
};

export default function RedaktoerenIndexPage() {
  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <header className="py-16 px-6 text-center border-b border-[#E2E8F0] mb-12">
        <p className="text-[#718096] text-xs tracking-[0.3em] uppercase mb-4">
          weeds.dk — Kommentar &amp; Essays
        </p>
        <h1 className="text-4xl md:text-5xl font-light text-[#2D3748] mb-4 tracking-tight font-serif">
          Redaktørens Side
        </h1>
        <p className="text-[#718096] text-lg max-w-2xl mx-auto font-light leading-relaxed">
          Personlige essays, portrætter af personligheder og dybdegående kommentarer til samtalen om cannabis i Danmark.
        </p>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6">
        {/* Featured Article Card */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden shadow-sm hover:shadow-md transition-shadow">
          <Link href="/redaktoeren/peterovigknudsen" className="block aspect-[16/9] md:aspect-[21/9] bg-[#F7F5F0] overflow-hidden group">
            <img
              src="/images/articles/peterovigknudsen.jpg"
              alt="Peter Øvig Knudsen essay"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          </Link>

          <div className="p-8 md:p-10">
            <div className="flex items-center gap-3 text-xs uppercase tracking-wider text-[#6B8E6B] font-medium mb-3">
              <span>Bio over danske cannabis-legender</span>
              <span>•</span>
              <span className="text-[#A0AEC0]">5 min læsning</span>
            </div>

            <h2 className="text-2xl md:text-3xl font-light text-[#2D3748] mb-4 font-serif leading-snug hover:text-[#6B8E6B] transition-colors">
              <Link href="/redaktoeren/peterovigknudsen">
                Hvad jeg ved om Peter: Peter Øvig Knudsen og samtalen vi mangler
              </Link>
            </h2>

            <p className="text-[#718096] leading-relaxed mb-6 font-light text-base">
              Om Peter Øvig Knudsens 45 års pot-rygning, bogen »Øvigs lille bog om pot«, samtalen om forbrug versus misbrug, forskellen på »høj« og »stenet«, og spørgsmålet om, hvordan vi får løftet debatten op til et sted, hvor vi kan adskille pointerne.
            </p>

            <div className="flex items-center justify-between pt-6 border-t border-[#E2E8F0]">
              <div className="flex items-center gap-3 text-xs text-[#718096]">
                <div className="w-8 h-8 rounded-full bg-[#2D3748] text-white flex items-center justify-center font-sans font-medium text-xs">
                  R
                </div>
                <span>Af Redaktøren · 10. november 2026</span>
              </div>

              <Link
                href="/redaktoeren/peterovigknudsen"
                className="text-xs font-semibold text-[#2D3748] hover:text-[#6B8E6B] transition-colors flex items-center gap-1.5"
              >
                Læs essayet <span>→</span>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
