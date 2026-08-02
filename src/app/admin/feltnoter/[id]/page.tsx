import { notFound } from 'next/navigation';
import Link from 'next/link';
import { query } from '@/lib/db';
import FeltnoteEditor from '@/components/FeltnoteEditor';

export const dynamic = 'force-dynamic';

async function getFeltnote(id: string) {
  try {
    const res = await query(
      `SELECT id, slug, title, body, excerpt, mood, status, author,
              seo_title, meta_description
       FROM feltnoter WHERE id = $1`,
      [id]
    );
    return res.rows[0] ?? null;
  } catch {
    return null;
  }
}

export default async function FeltnoteEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const note = await getFeltnote(id);

  if (!note) notFound();

  const initial = {
    ...note,
    excerpt:          note.excerpt ?? '',
    seo_title:        note.seo_title ?? '',
    meta_description: note.meta_description ?? '',
  };

  return (
    <div className="min-h-screen bg-stone-50 font-sans">
      <header className="bg-white border-b border-stone-200 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <Link href="/admin/feltnoter" className="text-sm text-stone-500 hover:text-stone-800">← Feltnoter</Link>
          <span className="text-stone-300">|</span>
          <span className="text-sm font-semibold text-stone-800 line-clamp-1">{note.title}</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <FeltnoteEditor initial={initial} isNew={false} />
      </main>
    </div>
  );
}
