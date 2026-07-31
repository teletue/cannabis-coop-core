import Link from 'next/link';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

interface InboxItem {
  id: string;
  source: string;
  source_url: string | null;
  title: string;
  abstract: string | null;
  relevancy_score: number | null;
  status: string;
  created_at: string;
}

const STATUS_STYLE: Record<string, string> = {
  pending:         'bg-stone-100 text-stone-600 border-stone-200',
  promoted:        'bg-emerald-50 text-emerald-700 border-emerald-200',
  below_threshold: 'bg-red-50 text-red-600 border-red-200',
  scored:          'bg-blue-50 text-blue-700 border-blue-200',
  error:           'bg-red-100 text-red-700 border-red-300',
};

async function getInbox(): Promise<InboxItem[]> {
  try {
    const res = await query(
      `SELECT id, source, source_url, title, abstract, relevancy_score, status, created_at
       FROM raw_content_inbox
       ORDER BY created_at DESC
       LIMIT 100`
    );
    return res.rows;
  } catch {
    return [];
  }
}

export default async function InboxPage() {
  const items = await getInbox();

  return (
    <div className="min-h-screen bg-stone-50 font-sans">
      <header className="bg-white border-b border-stone-200 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="text-sm text-stone-500 hover:text-stone-800">← CMS</Link>
            <span className="text-stone-300">|</span>
            <span className="text-sm font-semibold text-stone-800">Råsignaler</span>
          </div>
          <span className="text-xs text-stone-400">{items.length} signaler</span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {items.length === 0 ? (
          <p className="text-sm text-stone-400 text-center py-16">Ingen signaler i indbakken.</p>
        ) : (
          <div className="space-y-3">
            {items.map(item => (
              <Link
                key={item.id}
                href={`/admin/inbox/${item.id}`}
                className="block bg-white border border-stone-200 rounded-xl p-5 hover:border-stone-400 hover:shadow-sm transition"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-wide">{item.source}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${STATUS_STYLE[item.status] ?? STATUS_STYLE.pending}`}>
                        {item.status}
                      </span>
                      {item.relevancy_score != null && (
                        <span className={`text-[10px] font-bold tabular-nums ${item.relevancy_score >= 75 ? 'text-emerald-600' : 'text-stone-400'}`}>
                          {item.relevancy_score}
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-medium text-stone-800 leading-snug line-clamp-2">{item.title}</p>
                    {item.abstract && (
                      <p className="text-xs text-stone-500 mt-1.5 leading-relaxed line-clamp-2">{item.abstract}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <p className="text-xs text-stone-400 whitespace-nowrap">
                      {new Date(item.created_at).toLocaleDateString('da-DK', { day: 'numeric', month: 'short' })}
                    </p>
                    <span className="text-xs text-stone-400">Rediger →</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
