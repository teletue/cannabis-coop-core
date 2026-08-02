import Link from 'next/link';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

interface Source {
  id: string;
  name: string;
  source_type: string;
  channel: string;
  url: string | null;
  country: string | null;
  language: string;
  trust_score: number | null;
  commercial_interest: string;
  collection_method: string;
  status: string;
  topic_tags: string[];
}

const STATUS_STYLE: Record<string, string> = {
  active:   'bg-emerald-50 text-emerald-700 border-emerald-200',
  paused:   'bg-amber-50 text-amber-700 border-amber-200',
  rejected: 'bg-red-50 text-red-600 border-red-200',
};

const TYPE_DK: Record<string, string> = {
  authority:   'Myndighed',
  media:       'Medie',
  shop:        'Shop',
  association: 'Forening',
  social:      'Social',
  forum:       'Forum',
  research:    'Forskning',
  internal:    'Intern',
};

async function getSources(): Promise<Source[]> {
  try {
    const res = await query(
      `SELECT id, name, source_type, channel, url, country, language,
              trust_score, commercial_interest, collection_method, status, topic_tags
       FROM sources
       ORDER BY created_at DESC`
    );
    return res.rows;
  } catch {
    return [];
  }
}

export default async function SourcesPage() {
  const sources = await getSources();

  return (
    <div className="min-h-screen bg-stone-50 font-sans">
      <header className="bg-white border-b border-stone-200 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="text-sm text-stone-500 hover:text-stone-800">← CMS</Link>
            <span className="text-stone-300">|</span>
            <span className="text-sm font-semibold text-stone-800">Kilder</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-stone-400">{sources.length} kilder</span>
            <Link
              href="/admin/sources/new"
              className="text-xs px-3 py-1.5 bg-stone-800 text-white rounded-lg hover:bg-stone-700 transition font-medium"
            >
              + Ny kilde
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {sources.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-sm text-stone-400 mb-4">Ingen kilder endnu.</p>
            <Link href="/admin/sources/new" className="text-sm text-stone-600 underline">Opret den første kilde →</Link>
          </div>
        ) : (
          <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-stone-100 bg-stone-50">
                  <th className="px-4 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wide">Navn</th>
                  <th className="px-4 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wide">Type</th>
                  <th className="px-4 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wide">Kanal</th>
                  <th className="px-4 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wide">Tillid</th>
                  <th className="px-4 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wide">Kommerciel</th>
                  <th className="px-4 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wide">Status</th>
                  <th className="px-4 py-3 w-10" />
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50">
                {sources.map(s => (
                  <tr key={s.id} className="hover:bg-stone-50 transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/admin/sources/${s.id}`} className="font-medium text-stone-800 hover:text-stone-600">
                        {s.name}
                      </Link>
                      {s.url && (
                        <p className="text-xs text-stone-400 font-mono truncate max-w-[180px]">{s.url}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-stone-600">{TYPE_DK[s.source_type] ?? s.source_type}</td>
                    <td className="px-4 py-3 text-stone-500 text-xs font-mono">{s.channel}</td>
                    <td className="px-4 py-3">
                      {s.trust_score
                        ? <span className="text-xs font-bold text-stone-700">{'★'.repeat(s.trust_score)}</span>
                        : <span className="text-stone-300">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium ${
                        s.commercial_interest === 'none'   ? 'text-emerald-600' :
                        s.commercial_interest === 'low'    ? 'text-stone-500' :
                        s.commercial_interest === 'medium' ? 'text-amber-600' : 'text-red-600'
                      }`}>
                        {s.commercial_interest}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${STATUS_STYLE[s.status] ?? STATUS_STYLE.paused}`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/admin/sources/${s.id}`} className="text-xs text-stone-400 hover:text-stone-800">
                        Rediger →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
