'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

export interface SourceData {
  id?: string;
  name: string;
  source_type: string;
  channel: string;
  url: string;
  social_url: string;
  country: string;
  language: string;
  topic_tags: string;
  trust_score: string;
  commercial_interest: string;
  collection_method: string;
  status: string;
  notes: string;
}

const SOURCE_TYPES = ['authority','media','shop','association','social','forum','research','internal'];
const CHANNELS     = ['website','rss','google_news','instagram','facebook','linkedin','reddit','manual'];
const COMMERCIAL   = ['none','low','medium','high'];
const COLLECTION   = ['automatic','semi_manual','manual'];
const STATUSES     = ['active','paused','rejected'];

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1.5">{label}</label>
      {children}
      {hint && <p className="text-[11px] text-stone-400 mt-1">{hint}</p>}
    </div>
  );
}

const inputCls  = 'w-full text-sm px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:border-stone-400 bg-white text-stone-800';
const selectCls = `${inputCls} w-auto`;

export default function SourceForm({ initial, isNew }: { initial: Partial<SourceData>; isNew: boolean }) {
  const router = useRouter();
  const [form, setForm] = useState<SourceData>({
    name:               initial.name               ?? '',
    source_type:        initial.source_type        ?? 'media',
    channel:            initial.channel            ?? 'website',
    url:                initial.url                ?? '',
    social_url:         initial.social_url         ?? '',
    country:            initial.country            ?? 'DK',
    language:           initial.language           ?? 'da',
    topic_tags:         initial.topic_tags         ?? '',
    trust_score:        initial.trust_score        ?? '',
    commercial_interest: initial.commercial_interest ?? 'none',
    collection_method:  initial.collection_method  ?? 'manual',
    status:             initial.status             ?? 'active',
    notes:              initial.notes              ?? '',
    ...(initial.id ? { id: initial.id } : {}),
  });

  const [error, setError]   = useState<string | null>(null);
  const [saved, setSaved]   = useState(false);
  const [isPending, startTransition] = useTransition();

  const set = (key: keyof SourceData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => { setForm(f => ({ ...f, [key]: e.target.value })); setSaved(false); };

  const handleSave = (overrideStatus?: string) => {
    setError(null);
    const status = overrideStatus ?? form.status;
    if (overrideStatus) setForm(f => ({ ...f, status: overrideStatus }));

    startTransition(async () => {
      const payload = {
        ...form,
        status,
        trust_score: form.trust_score === '' ? null : Number(form.trust_score),
        topic_tags:  form.topic_tags.split(',').map(t => t.trim()).filter(Boolean),
      };

      const url    = isNew ? '/api/admin/sources' : `/api/admin/sources/${form.id}`;
      const method = isNew ? 'POST' : 'PATCH';

      const res  = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'Ukendt fejl');
      } else {
        if (isNew) {
          router.push(`/admin/sources/${data.source.id}`);
        } else {
          setSaved(true);
          setTimeout(() => setSaved(false), 3000);
        }
      }
    });
  };

  const handleDelete = () => {
    if (!confirm(`Slet kilde "${form.name}"? Dette kan ikke fortrydes.`)) return;
    startTransition(async () => {
      const res = await fetch(`/api/admin/sources/${form.id}`, { method: 'DELETE' });
      if (res.ok) router.push('/admin/sources');
      else setError('Sletning fejlede');
    });
  };

  return (
    <div className="space-y-6">

      {/* Action bar */}
      <div className="bg-white border border-stone-200 rounded-xl px-5 py-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold text-stone-500 uppercase tracking-wide">Status</label>
          <select value={form.status} onChange={set('status')} className={selectCls}>
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {saved && <span className="text-xs text-emerald-600 font-medium">✓ Gemt</span>}
          {error && <span className="text-xs text-red-600">{error}</span>}

          {!isNew && form.status !== 'paused' && (
            <button onClick={() => handleSave('paused')} disabled={isPending}
              className="text-xs px-3 py-2 border border-amber-200 text-amber-700 rounded-lg hover:bg-amber-50 transition font-medium disabled:opacity-50">
              Pause
            </button>
          )}
          {!isNew && form.status !== 'rejected' && (
            <button onClick={() => handleSave('rejected')} disabled={isPending}
              className="text-xs px-3 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition font-medium disabled:opacity-50">
              Afvis
            </button>
          )}
          {!isNew && (
            <button onClick={handleDelete} disabled={isPending}
              className="text-xs px-3 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition font-medium disabled:opacity-50">
              Slet
            </button>
          )}
          <button onClick={() => handleSave()} disabled={isPending}
            className="text-sm px-4 py-2 bg-stone-800 text-white rounded-lg hover:bg-stone-700 transition font-medium disabled:opacity-50">
            {isPending ? 'Gemmer…' : isNew ? 'Opret kilde' : 'Gem'}
          </button>
        </div>
      </div>

      {/* Identity */}
      <div className="bg-white border border-stone-200 rounded-xl p-6 space-y-5">
        <h2 className="text-sm font-semibold text-stone-800 border-b border-stone-100 pb-3">Identitet</h2>
        <Field label="Navn">
          <input type="text" value={form.name} onChange={set('name')} className={inputCls} required />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Type">
            <select value={form.source_type} onChange={set('source_type')} className={`${selectCls} w-full`}>
              {SOURCE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="Kanal">
            <select value={form.channel} onChange={set('channel')} className={`${selectCls} w-full`}>
              {CHANNELS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
        </div>
        <Field label="URL">
          <input type="url" value={form.url} onChange={set('url')} className={`${inputCls} font-mono`} />
        </Field>
        <Field label="Social URL" hint="Link til social profil hvis relevant">
          <input type="url" value={form.social_url} onChange={set('social_url')} className={`${inputCls} font-mono`} />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Land" hint="ISO 2-bogstav, f.eks. DK">
            <input type="text" value={form.country} onChange={set('country')} className={inputCls} maxLength={2} />
          </Field>
          <Field label="Sprog">
            <input type="text" value={form.language} onChange={set('language')} className={inputCls} maxLength={10} />
          </Field>
        </div>
      </div>

      {/* Classification */}
      <div className="bg-white border border-stone-200 rounded-xl p-6 space-y-5">
        <h2 className="text-sm font-semibold text-stone-800 border-b border-stone-100 pb-3">Klassificering</h2>
        <Field label="Emner / topic tags" hint="Kommasepareret, f.eks: policy, research, retail">
          <input type="text" value={form.topic_tags} onChange={set('topic_tags')} className={inputCls} />
        </Field>
        <div className="grid grid-cols-3 gap-4">
          <Field label="Tillidsscore" hint="1–5">
            <input type="number" min={1} max={5} value={form.trust_score} onChange={set('trust_score')} className={inputCls} />
          </Field>
          <Field label="Kommerciel interesse">
            <select value={form.commercial_interest} onChange={set('commercial_interest')} className={`${selectCls} w-full`}>
              {COMMERCIAL.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Indsamlingsmetode">
            <select value={form.collection_method} onChange={set('collection_method')} className={`${selectCls} w-full`}>
              {COLLECTION.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
        </div>
      </div>

      {/* Notes */}
      <div className="bg-white border border-stone-200 rounded-xl p-6 space-y-4">
        <h2 className="text-sm font-semibold text-stone-800 border-b border-stone-100 pb-3">Noter</h2>
        <Field label="Interne noter">
          <textarea value={form.notes} onChange={set('notes')} rows={4}
            className={`${inputCls} resize-y`} />
        </Field>
      </div>

    </div>
  );
}
