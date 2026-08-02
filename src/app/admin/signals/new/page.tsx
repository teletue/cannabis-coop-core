import Link from 'next/link';
import ManualSignalForm from '@/components/ManualSignalForm';

export const dynamic = 'force-dynamic';

export default function NewSignalPage() {
  return (
    <div className="min-h-screen bg-stone-50 font-sans">
      <header className="bg-white border-b border-stone-200 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <Link href="/admin/inbox" className="text-sm text-stone-500 hover:text-stone-800">← Råsignaler</Link>
          <span className="text-stone-300">|</span>
          <span className="text-sm font-semibold text-stone-800">Nyt signal manuelt</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <ManualSignalForm />
      </main>
    </div>
  );
}
