import { blogPosts } from '@/lib/blog-data';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import ProgressBar from '@/components/ProgressBar';

interface PageProps {
  params: Promise<{ slug: string }>;
}

// Simple and robust parser to render basic markdown elements (h1, h2, paragraphs) without external dependencies
function renderMarkdown(text: string) {
  const blocks = text.split('\n\n');
  return blocks.map((block, index) => {
    const trimmed = block.trim();
    if (trimmed.startsWith('# ')) {
      return (
        <h1 key={index} className="text-3xl md:text-4xl font-extrabold text-white mt-8 mb-4 tracking-tight leading-tight">
          {trimmed.replace('# ', '')}
        </h1>
      );
    }
    if (trimmed.startsWith('## ')) {
      return (
        <h2 key={index} className="text-2xl font-bold text-slate-100 mt-8 mb-4 tracking-tight">
          {trimmed.replace('## ', '')}
        </h2>
      );
    }
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      const items = trimmed.split('\n').map(item => item.replace(/^[-*]\s+/, ''));
      return (
        <ul key={index} className="list-disc pl-6 space-y-2 text-slate-300 my-4">
          {items.map((item, itemIdx) => (
            <li key={itemIdx}>{item}</li>
          ))}
        </ul>
      );
    }
    return (
      <p key={index} className="text-slate-300 text-lg md:text-xl leading-relaxed mb-6 font-serif">
        {trimmed}
      </p>
    );
  });
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = blogPosts.find((p) => p.slug === slug);

  if (!post) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-[#070b13] text-[#f1f5f9] font-serif py-20 px-6 relative">
      <ProgressBar />

      <div className="max-w-2xl mx-auto">
        {/* Navigation back */}
        <div className="font-sans text-xs mb-10 border-b border-slate-900/60 pb-6">
          <Link 
            href="/blog" 
            className="text-teal-400 hover:text-teal-300 transition inline-flex items-center gap-1.5"
          >
            <span>←</span> Tilbage til holdninger
          </Link>
        </div>

        {/* Article Header */}
        <header className="mb-10 font-sans">
          <div className="flex items-center gap-3 text-xs text-slate-500 mb-4 font-medium">
            <span className="text-teal-400 font-bold uppercase tracking-wider">
              {post.authorTitle}
            </span>
            <span>•</span>
            <span>{new Date(post.publishedAt).toLocaleDateString('da-DK', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
            <span>•</span>
            <span>{post.readingTimeMinutes} min læsning</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-tight mb-4">
            {post.title}
          </h1>

          <div className="flex items-center gap-3 mt-6 border-t border-b border-slate-900/40 py-4">
            <div className="h-9 w-9 rounded-full bg-teal-500/10 border border-teal-500/25 flex items-center justify-center font-bold text-teal-400 text-xs font-sans">
              R
            </div>
            <div className="font-sans">
              <p className="text-xs font-bold text-slate-250">{post.author}</p>
              <p className="text-[10px] text-slate-500">Skrevet på vegne af weeds.dk</p>
            </div>
          </div>
        </header>

        {/* Article Body */}
        <main className="prose prose-slate dark:prose-invert max-w-none">
          {renderMarkdown(post.body)}
        </main>

        {/* Article Footer & Bio */}
        <footer className="mt-16 pt-10 border-t border-slate-900/60 font-sans">
          <div className="bg-[#0b1322] border border-slate-800/60 p-6 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center font-bold text-slate-950 text-base shadow-lg shadow-emerald-500/25 flex-shrink-0">
              C
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Om Redaktionen</h4>
              <p className="text-xs text-slate-400 leading-relaxed mt-1">
                Ledere og analyser udtrykker weeds.dk's officielle redaktionelle linje. Vi arbejder for et data- og vidensbaseret marked for hamp i Europa med fokus på gennemsigtighed, kvalitet og kooperativt ejerskab.
              </p>
            </div>
          </div>
          
          {/* Subtle shop CTA bridge */}
          <div className="text-center mt-12">
            <p className="text-slate-500 text-xs mb-3">Er du interesseret i vores fytokemiske formler?</p>
            <Link 
              href="/shop" 
              className="inline-flex px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-bold rounded-lg transition border border-slate-700/40 text-slate-200"
              data-sensor-id="blog-footer-shop-cta"
            >
              Gå til shoppen
            </Link>
          </div>
        </footer>
      </div>
    </div>
  );
}
