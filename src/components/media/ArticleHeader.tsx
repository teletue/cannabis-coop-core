import Image from 'next/image';

interface ArticleHeaderProps {
  title: string;
  author: string;
  heroImageUrl: string;
  publishedAt: string;
}

export default function ArticleHeader({ title, author, heroImageUrl, publishedAt }: ArticleHeaderProps) {
  const formattedDate = new Date(publishedAt).toLocaleDateString('da-DK', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <header className="mb-12">
      {/* Hero Image */}
      <div className="relative w-full aspect-[21/9] mb-8 rounded-lg overflow-hidden bg-[#E2E8F0]">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-3 rounded-full bg-[#9CAF88]/20 flex items-center justify-center">
              <svg className="w-10 h-10 text-[#6B8E6B]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <span className="text-sm text-[#718096]">Hero Image</span>
          </div>
        </div>
      </div>

      {/* Title & Meta */}
      <div className="max-w-3xl mx-auto text-center">
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-light text-[#2D3748] leading-tight mb-6 tracking-tight">
          {title}
        </h1>
        
        <div className="flex items-center justify-center gap-4 text-sm text-[#718096]">
          <span>By {author}</span>
          <span className="text-[#E2E8F0]">|</span>
          <time dateTime={publishedAt}>{formattedDate}</time>
        </div>
      </div>
    </header>
  );
}
