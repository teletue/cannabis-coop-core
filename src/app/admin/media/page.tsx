'use client';

import { useState, useEffect, useTransition } from 'react';
import Link from 'next/link';

interface MediaItem {
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
  status: string;
  created_at: string;
}

interface PreviewData {
  url: string;
  platform: 'youtube' | 'instagram' | 'facebook' | 'tiktok' | 'twitter' | 'web';
  media_type: 'video' | 'post' | 'article';
  title: string;
  description: string;
  thumbnail_url: string;
  embed_id?: string;
  embed_url?: string;
  author_name?: string;
}

export default function AdminMediaPage() {
  const [url, setUrl] = useState('');
  const [curatorNote, setCuratorNote] = useState('');
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [items, setItems] = useState<MediaItem[]>([]);
  const [isPending, startTransition] = useTransition();

  const fetchItems = async () => {
    try {
      const res = await fetch('/api/admin/media');
      const data = await res.json();
      if (data.media) setItems(data.media);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    let ignore = false;
    fetch('/api/admin/media')
      .then(r => r.json())
      .then(data => {
        if (!ignore && data.media) setItems(data.media);
      })
      .catch(() => {});
    return () => {
      ignore = true;
    };
  }, []);

  const handleFetchPreview = async () => {
    setError(null);
    setSuccess(null);
    if (!url.trim()) return;

    setLoadingPreview(true);
    try {
      const res = await fetch('/api/admin/media/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Kunne ikke hente preview');
      }
      setPreview(data.preview);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fejl ved hentning af preview');
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleSave = () => {
    if (!preview) return;
    setError(null);
    setSuccess(null);

    startTransition(async () => {
      try {
        const res = await fetch('/api/admin/media', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...preview,
            curator_note: curatorNote.trim() || null,
          }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Kunne ikke gemme');
        }

        setSuccess('Opslaget er tilføjet og publiceret på weeds.dk/media!');
        setUrl('');
        setCuratorNote('');
        setPreview(null);
        fetchItems();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Fejl ved gemning');
      }
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Er du sikker på, at du vil slette dette opslag?')) return;
    try {
      const res = await fetch(`/api/admin/media/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setItems(items.filter(item => item.id !== id));
      }
    } catch {
      alert('Kunne ikke slette');
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 font-sans">
      <header className="bg-white border-b border-stone-200 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="text-sm text-stone-500 hover:text-stone-800">
              ← CMS
            </Link>
            <span className="text-stone-300">|</span>
            <span className="text-sm font-semibold text-stone-800">Media Hub</span>
          </div>
          <Link
            href="/media"
            target="_blank"
            className="text-xs px-3 py-1.5 bg-[#FAF9F6] border border-stone-200 text-stone-600 rounded-lg hover:bg-stone-100 transition"
          >
            Se live side ↗
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-stone-800 mb-2">Tilføj Media & Kurateret Indhold</h1>
          <p className="text-sm text-stone-500">
            Paste et link fra YouTube, Instagram, Facebook, TikTok eller en webartikel. Siden henter automatisk preview og video.
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white border border-stone-200 rounded-xl p-6 shadow-sm mb-10">
          <div className="mb-4">
            <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wide mb-2">
              Indsæt Link (URL)
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                value={url}
                onChange={e => setUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=... eller https://www.instagram.com/reel/..."
                className="flex-1 text-sm px-3.5 py-2.5 border border-stone-200 rounded-lg focus:outline-none focus:border-stone-400 bg-white"
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleFetchPreview();
                  }
                }}
              />
              <button
                type="button"
                onClick={handleFetchPreview}
                disabled={loadingPreview || !url.trim()}
                className="px-4 py-2.5 bg-stone-800 text-white rounded-lg text-sm font-medium hover:bg-stone-700 disabled:opacity-50 transition"
              >
                {loadingPreview ? 'Henter...' : 'Hent Indhold'}
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3 mb-4 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="p-3 mb-4 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-sm">
              {success}
            </div>
          )}

          {/* Preview Section */}
          {preview && (
            <div className="mt-6 pt-6 border-t border-stone-100">
              <div className="text-xs font-semibold text-stone-400 uppercase tracking-wide mb-3">
                Forhåndsvisning
              </div>

              <div className="bg-stone-50 border border-stone-200 rounded-lg p-4 mb-4 flex flex-col md:flex-row gap-4">
                {preview.thumbnail_url && (
                  <div className="w-full md:w-48 aspect-video md:aspect-square bg-stone-200 rounded overflow-hidden flex-shrink-0">
                    <img
                      src={preview.thumbnail_url}
                      alt={preview.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-stone-200 text-stone-700">
                      {preview.platform}
                    </span>
                    <span className="text-[10px] text-stone-400 uppercase">{preview.media_type}</span>
                  </div>
                  <h3 className="text-base font-semibold text-stone-800 mb-1">{preview.title}</h3>
                  <p className="text-xs text-stone-500 line-clamp-2 mb-2">{preview.description}</p>
                  <p className="text-[11px] text-stone-400">Kilde: {preview.author_name || preview.url}</p>
                </div>
              </div>

              {/* Curator note */}
              <div className="mb-4">
                <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1.5">
                  Redaktørens kommentar / note (valgfrit)
                </label>
                <textarea
                  rows={2}
                  value={curatorNote}
                  onChange={e => setCuratorNote(e.target.value)}
                  placeholder="Skriv en kort personlig bemærkning, fx: 'Fantastisk gennemgang af terpener og ekstraktion.'"
                  className="w-full text-sm px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:border-stone-400 bg-white"
                />
              </div>

              <button
                type="button"
                onClick={handleSave}
                disabled={isPending}
                className="px-5 py-2.5 bg-emerald-700 text-white rounded-lg text-sm font-medium hover:bg-emerald-600 disabled:opacity-50 transition"
              >
                {isPending ? 'Gemmer...' : 'Gem & Publicer på weeds.dk/media'}
              </button>
            </div>
          )}
        </div>

        {/* Existing Items */}
        <div>
          <h2 className="text-lg font-bold text-stone-800 mb-4">Eksisterende Medier ({items.length})</h2>
          {items.length === 0 ? (
            <p className="text-sm text-stone-400 bg-white border border-stone-200 rounded-xl p-8 text-center">
              Der er endnu ikke tilføjet nogen medielinks. Indsæt dit første link foroven!
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {items.map(item => (
                <div
                  key={item.id}
                  className="bg-white border border-stone-200 rounded-xl p-4 flex flex-col justify-between hover:border-stone-300 transition"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-stone-100 text-stone-600">
                        {item.platform}
                      </span>
                      <span className="text-xs text-stone-400">
                        {new Date(item.created_at).toLocaleDateString('da-DK')}
                      </span>
                    </div>

                    <h4 className="text-sm font-semibold text-stone-800 mb-1 line-clamp-1">
                      {item.title}
                    </h4>

                    {item.curator_note && (
                      <p className="text-xs text-emerald-800 bg-emerald-50 p-2 rounded mb-2 italic">
                        &quot;{item.curator_note}&quot;
                      </p>
                    )}

                    <p className="text-xs text-stone-400 truncate mb-3">{item.url}</p>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-stone-100">
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-stone-500 hover:text-stone-800 underline"
                    >
                      Åbn link ↗
                    </a>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="text-xs text-red-600 hover:text-red-700"
                    >
                      Slet
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

