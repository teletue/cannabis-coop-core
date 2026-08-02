import { notFound } from 'next/navigation';
import Link from 'next/link';
import { query } from '@/lib/db';
import SourceForm from '@/components/SourceForm';

export const dynamic = 'force-dynamic';

async function getSource(id: string) {
  try {
    const res = await query(
      `SELECT id, name, source_type, channel, url, social_url, country,
              language, topic_tags, trust_score, commercial_interest,
              collection_method, status, notes
       FROM sources WHERE id = $1`,
      [id]
    );
    return res.rows[0] ?? null;
  } catch {
    return null;
  }
}

export default async function SourceEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const source = await getSource(id);

  if (!source) notFound();

  const initial = {
    ...source,
    topic_tags:  (source.topic_tags ?? []).join(', '),
    trust_score: source.trust_score?.toString() ?? '',
    url:         source.url ?? '',
    social_url:  source.social_url ?? '',
    notes:       source.notes ?? '',
  };

  return (
    <div className="min-h-screen bg-stone-50 font-sans">
      <header className="bg-white border-b border-stone-200 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <Link href="/admin/sources" className="text-sm text-stone-500 hover:text-stone-800">← Kilder</Link>
          <span className="text-stone-300">|</span>
          <span className="text-sm font-semibold text-stone-800 line-clamp-1">{source.name}</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <SourceForm initial={initial} isNew={false} />
      </main>
    </div>
  );
}
