import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import { query } from '@/lib/db';
import ArticleHeader from '@/components/media/ArticleHeader';
import ArticleContent from '@/components/media/ArticleContent';
import ArticleFooter from '@/components/media/ArticleFooter';

interface Article {
  slug: string;
  title: string;
  body: string;
  author: string;
  hero_image_url: string;
  tags: string[];
  published_at: string;
}

async function getArticle(slug: string): Promise<Article | null> {
  try {
    const result = await query(
      `SELECT slug, title, body, author, hero_image_url, tags, published_at
       FROM journal_articles
       WHERE slug = $1`,
      [slug]
    );
    return result.rows[0] || null;
  } catch (error) {
    console.error('Failed to fetch article:', error);
    return null;
  }
}

interface ArticlePageProps {
  params: Promise<{ slug: string }>;
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params;
  const article = await getArticle(slug);

  if (!article) {
    notFound();
  }

  // Get country code for compliance
  const headersList = await headers();
  const countryCode = headersList.get('x-country-code') || 'DK';

  return (
    <article className="min-h-screen py-12 px-6">
      <div className="max-w-4xl mx-auto">
        <ArticleHeader
          title={article.title}
          author={article.author}
          heroImageUrl={article.hero_image_url}
          publishedAt={article.published_at}
        />
        
        <ArticleContent body={article.body} />
        
        {/* Dynamic product recommendations based on article tags */}
        <ArticleFooter articleTags={article.tags} countryCode={countryCode} />
      </div>
    </article>
  );
}

// Generate static params for all articles
export async function generateStaticParams() {
  try {
    const result = await query('SELECT slug FROM journal_articles');
    return result.rows.map((row) => ({
      slug: row.slug,
    }));
  } catch (error) {
    return [];
  }
}
