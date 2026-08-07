import { notFound } from 'next/navigation';
import Link from 'next/link';
import { query } from '@/lib/db';
import DraftEditor from '@/components/DraftEditor';

export const dynamic = 'force-dynamic';

interface Draft {
  id: string;
  title: string;
  body: string | null;
  excerpt: string | null;
  author: string | null;
  slug: string | null;
  review_status: string;
  relevancy_score: number | null;
  tags: string[];
  hero_image_url: string | null;
  image_alt: string | null;
  affiliate_link: string | null;
  scout_output: Record<string, unknown> | null;
  created_at: string;
}

async function getDraft(id: string): Promise<Draft | null> {
  try {
    const res = await query(
      `SELECT id, title, body, excerpt, author, slug, review_status,
              relevancy_score, tags, hero_image_url, image_alt, affiliate_link,
              scout_output, created_at
       FROM draft_articles
       WHERE id = $1`,
      [id]
    );
    return res.rows[0] ?? null;
  } catch {
    return null;
  }
}

export default async function DraftEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const draft = await getDraft(id);

  if (!draft) notFound();

  return (
    <div className="min-h-screen bg-stone-50 font-sans">
      <header className="bg-white border-b border-stone-200 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <Link href="/admin/drafts" className="text-sm text-stone-500 hover:text-stone-800">← Kladder</Link>
          <span className="text-stone-300">|</span>
          <span className="text-sm font-semibold text-stone-800 line-clamp-1">{draft.title}</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <DraftEditor draft={draft} />
      </main>
    </div>
  );
}
