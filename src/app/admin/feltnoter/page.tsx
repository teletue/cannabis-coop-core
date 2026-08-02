import Link from 'next/link';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

interface Feltnote {
  id: string;
  slug: string;
  title: string;
  mood: string;
  status: string;
  author: string;
  published_at: string | null;
  created_at: string;
}

const STATUS_STYLE: Record<string, string> = {
  published: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  draft:     'bg-stone-100 text-stone-600 border-stone-200',
  review:    'bg-amber-50 text-amber-700 border-amber-200',
  archived:  'bg-red-50 text-red-600 border-red-200',
};

const MOOD_DK: Record<string, string> = {
  observation: 'Observation',
  essay:       'Essay',
  critique:    'Kritik',
  rant:        'Rant',
  note:        'Note',
};

async function getFeltnoter(): Promise<Feltnote[]> {
  try {
    const res = await query(
      `SELECT id, slug, title, mood, status, author, published_at, created_at
       FROM feltnoter
       ORDER BY created_at DESC`
    );
    return res.rows;
  } catch {
    return [];
  }
}

export default async function FeltnoterPage() {
  const notes = await getFeltnoter();

  return (
    <div className="min-h-screen bg-stone-50 font-sans">
      <header className="bg-white border-b border-stone-200 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="text-sm text-stone-500 hover:text-stone-800">← CMS</Link>
            <span className="text-stone-300">|</span>
            <span className="text-sm font-semibold text-stone-800">Feltnoter</span>
            <span className="text-[10px] px-2 py-0.5 bg-stone-800 text-white rounded-full font-medium">Originalt indhold</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-stone-400">{notes.length} noter</span>
            <Link
              href="/admin/feltnoter/new"
              className="text-xs px-3 py-1.5 bg-stone-800 text-white rounded-lg hover:bg-stone-700 transition font-medium"
            >
              + Ny feltnote
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        <p className="text-xs text-stone-400 mb-6">
          Feltnoter er weeds.dk&apos;s eget redaktionelle rum — original kommentar, observationer og essays. Ikke importeret indhold.
        </p>

        {notes.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-sm text-stone-400 mb-4">Ingen feltnoter endnu.</p>
            <Link href="/admin/feltnoter/new" className="text-sm text-stone-600 underline">Skriv den første →</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {notes.map(n => (
              <Link
                key={n.id}
                href={`/admin/feltnoter/${n.id}`}
                className="block bg-white border border-stone-200 rounded-xl p-5 hover:border-stone-400 hover:shadow-sm transition"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-wide">
                        {MOOD_DK[n.mood] ?? n.mood}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${STATUS_STYLE[n.status] ?? STATUS_STYLE.draft}`}>
                        {n.status}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-stone-800 leading-snug">{n.title}</p>
                    <p className="text-xs text-stone-400 mt-1">{n.author} · {new Date(n.created_at).toLocaleDateString('da-DK', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                  </div>
                  <span className="text-xs text-stone-400 flex-shrink-0">Rediger →</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
