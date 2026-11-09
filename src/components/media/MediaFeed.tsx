'use client';

import { useState } from 'react';

export interface MediaItem {
  id: string;
  url: string;
  platform: string;
  media_type: string;
  title: string;
  description: string;
  thumbnail_url: string;
  embed_id: string | null;
  embed_url: string | null;
  author_name: string | null;
  curator_note: string | null;
  created_at: string;
}

interface MediaFeedProps {
  initialItems: MediaItem[];
}

export default function MediaFeed({ initialItems }: MediaFeedProps) {
  const [activeFilter, setActiveFilter] = useState<'all' | 'video' | 'social' | 'article'>('all');
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);

  const filteredItems = initialItems.filter(item => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'video') return item.platform === 'youtube' || item.platform === 'tiktok' || item.media_type === 'video';
    if (activeFilter === 'social') return item.platform === 'instagram' || item.platform === 'facebook' || item.platform === 'twitter';
    if (activeFilter === 'article') return item.media_type === 'article' || item.platform === 'web';
    return true;
  });

  return (
    <div>
      {/* Filter Tabs */}
      <div className="flex justify-center gap-2 mb-12 flex-wrap">
        {[
          { id: 'all', label: 'Alt Indhold' },
          { id: 'video', label: 'Videoer & Podcasts' },
          { id: 'social', label: 'Social & Reels' },
          { id: 'article', label: 'Artikler & Kilder' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveFilter(tab.id as 'all' | 'video' | 'social' | 'article')}
            className={`px-4 py-2 text-xs uppercase tracking-wider rounded-full transition-all duration-200 ${
              activeFilter === tab.id
                ? 'bg-[#2D3748] text-white shadow-sm font-medium'
                : 'bg-white text-[#718096] border border-[#E2E8F0] hover:border-[#2D3748] hover:text-[#2D3748]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {filteredItems.length === 0 ? (
        <div className="text-center py-20 bg-white border border-[#E2E8F0] rounded-2xl max-w-xl mx-auto p-8">
          <p className="text-[#718096] text-base mb-2">Ingen medier fundet under dette filter.</p>
          <p className="text-xs text-[#A0AEC0]">Nyt indhold tilføjes løbende af redaktionen.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredItems.map(item => {
            const isYoutube = item.platform === 'youtube';
            const isInstagram = item.platform === 'instagram';
            const isPlaying = playingVideoId === item.id;

            return (
              <article
                key={item.id}
                className="group bg-white rounded-xl border border-[#E2E8F0] overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  {/* Media Embed / Thumbnail */}
                  <div className="relative aspect-video bg-[#F7F5F0] overflow-hidden">
                    {/* YouTube Video with click-to-play */}
                    {isYoutube && item.embed_url ? (
                      isPlaying ? (
                        <iframe
                          src={`${item.embed_url}?autoplay=1`}
                          title={item.title}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          className="w-full h-full border-0"
                        />
                      ) : (
                        <div
                          onClick={() => setPlayingVideoId(item.id)}
                          className="w-full h-full cursor-pointer relative group/thumb"
                        >
                          <img
                            src={item.thumbnail_url || `https://img.youtube.com/vi/${item.embed_id}/hqdefault.jpg`}
                            alt={item.title}
                            className="w-full h-full object-cover group-hover/thumb:scale-105 transition-transform duration-500"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-black/20 group-hover/thumb:bg-black/30 transition-colors flex items-center justify-center">
                            <div className="w-14 h-14 rounded-full bg-white/90 group-hover/thumb:bg-white text-[#2D3748] flex items-center justify-center shadow-lg transition-transform group-hover/thumb:scale-110">
                              <svg className="w-6 h-6 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M8 5v14l11-7z" />
                              </svg>
                            </div>
                          </div>
                        </div>
                      )
                    ) : isInstagram && item.embed_url ? (
                      <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-gradient-to-br from-[#FAF9F6] to-[#F1EFEA]">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#FD1D1D] to-[#833AB4] text-white flex items-center justify-center mb-3 shadow">
                          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                          </svg>
                        </div>
                        <p className="text-xs font-medium text-[#2D3748] mb-1">Instagram Opslag</p>
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] text-[#718096] hover:text-[#2D3748] underline"
                        >
                          Åbn på Instagram ↗
                        </a>
                      </div>
                    ) : item.thumbnail_url ? (
                      <img
                        src={item.thumbnail_url}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center p-6 text-center text-[#718096]">
                        <span className="text-xs uppercase tracking-wider">{item.platform}</span>
                      </div>
                    )}

                    {/* Platform Tag */}
                    <div className="absolute top-3 left-3">
                      <span className="text-[10px] font-medium tracking-wide uppercase px-2.5 py-1 rounded bg-[#FAF9F6]/90 backdrop-blur-sm text-[#2D3748] shadow-sm">
                        {item.platform}
                      </span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-6">
                    <h3 className="text-lg font-medium text-[#2D3748] mb-2 leading-snug group-hover:text-[#6B8E6B] transition-colors">
                      <a href={item.url} target="_blank" rel="noopener noreferrer">
                        {item.title}
                      </a>
                    </h3>

                    {item.curator_note && (
                      <div className="my-3 p-3 bg-[#F7F5F0] rounded-lg border-l-2 border-[#9CAF88]">
                        <p className="text-xs text-[#2D3748] font-serif italic leading-relaxed">
                          &quot;{item.curator_note}&quot;
                        </p>
                        <p className="text-[10px] text-[#718096] mt-1 font-sans uppercase tracking-wider">
                          Redaktionens note
                        </p>
                      </div>
                    )}

                    {item.description && (
                      <p className="text-xs text-[#718096] line-clamp-2 leading-relaxed mb-4">
                        {item.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Footer link */}
                <div className="px-6 py-3 bg-[#FAF9F6] border-t border-[#E2E8F0] flex items-center justify-between text-xs text-[#718096]">
                  <span>{item.author_name || item.platform}</span>
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-[#2D3748] hover:text-[#6B8E6B] transition-colors flex items-center gap-1"
                  >
                    Se kilde
                    <span aria-hidden="true">↗</span>
                  </a>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

