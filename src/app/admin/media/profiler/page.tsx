'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Profile {
  id: string;
  name: string;
  slug: string;
  entity_type: 'person' | 'company';
  role_or_title: string | null;
  bio: string | null;
  image_url: string | null;
  website_url: string | null;
  social_links: { instagram?: string; youtube?: string; linkedin?: string; twitter?: string };
  tags: string[];
  status: string;
  media_count?: number;
}

interface DiscoveredMedia {
  url: string;
  platform: 'youtube' | 'web';
  media_type: 'video' | 'article';
  title: string;
  description: string;
  thumbnail_url: string;
  embed_id?: string;
  embed_url?: string;
  author_name?: string;
  alreadyAdded?: boolean;
}

const inputCls = 'w-full text-sm px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:border-stone-400 bg-white text-stone-800 placeholder-stone-400';

export default function AdminProfilesPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [showCreate, setShowCreate] = useState(false);

  // Create form state
  const [form, setForm] = useState({
    name: '',
    entity_type: 'person' as 'person' | 'company',
    role_or_title: '',
    bio: '',
    image_url: '',
    website_url: '',
    instagram: '',
    youtube: '',
    tags: '',
  });
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    entity_type: 'person' as 'person' | 'company',
    role_or_title: '',
    bio: '',
    image_url: '',
    website_url: '',
    status: 'published',
  });
  const [savingEdit, setSavingEdit] = useState(false);

  // Discovery / Scraper state
  const [discoveringId, setDiscoveringId] = useState<string | null>(null);
  const [customQuery, setCustomQuery] = useState('');
  const [scraping, setScraping] = useState(false);
  const [discovered, setDiscovered] = useState<DiscoveredMedia[]>([]);
  const [addingUrls, setAddingUrls] = useState<Record<string, boolean>>({});

  const loadProfiles = async () => {
    try {
      const res = await fetch('/api/admin/profiles');
      const data = await res.json();
      if (data.profiles) setProfiles(data.profiles);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    let ignore = false;
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

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!form.name.trim()) {
      setFormError('Navn er påkrævet');
      return;
    }

    setCreating(true);
    try {
      const res = await fetch('/api/admin/profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          entity_type: form.entity_type,
          role_or_title: form.role_or_title,
          bio: form.bio,
          image_url: form.image_url,
          website_url: form.website_url,
          social_links: {
            ...(form.instagram ? { instagram: form.instagram } : {}),
            ...(form.youtube ? { youtube: form.youtube } : {}),
          },
          tags: form.tags
            .split(',')
            .map(t => t.trim())
            .filter(Boolean),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Kunne ikke oprette profil');

      setForm({
        name: '',
        entity_type: 'person',
        role_or_title: '',
        bio: '',
        image_url: '',
        website_url: '',
        instagram: '',
        youtube: '',
        tags: '',
      });
      setShowCreate(false);
      await loadProfiles();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Fejl ved oprettelse');
    } finally {
      setCreating(false);
    }
  };

  const startEdit = (p: Profile) => {
    setEditingId(p.id);
    setEditForm({
      name: p.name,
      entity_type: p.entity_type,
      role_or_title: p.role_or_title || '',
      bio: p.bio || '',
      image_url: p.image_url || '',
      website_url: p.website_url || '',
      status: p.status || 'published',
    });
  };

  const handleSaveEdit = async (id: string) => {
    setSavingEdit(true);
    try {
      const res = await fetch(`/api/admin/profiles/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });
      if (res.ok) {
        setEditingId(null);
        await loadProfiles();
      }
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Vil du slette denne profil fra Blå Bog? (Medier beholdes, men afkobles)')) return;
    const res = await fetch(`/api/admin/profiles/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setProfiles(profiles.filter(p => p.id !== id));
    }
  };

  const runDiscovery = async (profile: Profile, queryOverride?: string) => {
    setDiscoveringId(profile.id);
    const q = queryOverride !== undefined ? queryOverride : `${profile.name} cannabis`;
    setCustomQuery(q);
    setScraping(true);
    setDiscovered([]);

    try {
      const res = await fetch(`/api/admin/profiles/${profile.id}/discover`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customQuery: q }),
      });
      const data = await res.json();
      if (data.results) {
        setDiscovered(data.results);
      }
    } finally {
      setScraping(false);
    }
  };

  const addDiscoveredMedia = async (profileId: string, item: DiscoveredMedia) => {
    setAddingUrls(prev => ({ ...prev, [item.url]: true }));
    try {
      const res = await fetch('/api/admin/media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...item,
          profile_id: profileId,
          status: 'published',
        }),
      });

      if (res.ok) {
        setDiscovered(prev =>
          prev.map(d => (d.url === item.url ? { ...d, alreadyAdded: true } : d))
        );
        await loadProfiles();
      }
    } finally {
      setAddingUrls(prev => ({ ...prev, [item.url]: false }));
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
            <Link href="/admin/media" className="text-sm text-stone-500 hover:text-stone-800">
              Media Hub
            </Link>
            <span className="text-stone-300">|</span>
            <span className="text-sm font-semibold text-stone-800">Blå Bog (Personer &amp; Virksomheder)</span>
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
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-stone-800 mb-1">Blå Bog &amp; Automatisk Media-Scraper</h1>
            <p className="text-sm text-stone-500">
              Opret profiler for spændende personer og virksomheder, og brug scraperen til automatisk at finde videoer og artikler om dem.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowCreate(!showCreate)}
            className="px-4 py-2.5 bg-stone-800 text-white rounded-lg text-sm font-medium hover:bg-stone-700 transition self-start md:self-auto"
          >
            {showCreate ? 'Luk formular' : '+ Ny Person / Virksomhed'}
          </button>
        </div>

        {/* Create Form */}
        {showCreate && (
          <form onSubmit={handleCreate} className="bg-white border border-stone-200 rounded-xl p-6 shadow-sm mb-8">
            <h2 className="text-base font-bold text-stone-800 mb-4">Opret ny profil i Blå Bog</h2>

            {formError && (
              <div className="p-3 mb-4 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm">
                {formError}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1.5">
                  Navn *
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="f.eks. Dr. Ethan Russo eller Bedrocan"
                  className={inputCls}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1.5">
                  Type
                </label>
                <select
                  value={form.entity_type}
                  onChange={e => setForm({ ...form, entity_type: e.target.value as 'person' | 'company' })}
                  className={inputCls}
                >
                  <option value="person">Person</option>
                  <option value="company">Virksomhed / Organisation</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1.5">
                  Rolle / Titel / Branche
                </label>
                <input
                  type="text"
                  value={form.role_or_title}
                  onChange={e => setForm({ ...form, role_or_title: e.target.value })}
                  placeholder="f.eks. Neurolog & Cannabinoid-forsker"
                  className={inputCls}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1.5">
                  Billede / Portræt URL (valgfrit)
                </label>
                <input
                  type="text"
                  value={form.image_url}
                  onChange={e => setForm({ ...form, image_url: e.target.value })}
                  placeholder="https://... eller /images/..."
                  className={inputCls}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1.5">
                  Officiel Hjemmeside
                </label>
                <input
                  type="url"
                  value={form.website_url}
                  onChange={e => setForm({ ...form, website_url: e.target.value })}
                  placeholder="https://..."
                  className={inputCls}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1.5">
                  Tags (komma-separeret)
                </label>
                <input
                  type="text"
                  value={form.tags}
                  onChange={e => setForm({ ...form, tags: e.target.value })}
                  placeholder="forskning, medicin, terpener"
                  className={inputCls}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1.5">
                  Instagram Link (valgfrit)
                </label>
                <input
                  type="url"
                  value={form.instagram}
                  onChange={e => setForm({ ...form, instagram: e.target.value })}
                  placeholder="https://instagram.com/..."
                  className={inputCls}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1.5">
                  YouTube Link (valgfrit)
                </label>
                <input
                  type="url"
                  value={form.youtube}
                  onChange={e => setForm({ ...form, youtube: e.target.value })}
                  placeholder="https://youtube.com/..."
                  className={inputCls}
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1.5">
                Biografi / Beskrivelse
              </label>
              <textarea
                rows={4}
                value={form.bio}
                onChange={e => setForm({ ...form, bio: e.target.value })}
                placeholder="Skriv en kort biografi og hvorfor denne person eller virksomhed er interessant..."
                className={inputCls}
              />
            </div>

            <button
              type="submit"
              disabled={creating}
              className="px-5 py-2.5 bg-emerald-700 text-white rounded-lg text-sm font-medium hover:bg-emerald-600 disabled:opacity-50 transition"
            >
              {creating ? 'Gemmer...' : 'Gem Profil i Blå Bog'}
            </button>
          </form>
        )}

        {/* Profiles List */}
        <div className="space-y-6">
          {profiles.map(profile => {
            const isEditing = editingId === profile.id;
            const isDiscovering = discoveringId === profile.id;

            return (
              <div key={profile.id} className="bg-white border border-stone-200 rounded-xl p-6 shadow-sm">
                {isEditing ? (
                  <div>
                    <h3 className="text-sm font-bold text-stone-800 mb-4">Rediger: {profile.name}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-xs font-semibold text-stone-500 mb-1">Navn</label>
                        <input
                          type="text"
                          value={editForm.name}
                          onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                          className={inputCls}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-stone-500 mb-1">Rolle / Titel</label>
                        <input
                          type="text"
                          value={editForm.role_or_title}
                          onChange={e => setEditForm({ ...editForm, role_or_title: e.target.value })}
                          className={inputCls}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-stone-500 mb-1">Hjemmeside</label>
                        <input
                          type="url"
                          value={editForm.website_url}
                          onChange={e => setEditForm({ ...editForm, website_url: e.target.value })}
                          className={inputCls}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-stone-500 mb-1">Synlighed</label>
                        <select
                          value={editForm.status}
                          onChange={e => setEditForm({ ...editForm, status: e.target.value })}
                          className={inputCls}
                        >
                          <option value="published">Offentlig</option>
                          <option value="hidden">Skjult</option>
                        </select>
                      </div>
                    </div>
                    <div className="mb-4">
                      <label className="block text-xs font-semibold text-stone-500 mb-1">Biografi</label>
                      <textarea
                        rows={3}
                        value={editForm.bio}
                        onChange={e => setEditForm({ ...editForm, bio: e.target.value })}
                        className={inputCls}
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleSaveEdit(profile.id)}
                        disabled={savingEdit}
                        className="px-4 py-2 bg-emerald-700 text-white text-xs font-medium rounded-lg hover:bg-emerald-600"
                      >
                        {savingEdit ? 'Gemmer...' : 'Gem ændringer'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="px-4 py-2 bg-stone-100 text-stone-600 text-xs font-medium rounded-lg hover:bg-stone-200"
                      >
                        Annuller
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                      <div className="flex gap-4">
                        {profile.image_url ? (
                          <img
                            src={profile.image_url}
                            alt={profile.name}
                            className="w-16 h-16 rounded-full object-cover border border-stone-200 flex-shrink-0"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-full bg-stone-200 text-stone-600 flex items-center justify-center font-bold text-xl flex-shrink-0">
                            {profile.name.charAt(0)}
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h3 className="text-lg font-bold text-stone-800">{profile.name}</h3>
                            <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-stone-100 text-stone-600">
                              {profile.entity_type === 'company' ? 'Virksomhed' : 'Person'}
                            </span>
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-emerald-50 text-emerald-700">
                              {profile.media_count ?? 0} medier tilknyttet
                            </span>
                          </div>
                          {profile.role_or_title && (
                            <p className="text-xs font-medium text-stone-500 mb-2">{profile.role_or_title}</p>
                          )}
                          {profile.bio && (
                            <p className="text-sm text-stone-600 leading-relaxed max-w-2xl">{profile.bio}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => runDiscovery(profile)}
                          className="px-3.5 py-2 bg-stone-800 text-white rounded-lg text-xs font-medium hover:bg-stone-700 transition flex items-center gap-1.5"
                        >
                          <span>🔍</span>
                          <span>Scrape nettet for media</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => startEdit(profile)}
                          className="px-3 py-2 bg-stone-100 text-stone-700 rounded-lg text-xs font-medium hover:bg-stone-200 transition"
                        >
                          Rediger
                        </button>
                        <Link
                          href={`/media/profiler/${profile.slug}`}
                          target="_blank"
                          className="px-3 py-2 bg-stone-50 border border-stone-200 text-stone-600 rounded-lg text-xs hover:bg-stone-100 transition"
                        >
                          Se side ↗
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleDelete(profile.id)}
                          className="px-2 py-2 text-xs text-red-600 hover:text-red-700"
                        >
                          Slet
                        </button>
                      </div>
                    </div>

                    {/* Discovery Scraper Panel */}
                    {isDiscovering && (
                      <div className="mt-6 pt-6 border-t border-stone-200">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                          <h4 className="text-sm font-bold text-stone-800">
                            Fundet indhold på nettet for {profile.name}
                          </h4>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={customQuery}
                              onChange={e => setCustomQuery(e.target.value)}
                              className="text-xs px-3 py-1.5 border border-stone-300 rounded-lg bg-white text-stone-800 w-56"
                              placeholder="Tilpas søgeord..."
                            />
                            <button
                              type="button"
                              onClick={() => runDiscovery(profile, customQuery)}
                              disabled={scraping}
                              className="px-3 py-1.5 bg-stone-800 text-white text-xs rounded-lg hover:bg-stone-700 disabled:opacity-50"
                            >
                              {scraping ? 'Søger...' : 'Søg igen'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setDiscoveringId(null)}
                              className="px-2 py-1.5 text-xs text-stone-400 hover:text-stone-700"
                            >
                              Luk
                            </button>
                          </div>
                        </div>

                        {scraping ? (
                          <p className="text-xs text-stone-500 py-6 text-center">
                            Scraper YouTube og Google News for videoer og artikler...
                          </p>
                        ) : discovered.length === 0 ? (
                          <p className="text-xs text-stone-500 py-4 text-center">
                            Ingen resultater fundet for &quot;{customQuery}&quot;. Prøv et andet søgeord foroven.
                          </p>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {discovered.map(item => (
                              <div
                                key={item.url}
                                className="border border-stone-200 rounded-lg p-3 bg-stone-50 flex gap-3 items-start justify-between"
                              >
                                <div className="flex gap-3 min-w-0">
                                  {item.thumbnail_url ? (
                                    <img
                                      src={item.thumbnail_url}
                                      alt={item.title}
                                      className="w-20 h-14 object-cover rounded flex-shrink-0"
                                    />
                                  ) : (
                                    <div className="w-20 h-14 bg-stone-200 rounded flex items-center justify-center text-[10px] font-semibold uppercase text-stone-500 flex-shrink-0">
                                      Nyhed
                                    </div>
                                  )}
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-1.5 mb-0.5">
                                      <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-stone-200 text-stone-700">
                                        {item.platform}
                                      </span>
                                      <span className="text-[10px] text-stone-400 truncate">
                                        {item.author_name}
                                      </span>
                                    </div>
                                    <a
                                      href={item.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-xs font-semibold text-stone-800 hover:underline line-clamp-2"
                                    >
                                      {item.title}
                                    </a>
                                  </div>
                                </div>

                                <div className="flex-shrink-0">
                                  {item.alreadyAdded ? (
                                    <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200 inline-block">
                                      ✓ Tilføjet
                                    </span>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => addDiscoveredMedia(profile.id, item)}
                                      disabled={addingUrls[item.url]}
                                      className="text-[11px] font-medium px-2.5 py-1.5 bg-emerald-700 text-white rounded hover:bg-emerald-600 disabled:opacity-50 transition whitespace-nowrap"
                                    >
                                      {addingUrls[item.url] ? 'Tilføjer...' : '+ Tilføj'}
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}

