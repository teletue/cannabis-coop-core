import Link from 'next/link';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

interface JournalArticle {
  id: string;
  slug: string;
  title: string;
  author: string;
  status: string;
  category: string | null;
  tags: string[];
  published_at: string;
  updated_at: string;
}

const STATUS_STYLE: Record<string, string> = {
  published: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  draft:     'bg-stone-100 text-stone-600 border-stone-200',
  review:    'bg-amber-50 text-amber-700 border-amber-200',
  archived:  'bg-red-50 text-red-600 border-red-200',
};

async function getArticles(): Promise<JournalArticle[]> {
  try {
    const res = await query(
      `SELECT id, slug, title, author, status, category, tags, published_at, updated_at
       FROM journal_articles
       ORDER BY published_at DESC`
    );
    return res.rows;
  } catch {
    return [];
  }
}

export default async function ArticlesPage() {
  const articles = await getArticles();

  return (
    <div className="min-h-screen bg-stone-50 font-sans">
      <header className="bg-white border-b border-stone-200 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="text-sm text-stone-500 hover:text-stone-800">← CMS</Link>
            <span className="text-stone-300">|</span>
            <span className="text-sm font-semibold text-stone-800">Journal Articles</span>
          </div>
          <span className="text-xs text-stone-400">{articles.length} artikler</span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {articles.length === 0 ? (
          <p className="text-sm text-stone-400 text-center py-16">Ingen artikler fundet.</p>
        ) : (
          <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-stone-100 bg-stone-50">
                  <th className="px-4 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wide">Titel</th>
                  <th className="px-4 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wide">Status</th>
                  <th className="px-4 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wide">Kategori</th>
                  <th className="px-4 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wide">Forfatter</th>
                  <th className="px-4 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wide">Publiceret</th>
                  <th className="px-4 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wide w-10" />
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50">
                {articles.map(a => (
                  <tr key={a.id} className="hover:bg-stone-50 transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/admin/articles/${a.id}`} className="font-medium text-stone-800 hover:text-stone-600 line-clamp-1">
                        {a.title}
                      </Link>
                      <p className="text-xs text-stone-400 mt-0.5 font-mono">{a.slug}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${STATUS_STYLE[a.status] ?? STATUS_STYLE.draft}`}>
                        {a.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-stone-500">{a.category ?? '—'}</td>
                    <td className="px-4 py-3 text-stone-500">{a.author}</td>
                    <td className="px-4 py-3 text-stone-400 text-xs">
                      {new Date(a.published_at).toLocaleDateString('da-DK')}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/articles/${a.id}`}
                        className="text-xs text-stone-400 hover:text-stone-800 font-medium"
                      >
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
