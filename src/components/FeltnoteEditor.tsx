'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

interface FeltnoteData {
  id?: string;
  title: string;
  slug: string;
  body: string;
  excerpt: string;
  mood: string;
  status: string;
  author: string;
  seo_title: string;
  meta_description: string;
}

const MOODS    = ['observation','essay','critique','rant','note'];
const STATUSES = ['draft','review','published','archived'];

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
const textareaCls = `${inputCls} resize-y font-mono`;

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/æ/g,'ae').replace(/ø/g,'oe').replace(/å/g,'aa')
    .replace(/[^a-z0-9]+/g,'-')
    .replace(/^-|-$/g,'')
    .substring(0, 80);
}

export default function FeltnoteEditor({ initial, isNew }: { initial: Partial<FeltnoteData>; isNew: boolean }) {
  const router = useRouter();
  const [form, setForm] = useState<FeltnoteData>({
    title:            initial.title            ?? '',
    slug:             initial.slug             ?? '',
    body:             initial.body             ?? '',
    excerpt:          initial.excerpt          ?? '',
    mood:             initial.mood             ?? 'note',
    status:           initial.status           ?? 'draft',
    author:           initial.author           ?? 'Redaktionen',
    seo_title:        initial.seo_title        ?? '',
    meta_description: initial.meta_description ?? '',
    ...(initial.id ? { id: initial.id } : {}),
  });

  const [error, setError]   = useState<string | null>(null);
  const [saved, setSaved]   = useState(false);
  const [isPending, startTransition] = useTransition();

  const set = (key: keyof FeltnoteData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => { setForm(f => ({ ...f, [key]: e.target.value })); setSaved(false); };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    setForm(f => ({
      ...f,
      title,
      slug: isNew && !f.slug ? slugify(title) : f.slug,
    }));
    setSaved(false);
  };

  const handleSave = (overrideStatus?: string) => {
    setError(null);
    const status = overrideStatus ?? form.status;
    if (overrideStatus) setForm(f => ({ ...f, status: overrideStatus }));

    startTransition(async () => {
      const payload = { ...form, status, slug: form.slug || slugify(form.title) };
      const url    = isNew ? '/api/admin/feltnoter' : `/api/admin/feltnoter/${form.id}`;
      const method = isNew ? 'POST' : 'PATCH';

      const res  = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'Ukendt fejl');
      } else {
        if (isNew) {
          router.push(`/admin/feltnoter/${data.feltnote.id}`);
        } else {
          setSaved(true);
          setTimeout(() => setSaved(false), 3000);
        }
      }
    });
  };

  const handleDelete = () => {
    if (!confirm(`Slet feltnote "${form.title}"?`)) return;
    startTransition(async () => {
      const res = await fetch(`/api/admin/feltnoter/${form.id}`, { method: 'DELETE' });
      if (res.ok) router.push('/admin/feltnoter');
      else setError('Sletning fejlede');
    });
  };

  return (
    <div className="space-y-6">

      {/* Editorial marker */}
      <div className="bg-stone-800 text-white rounded-xl px-5 py-3 flex items-center gap-3">
        <span className="text-xs font-bold uppercase tracking-widest text-stone-300">Feltnote</span>
        <span className="text-stone-600">·</span>
        <p className="text-xs text-stone-400">Originalt redaktionelt indhold — weeds.dk&apos;s egen stemme. Ikke importeret.</p>
      </div>

      {/* Action bar */}
      <div className="bg-white border border-stone-200 rounded-xl px-5 py-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold text-stone-500 uppercase tracking-wide">Status</label>
          <select value={form.status} onChange={set('status')} className={`${inputCls} w-auto`}>
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {saved && <span className="text-xs text-emerald-600 font-medium">✓ Gemt</span>}
          {error && <span className="text-xs text-red-600">{error}</span>}
          {!isNew && form.status !== 'published' && (
            <button onClick={() => handleSave('published')} disabled={isPending}
              className="text-xs px-3 py-2 border border-emerald-200 text-emerald-700 rounded-lg hover:bg-emerald-50 transition font-medium disabled:opacity-50">
              Publicér →
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
            {isPending ? 'Gemmer…' : isNew ? 'Opret feltnote' : 'Gem'}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="bg-white border border-stone-200 rounded-xl p-6 space-y-5">
        <h2 className="text-sm font-semibold text-stone-800 border-b border-stone-100 pb-3">Indhold</h2>

        <Field label="Titel">
          <input type="text" value={form.title} onChange={handleTitleChange} className={inputCls} />
        </Field>

        <Field label="Slug" hint="Auto-genereres fra titel hvis tom">
          <input type="text" value={form.slug} onChange={set('slug')} className={`${inputCls} font-mono`} />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Stemning / mood">
            <select value={form.mood} onChange={set('mood')} className={`${inputCls} w-full`}>
              {MOODS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </Field>
          <Field label="Forfatter">
            <input type="text" value={form.author} onChange={set('author')} className={inputCls} />
          </Field>
        </div>

        <Field label="Uddrag / Excerpt">
          <textarea value={form.excerpt} onChange={set('excerpt')} rows={2} className={textareaCls} />
        </Field>

        <Field label="Body (Markdown)">
          <textarea value={form.body} onChange={set('body')} rows={16} className={textareaCls} />
        </Field>
      </div>

      {/* SEO */}
      <div className="bg-white border border-stone-200 rounded-xl p-6 space-y-5">
        <h2 className="text-sm font-semibold text-stone-800 border-b border-stone-100 pb-3">SEO</h2>
        <Field label="SEO Titel">
          <input type="text" value={form.seo_title} onChange={set('seo_title')} className={inputCls} />
        </Field>
        <Field label="Meta Description" hint="Max ~160 tegn">
          <textarea value={form.meta_description} onChange={set('meta_description')} rows={3} className={textareaCls} />
        </Field>
      </div>

    </div>
  );
}
