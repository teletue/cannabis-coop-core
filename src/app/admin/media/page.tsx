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
  profile_id?: string | null;
  profile_name?: string | null;
  status: string;
  created_at: string;
}

interface ProfileOption {
  id: string;
  name: string;
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
  const [profileId, setProfileId] = useState('');
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [items, setItems] = useState<MediaItem[]>([]);
  const [profiles, setProfiles] = useState<ProfileOption[]>([]);
  const [isPending, startTransition] = useTransition();

  // Edit mode state for existing media items
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{
    title: string;
    curator_note: string;
    status: string;
    profile_id: string;
  }>({ title: '', curator_note: '', status: 'published', profile_id: '' });
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

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
    fetch('/api/admin/profiles')
      .then(r => r.json())
      .then(data => {
        if (!ignore && data.profiles) setProfiles(data.profiles);
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
            profile_id: profileId || null,
          }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Kunne ikke gemme');
        }

        setSuccess('Opslaget er tilføjet og publiceret på weeds.dk/media!');
        setUrl('');
        setCuratorNote('');
        setProfileId('');
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

  const startEdit = (item: MediaItem) => {
    setEditingId(item.id);
    setEditForm({
      title: item.title || '',
      curator_note: item.curator_note || '',
      status: item.status || 'published',
      profile_id: item.profile_id || '',
    });
    setEditError(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditError(null);
  };

  const handleSaveEdit = async (id: string) => {
    setIsSavingEdit(true);
    setEditError(null);
    try {
      const res = await fetch(`/api/admin/media/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editForm,
          profile_id: editForm.profile_id || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Kunne ikke gemme ændringerne');
      }

      const data = await res.json();
      const matchedProfile = profiles.find(p => p.id === (editForm.profile_id || null));
      setItems(
        items.map(item =>
          item.id === id
            ? { ...item, ...data.item, profile_name: matchedProfile?.name || null }
            : item
        )
      );
      setEditingId(null);
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Fejl ved gemning');
    } finally {
      setIsSavingEdit(false);
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
          <div className="flex items-center gap-3">
            <Link
              href="/admin/media/profiler"
              className="text-xs px-3 py-1.5 bg-stone-800 text-white rounded-lg hover:bg-stone-700 transition font-medium"
            >
              Blå Bog &amp; Scraper →
            </Link>
            <Link
              href="/media"
              target="_blank"
              className="text-xs px-3 py-1.5 bg-[#FAF9F6] border border-stone-200 text-stone-600 rounded-lg hover:bg-stone-100 transition"
            >
              Se live side ↗
            </Link>
          </div>
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
                className="flex-1 text-sm px-3.5 py-2.5 border border-stone-200 rounded-lg focus:outline-none focus:border-stone-400 bg-white text-stone-800 placeholder-stone-400"
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

              {/* Profile link (Blå Bog) */}
              {profiles.length > 0 && (
                <div className="mb-4">
                  <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1.5">
                    Kobl til Blå Bog-profil (valgfrit)
                  </label>
                  <select
                    value={profileId}
                    onChange={e => setProfileId(e.target.value)}
                    className="w-full text-sm px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:border-stone-400 bg-white text-stone-800"
                  >
                    <option value="">— Ingen profil —</option>
                    {profiles.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

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
                  className="w-full text-sm px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:border-stone-400 bg-white text-stone-800 placeholder-stone-400"
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
              {items.map(item => {
                const isEditing = editingId === item.id;

                return (
                  <div
                    key={item.id}
                    className="bg-white border border-stone-200 rounded-xl p-4 flex flex-col justify-between hover:border-stone-300 transition"
                  >
                    {isEditing ? (
                      /* Edit Mode Form */
                      <div>
                        <div className="flex items-center justify-between mb-3 pb-2 border-b border-stone-100">
                          <span className="text-[11px] font-semibold text-stone-700 uppercase">
                            Rediger Opslag
                          </span>
                          <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-stone-100 text-stone-600">
                            {item.platform}
                          </span>
                        </div>

                        {editError && (
                          <div className="p-2 mb-3 bg-red-50 text-red-700 border border-red-200 rounded text-xs">
                            {editError}
                          </div>
                        )}

                        <div className="mb-3">
                          <label className="block text-[11px] font-semibold text-stone-600 uppercase tracking-wide mb-1">
                            Titel
                          </label>
                          <input
                            type="text"
                            value={editForm.title}
                            onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))}
                            className="w-full text-xs px-2.5 py-1.5 border border-stone-300 rounded-lg text-stone-800 bg-white focus:outline-none focus:border-stone-500"
                          />
                        </div>

                        <div className="mb-3">
                          <label className="block text-[11px] font-semibold text-stone-600 uppercase tracking-wide mb-1">
                            Redaktørnote
                          </label>
                          <textarea
                            rows={3}
                            value={editForm.curator_note}
                            onChange={e => setEditForm(f => ({ ...f, curator_note: e.target.value }))}
                            placeholder="Skriv redaktørens note..."
                            className="w-full text-xs px-2.5 py-1.5 border border-stone-300 rounded-lg text-stone-800 bg-white placeholder-stone-400 focus:outline-none focus:border-stone-500"
                          />
                        </div>

                        <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-semibold text-stone-600 uppercase tracking-wide mb-1">
                              Synlighed
                            </label>
                            <select
                              value={editForm.status}
                              onChange={e => setEditForm(f => ({ ...f, status: e.target.value }))}
                              className="w-full text-xs px-2.5 py-1.5 border border-stone-300 rounded-lg text-stone-800 bg-white focus:outline-none focus:border-stone-500"
                            >
                              <option value="published">Offentlig (vises på weeds.dk/media)</option>
                              <option value="hidden">Skjult</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-stone-600 uppercase tracking-wide mb-1">
                              Blå Bog-profil
                            </label>
                            <select
                              value={editForm.profile_id}
                              onChange={e => setEditForm(f => ({ ...f, profile_id: e.target.value }))}
                              className="w-full text-xs px-2.5 py-1.5 border border-stone-300 rounded-lg text-stone-800 bg-white focus:outline-none focus:border-stone-500"
                            >
                              <option value="">— Ingen profil —</option>
                              {profiles.map(p => (
                                <option key={p.id} value={p.id}>
                                  {p.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 pt-3 border-t border-stone-100">
                          <button
                            type="button"
                            onClick={() => handleSaveEdit(item.id)}
                            disabled={isSavingEdit}
                            className="px-3.5 py-1.5 bg-emerald-700 text-white rounded-lg text-xs font-medium hover:bg-emerald-600 disabled:opacity-50 transition"
                          >
                            {isSavingEdit ? 'Gemmer...' : 'Gem ændringer'}
                          </button>
                          <button
                            type="button"
                            onClick={cancelEdit}
                            disabled={isSavingEdit}
                            className="px-3 py-1.5 bg-stone-100 text-stone-600 rounded-lg text-xs font-medium hover:bg-stone-200 transition"
                          >
                            Annuller
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* View Mode Card */
                      <>
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-stone-100 text-stone-600">
                                {item.platform}
                              </span>
                              {item.profile_name && (
                                <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  {item.profile_name}
                                </span>
                              )}
                              {item.status === 'hidden' && (
                                <span className="text-[10px] font-medium uppercase px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                                  Skjult
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-stone-400">
                              {new Date(item.created_at).toLocaleDateString('da-DK')}
                            </span>
                          </div>

                          <h4 className="text-sm font-semibold text-stone-800 mb-1 line-clamp-1">
                            {item.title}
                          </h4>

                          {item.curator_note ? (
                            <div className="text-xs text-emerald-800 bg-emerald-50 p-2.5 rounded-lg mb-2 border-l-2 border-emerald-600">
                              <p className="italic">&quot;{item.curator_note}&quot;</p>
                              <p className="text-[10px] text-emerald-700 font-medium mt-1">Redaktørnote</p>
                            </div>
                          ) : (
                            <p className="text-xs text-stone-400 italic mb-2">Ingen redaktørnote tilføjet.</p>
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
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => startEdit(item)}
                              className="text-xs text-stone-700 hover:text-stone-900 font-medium px-2 py-1 rounded bg-stone-100 hover:bg-stone-200 transition"
                            >
                              Rediger
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(item.id)}
                              className="text-xs text-red-600 hover:text-red-700"
                            >
                              Slet
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}