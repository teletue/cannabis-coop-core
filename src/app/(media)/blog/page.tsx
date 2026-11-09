import { blogPosts } from '@/lib/blog-data';
import Link from 'next/link';

export default function BlogIndexPage() {
  return (
    <div className="min-h-screen bg-[#070b13] text-[#f1f5f9] font-sans py-16 px-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16 border-b border-slate-900/80 pb-12">
          <span className="text-xs uppercase font-bold tracking-widest text-teal-400">
            Opinion &amp; Perspektiv
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent mt-2 mb-4">
            Mediets Stilling
          </h1>
          <p className="text-slate-400 text-sm max-w-md mx-auto leading-relaxed">
            Lederartikler, analyser og debatter om den europæiske hamp-branche og andelsbevægelsen.
          </p>
        </div>

        {/* Article list */}
        <div className="space-y-12">
          {blogPosts.map((post) => (
            <article 
              key={post.slug} 
              className="group border-b border-slate-900/40 pb-10 last:border-0"
            >
              <div className="flex items-center gap-3 text-xs text-slate-500 mb-3 font-medium">
                <span className="text-teal-400 font-bold uppercase tracking-wider">
                  {post.authorTitle}
                </span>
                <span>•</span>
                <span>{new Date(post.publishedAt).toLocaleDateString('da-DK', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                <span>•</span>
                <span>{post.readingTimeMinutes} min læsning</span>
              </div>

              <Link href={`/blog/${post.slug}`} className="block">
                <h2 className="text-2xl font-bold text-white group-hover:text-teal-300 transition duration-150 mb-3 leading-snug">
                  {post.title}
                </h2>
              </Link>

              <p className="text-slate-400 text-sm leading-relaxed mb-4">
                {post.excerpt}
              </p>

              <Link 
                href={`/blog/${post.slug}`}
                className="text-xs font-semibold text-teal-400 hover:text-teal-300 transition inline-flex items-center gap-1.5"
                data-sensor-id={`blog-read-more-${post.slug}`}
              >
                Læs fulde leder <span>→</span>
              </Link>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
