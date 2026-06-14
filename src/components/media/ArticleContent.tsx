interface ArticleContentProps {
  body: string;
}

export default function ArticleContent({ body }: ArticleContentProps) {
  // Simple paragraph splitting - in production, use a proper markdown parser
  const paragraphs = body.split('\n\n');

  return (
    <article className="prose prose-lg max-w-3xl mx-auto">
      <div className="text-[#4A5568] leading-relaxed space-y-6">
        {paragraphs.map((paragraph, index) => {
          // Skip empty paragraphs
          if (!paragraph.trim()) return null;
          
          // Check if it's a heading (starts with ## or similar)
          if (paragraph.startsWith('##')) {
            return (
              <h2 
                key={index} 
                className="text-2xl font-light text-[#2D3748] mt-12 mb-4 tracking-tight"
              >
                {paragraph.replace(/^##\s*/, '')}
              </h2>
            );
          }
          
          // Check if it's a list
          if (paragraph.includes('\n- ')) {
            const items = paragraph.split('\n- ').filter(item => item.trim());
            return (
              <ul key={index} className="space-y-2 my-6">
                {items.map((item, itemIndex) => (
                  <li key={itemIndex} className="flex items-start gap-3">
                    <span className="text-[#9CAF88] mt-2">•</span>
                    <span>{item.replace(/^- /, '')}</span>
                  </li>
                ))}
              </ul>
            );
          }
          
          // Regular paragraph
          return (
            <p key={index} className="text-lg leading-8">
              {paragraph}
            </p>
          );
        })}
      </div>
    </article>
  );
}
