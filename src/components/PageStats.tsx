import { query } from '@/lib/db';

interface PageStat {
  page_path: string;
  session_count: string;
  view_count: string;
}

async function getPageStats(): Promise<PageStat[]> {
  try {
    const res = await query(
      `SELECT page_path, session_count, view_count
       FROM page_session_counts
       ORDER BY view_count DESC
       LIMIT 50`
    );
    return res.rows as PageStat[];
  } catch (err) {
    console.error('[PageStats] Failed to fetch page stats:', err);
    return [];
  }
}

/**
 * Anonymous per-page statistics (sessions + page views) for admin pages.
 * Server component — reads directly from page_session_counts.
 */
export default async function PageStats({ className = '' }: { className?: string }) {
  const pageStats = await getPageStats();

  const totals = pageStats.reduce(
    (acc, r) => ({
      sessions: acc.sessions + Number(r.session_count),
      views: acc.views + Number(r.view_count),
    }),
    { sessions: 0, views: 0 }
  );

  return (
    <div className={`bg-white border border-stone-200 rounded-xl p-6 shadow-sm ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-stone-800" style={{ fontFamily: 'Georgia, serif' }}>
          Sidestatistik
        </h2>
        <p className="text-xs text-stone-400">
          Anonyme tællere · Sessioner ved sessionsstart · Sidevisninger ved hvert besøg
        </p>
      </div>
      {pageStats.length === 0 ? (
        <p className="text-sm text-stone-400">Ingen besøg registreret endnu.</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-stone-200 text-left">
              <th className="py-2 pr-4 font-semibold text-stone-600">Side</th>
              <th className="py-2 pr-4 font-semibold text-stone-600 text-right">Sessioner</th>
              <th className="py-2 font-semibold text-stone-600 text-right">Sidevisninger</th>
            </tr>
          </thead>
          <tbody>
            {pageStats.map((row) => (
              <tr key={row.page_path} className="border-b border-stone-100">
                <td className="py-2 pr-4 text-stone-700 font-mono text-xs">{row.page_path}</td>
                <td className="py-2 pr-4 text-right tabular-nums text-stone-600">
                  {Number(row.session_count).toLocaleString('da-DK')}
                </td>
                <td className="py-2 text-right tabular-nums text-stone-800 font-medium">
                  {Number(row.view_count).toLocaleString('da-DK')}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="text-xs">
              <td className="pt-3 pr-4 font-semibold text-stone-500">I alt</td>
              <td className="pt-3 pr-4 text-right tabular-nums font-semibold text-stone-600">
                {totals.sessions.toLocaleString('da-DK')}
              </td>
              <td className="pt-3 text-right tabular-nums font-semibold text-stone-800">
                {totals.views.toLocaleString('da-DK')}
              </td>
            </tr>
          </tfoot>
        </table>
      )}
    </div>
  );
}
