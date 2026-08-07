'use client';

import { useState, useTransition } from 'react';
import ImageUploadField from '@/components/ImageUploadField';

interface Draft {
  id: string;
  title: string;
  body: string | null;
  excerpt: string | null;
  author: string | null;
  slug: string | null;
  review_status: string;
  relevancy_score: number | null;
  tags: string[];
  hero_image_url: string | null;
  image_alt: string | null;
  affiliate_link: string | null;
  scout_output: Record<string, unknown> | null;
  created_at: string;
}

const STATUSES = [
  { value: 'pending_review', label: 'Afventer review' },
  { value: 'approved',       label: 'Godkendt' },
  { value: 'rejected',       label: 'Afvist' },
  { value: 'published',      label: 'Publiceret' },
] as const;

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1.5">{label}</label>
      {children}
      {hint && <p className="text-[11px] text-stone-400 mt-1">{hint}</p>}
    </div>
  );
}

const inputCls = 'w-full text-sm px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:border-stone-400 bg-white text-stone-800';
const textareaCls = `${inputCls} resize-y font-mono`;

export default function DraftEditor({ draft }: { draft: Draft }) {
  const [form, setForm] = useState({
    title:          draft.title,
    body:           draft.body ?? '',
    excerpt:        draft.excerpt ?? '',
    author:         draft.author ?? 'Redaktionen',
    slug:           draft.slug ?? '',
    review_status:  draft.review_status,
    tags:           draft.tags.join(', '),
    hero_image_url: draft.hero_image_url ?? '',
    image_alt:      draft.image_alt ?? '',
    affiliate_link: draft.affiliate_link ?? '',
    rejection_note: '',
  });

  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const set = (key: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm(f => ({ ...f, [key]: e.target.value }));
    setSaved(false);
  };

  const handleSave = (overrideStatus?: string) => {
    setError(null);
    const status = overrideStatus ?? form.review_status;
    if (overrideStatus) setForm(f => ({ ...f, review_status: overrideStatus }));

    startTransition(async () => {
      const res = await fetch('/api/drafts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id:             draft.id,
          title:          form.title,
          body:           form.body,
          excerpt:        form.excerpt,
          author:         form.author,
          slug:           form.slug || null,
          review_status:  status,
          tags:           form.tags.split(',').map(t => t.trim()).filter(Boolean),
          hero_image_url: form.hero_image_url || null,
          image_alt:      form.image_alt || null,
          affiliate_link: form.affiliate_link || null,
          rejection_note: form.rejection_note || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Ukendt fejl');
      } else {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    });
  };

  return (
    <div className="space-y-6">

      {/* Status + actions */}
      <div className="bg-white border border-stone-200 rounded-xl px-5 py-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold text-stone-500 uppercase tracking-wide">Status</label>
          <select value={form.review_status} onChange={set('review_status')} className={`${inputCls} w-auto`}>
            {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          {draft.relevancy_score != null && (
            <span className="text-xs text-stone-400">Score: {draft.relevancy_score}</span>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {saved && <span className="text-xs text-emerald-600 font-medium">✓ Gemt</span>}
          {error && <span className="text-xs text-red-600">{error}</span>}

          {form.review_status !== 'published' && (
            <button
              onClick={() => handleSave('published')}
              disabled={isPending}
              className="text-xs px-3 py-2 border border-emerald-200 text-emerald-700 rounded-lg hover:bg-emerald-50 transition font-medium disabled:opacity-50"
            >
              Publicér →
            </button>
          )}
          {form.review_status !== 'rejected' && (
            <button
              onClick={() => handleSave('rejected')}
              disabled={isPending}
              className="text-xs px-3 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition font-medium disabled:opacity-50"
            >
              Afvis
            </button>
          )}
          <button
            onClick={() => handleSave()}
            disabled={isPending}
            className="text-sm px-4 py-2 bg-stone-800 text-white rounded-lg hover:bg-stone-700 transition font-medium disabled:opacity-50"
          >
            {isPending ? 'Gemmer…' : 'Gem'}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="bg-white border border-stone-200 rounded-xl p-6 space-y-5">
        <h2 className="text-sm font-semibold text-stone-800 border-b border-stone-100 pb-3">Indhold</h2>

        <Field label="Titel">
          <input type="text" value={form.title} onChange={set('title')} className={inputCls} />
        </Field>

        <Field label="Slug" hint="Bruges i URL ved publicering — lad stå tom for auto-generering">
          <input type="text" value={form.slug} onChange={set('slug')} className={`${inputCls} font-mono`} />
        </Field>

        <Field label="Uddrag / Excerpt">
          <textarea value={form.excerpt} onChange={set('excerpt')} rows={3} className={textareaCls} />
        </Field>

        <Field label="Body (Markdown)">
          <textarea value={form.body} onChange={set('body')} rows={16} className={textareaCls} />
        </Field>
      </div>

      {/* Metadata */}
      <div className="bg-white border border-stone-200 rounded-xl p-6 space-y-5">
        <h2 className="text-sm font-semibold text-stone-800 border-b border-stone-100 pb-3">Metadata</h2>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Forfatter">
            <input type="text" value={form.author} onChange={set('author')} className={inputCls} />
          </Field>
        </div>

        <Field label="Tags" hint="Kommasepareret">
          <input type="text" value={form.tags} onChange={set('tags')} className={inputCls} />
        </Field>

        <Field label="Affiliate-link">
          <input type="url" value={form.affiliate_link} onChange={set('affiliate_link')} className={`${inputCls} font-mono`} />
        </Field>
      </div>

      {/* Image */}
      <div className="bg-white border border-stone-200 rounded-xl p-6 space-y-5">
        <h2 className="text-sm font-semibold text-stone-800 border-b border-stone-100 pb-3">Billede</h2>
        <ImageUploadField
          value={form.hero_image_url}
          alt={form.image_alt}
          onChange={url => { setForm(f => ({ ...f, hero_image_url: url })); setSaved(false); }}
          onAltChange={a => { setForm(f => ({ ...f, image_alt: a })); setSaved(false); }}
          label="Hero-billede"
        />
      </div>

      {/* Rejection note */}
      {form.review_status === 'rejected' && (
        <div className="bg-white border border-red-200 rounded-xl p-6 space-y-3">
          <h2 className="text-sm font-semibold text-red-700">Afvisningsnote</h2>
          <Field label="Begrundelse" hint="Internt — vises ikke offentligt">
            <textarea value={form.rejection_note} onChange={set('rejection_note')} rows={3} className={textareaCls} />
          </Field>
        </div>
      )}

      {/* Scout output (read-only) */}
      {draft.scout_output && (
        <div className="bg-white border border-stone-200 rounded-xl p-6">
          <h2 className="text-sm font-semibold text-stone-800 border-b border-stone-100 pb-3 mb-4">Scout-output</h2>
          <pre className="text-xs text-stone-600 bg-stone-50 rounded-lg p-4 overflow-auto max-h-64 leading-relaxed">
            {JSON.stringify(draft.scout_output, null, 2)}
          </pre>
        </div>
      )}

    </div>
  );
}
