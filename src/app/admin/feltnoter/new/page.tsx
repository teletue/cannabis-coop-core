import Link from 'next/link';
import FeltnoteEditor from '@/components/FeltnoteEditor';

export const dynamic = 'force-dynamic';

export default function NewFeltnotePage() {
  return (
    <div className="min-h-screen bg-stone-50 font-sans">
      <header className="bg-white border-b border-stone-200 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <Link href="/admin/feltnoter" className="text-sm text-stone-500 hover:text-stone-800">← Feltnoter</Link>
          <span className="text-stone-300">|</span>
          <span className="text-sm font-semibold text-stone-800">Ny feltnote</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <FeltnoteEditor initial={{}} isNew={true} />
      </main>
    </div>
  );
}
