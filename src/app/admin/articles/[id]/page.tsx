import { notFound } from 'next/navigation';
import Link from 'next/link';
import { query } from '@/lib/db';
import ArticleEditor from '@/components/ArticleEditor';

export const dynamic = 'force-dynamic';

interface Article {
  id: string;
  slug: string;
  title: string;
  body: string;
  excerpt: string | null;
  author: string;
  status: string;
  category: string | null;
  tags: string[];
  hero_image_url: string;
  image_alt: string | null;
  seo_title: string | null;
  meta_description: string | null;
  published_at: string;
}

async function getArticle(id: string): Promise<Article | null> {
  try {
    const res = await query(
      `SELECT id, slug, title, body, excerpt, author, status, category,
              tags, hero_image_url, image_alt, seo_title, meta_description, published_at
       FROM journal_articles WHERE id = $1`,
      [id]
    );
    return res.rows[0] ?? null;
  } catch {
    return null;
  }
}

export default async function ArticleEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const article = await getArticle(id);

  if (!article) notFound();

  return (
    <div className="min-h-screen bg-stone-50 font-sans">
      <header className="bg-white border-b border-stone-200 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <Link href="/admin/articles" className="text-sm text-stone-500 hover:text-stone-800">← Artikler</Link>
          <span className="text-stone-300">|</span>
          <span className="text-sm font-semibold text-stone-800 line-clamp-1">{article.title}</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <ArticleEditor article={article} />
      </main>
    </div>
  );
}
