import Link from 'next/link';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

async function getStats() {
  try {
    const [journal, drafts, inbox] = await Promise.all([
      query(`SELECT status, COUNT(*) as count FROM journal_articles GROUP BY status`),
      query(`SELECT review_status, COUNT(*) as count FROM draft_articles GROUP BY review_status`),
      query(`SELECT status, COUNT(*) as count FROM raw_content_inbox GROUP BY status`),
    ]);
    return { journal: journal.rows, drafts: drafts.rows, inbox: inbox.rows };
  } catch {
    return { journal: [], drafts: [], inbox: [] };
  }
}

const NAV = [
  { href: '/admin/articles', label: 'Journal Articles', desc: 'Rediger publiceret indhold direkte', icon: '📰' },
  { href: '/admin/drafts',   label: 'Kladder',          desc: 'Pipeline-genererede artikler til review', icon: '📝' },
  { href: '/admin/inbox',    label: 'Råsignaler',       desc: 'Harvestede kilder og scorede signaler', icon: '📥' },
];

export default async function AdminPage() {
  const stats = await getStats();
  const published = stats.journal.find(r => r.status === 'published')?.count ?? 0;
  const totalDrafts = stats.drafts.reduce((s, r) => s + parseInt(r.count), 0);
  const pendingDrafts = stats.drafts.find(r => r.review_status === 'pending_review')?.count ?? 0;
  const totalInbox = stats.inbox.reduce((s, r) => s + parseInt(r.count), 0);

  return (
    <div className="min-h-screen bg-stone-50 font-sans">
      <header className="bg-white border-b border-stone-200 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center gap-3">
          <span className="text-lg font-bold text-stone-800" style={{ fontFamily: 'Georgia, serif' }}>weeds.dk</span>
          <span className="text-stone-300">|</span>
          <span className="text-sm text-stone-500 font-medium">CMS</span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-bold text-stone-800 mb-1" style={{ fontFamily: 'Georgia, serif' }}>Dashboard</h1>
        <p className="text-sm text-stone-500 mb-8">Vælg et område for at administrere indhold.</p>

        {/* Quick stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
          {[
            { label: 'Publicerede artikler', value: published },
            { label: 'Kladder i alt', value: totalDrafts },
            { label: 'Afventer review', value: pendingDrafts },
            { label: 'Råsignaler', value: totalInbox },
          ].map(s => (
            <div key={s.label} className="bg-white border border-stone-200 rounded-xl px-4 py-3">
              <p className="text-2xl font-bold text-stone-800 tabular-nums">{s.value}</p>
              <p className="text-xs text-stone-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Nav cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {NAV.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className="bg-white border border-stone-200 rounded-xl p-5 hover:border-stone-400 hover:shadow-sm transition group"
            >
              <p className="text-xl mb-2">{item.icon}</p>
              <p className="text-sm font-semibold text-stone-800 group-hover:text-stone-600">{item.label}</p>
              <p className="text-xs text-stone-500 mt-1">{item.desc}</p>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
