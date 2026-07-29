import Link from 'next/link';
import { query } from '@/lib/db';
import ArticleTable, { type DraftArticle } from '@/components/ArticleTable';
import PipelineButton from '@/components/PipelineButton';

export const dynamic = 'force-dynamic';

async function getDrafts(): Promise<DraftArticle[]> {
  try {
    const res = await query(
      `SELECT
         id, title, excerpt, review_status, pipeline_stage,
         relevancy_score, tags, affiliate_link, published_at,
         created_at, scout_output
       FROM draft_articles
       ORDER BY created_at DESC
       LIMIT 100`
    );
    return res.rows as DraftArticle[];
  } catch {
    return [];
  }
}

export default async function DraftsPage() {
  const drafts = await getDrafts();

  return (
    <div className="min-h-screen bg-stone-50 font-sans">
      <header className="bg-white border-b border-stone-200 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="text-sm text-stone-500 hover:text-stone-800">← CMS</Link>
            <span className="text-stone-300">|</span>
            <span className="text-sm font-semibold text-stone-800">Kladder</span>
          </div>
          <PipelineButton />
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        <p className="text-xs text-stone-400 mb-6">
          Pipeline-genererede artikler til review. Godkend sætter status til &quot;published&quot; og kopierer til journal.
        </p>
        <ArticleTable initialDrafts={drafts} />
      </main>
    </div>
  );
}
