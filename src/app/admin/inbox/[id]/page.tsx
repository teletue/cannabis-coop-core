import { notFound } from 'next/navigation';
import Link from 'next/link';
import { query } from '@/lib/db';
import RawSignalEditor from '@/components/RawSignalEditor';

export const dynamic = 'force-dynamic';

interface RawSignal {
  id: string;
  source: string;
  source_id: string | null;
  source_url: string | null;
  title: string;
  abstract: string | null;
  published_at: string | null;
  authors: string[] | null;
  relevancy_score: number | null;
  scout_output: Record<string, unknown> | null;
  status: string;
  editor_notes: string | null;
  created_at: string;
}

async function getSignal(id: string): Promise<RawSignal | null> {
  try {
    const res = await query(
      `SELECT id, source, source_id, source_url, title, abstract,
              published_at, authors, relevancy_score, scout_output,
              status, editor_notes, created_at
       FROM raw_content_inbox
       WHERE id = $1`,
      [id]
    );
    return res.rows[0] ?? null;
  } catch {
    return null;
  }
}

export default async function RawSignalPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const signal = await getSignal(id);

  if (!signal) notFound();

  return (
    <div className="min-h-screen bg-stone-50 font-sans">
      <header className="bg-white border-b border-stone-200 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <Link href="/admin/inbox" className="text-sm text-stone-500 hover:text-stone-800">← Råsignaler</Link>
          <span className="text-stone-300">|</span>
          <span className="text-sm font-semibold text-stone-800 line-clamp-1">{signal.title}</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <RawSignalEditor signal={signal} />
      </main>
    </div>
  );
}
