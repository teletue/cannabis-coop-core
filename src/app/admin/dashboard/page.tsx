import { query } from '@/lib/db';
import ArticleTable, { type DraftArticle } from '@/components/ArticleTable';
import PipelineButton from '@/components/PipelineButton';
import Link from 'next/link';

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
  } catch (err) {
    console.error('[AdminDashboard] Failed to fetch drafts:', err);
    return [];
  }
}

async function getPipelineStats() {
  try {
    const inbox = await query(
      `SELECT status, COUNT(*) as count FROM raw_content_inbox GROUP BY status`
    );
    const drafts = await query(
      `SELECT review_status, COUNT(*) as count FROM draft_articles GROUP BY review_status`
    );
    return { inbox: inbox.rows, drafts: drafts.rows };
  } catch {
    return { inbox: [], drafts: [] };
  }
}

export default async function AdminDashboardPage() {
  const [drafts, stats] = await Promise.all([getDrafts(), getPipelineStats()]);

  const totalInbox = stats.inbox.reduce((s, r) => s + parseInt(r.count), 0);
  const pending = stats.drafts.find(r => r.review_status === 'pending_review')?.count ?? 0;
  const published = stats.drafts.find(r => r.review_status === 'published')?.count ?? 0;
  const totalDrafts = stats.drafts.reduce((s, r) => s + parseInt(r.count), 0);

  return (
    <div className="min-h-screen bg-[#FAF9F6] font-sans">

      {/* Top navigation */}
      <header className="border-b border-stone-200 bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="text-sm font-semibold text-stone-800 tracking-tight">
              weeds.dk
            </Link>
            <span className="text-stone-300">|</span>
            <span className="text-sm text-stone-500 font-medium">Redaktionsdashboard</span>
          </div>
          <PipelineButton />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10">

        {/* Page title */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-stone-800 tracking-tight" style={{ fontFamily: 'Georgia, serif' }}>
            Artikeloversigt
          </h1>
          <p className="text-stone-500 text-sm mt-1">
            Gennemse, godkend og tilknyt affiliate-links til alle indkommende artikler.
          </p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {[
            { label: 'Indbakke i alt', value: totalInbox, sub: 'råsignaler' },
            { label: 'Kladder i alt', value: totalDrafts, sub: 'til review' },
            { label: 'Afventer review', value: pending, sub: 'kræver handling', highlight: Number(pending) > 0 },
            { label: 'Publiceret', value: published, sub: 'live artikler' },
          ].map(stat => (
            <div
              key={stat.label}
              className={`bg-white border rounded-xl px-5 py-4 ${stat.highlight ? 'border-amber-300 bg-amber-50' : 'border-stone-200'}`}
            >
              <p className={`text-2xl font-bold tabular-nums ${stat.highlight ? 'text-amber-700' : 'text-stone-800'}`}>
                {stat.value}
              </p>
              <p className="text-xs font-semibold text-stone-600 mt-0.5">{stat.label}</p>
              <p className="text-[11px] text-stone-400">{stat.sub}</p>
            </div>
          ))}
        </div>

        {/* Article table */}
        <div className="bg-white border border-stone-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-base font-semibold text-stone-800" style={{ fontFamily: 'Georgia, serif' }}>
              Kladder & Artikler
            </h2>
            <p className="text-xs text-stone-400">
              Klik på en titel for at se resumé · Godkend sætter status til &quot;Publiceret&quot;
            </p>
          </div>
          <ArticleTable initialDrafts={drafts} />
        </div>

      </main>
    </div>
  );
}
