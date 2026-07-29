'use client';

import { useState, useTransition } from 'react';

interface Article {
  id: string;
  slug: string;
  title: string;
  body: string;
  excerpt: string | null;
  author: string;
  status: string;
  category: string | null;
  tags: string[];
  hero_image_url: string;
  image_alt: string | null;
  seo_title: string | null;
  meta_description: string | null;
  published_at: string;
}

const STATUSES = ['draft', 'review', 'published', 'archived'] as const;

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

export default function ArticleEditor({ article }: { article: Article }) {
  const [form, setForm] = useState({
    title:            article.title,
    slug:             article.slug,
    body:             article.body,
    excerpt:          article.excerpt ?? '',
    author:           article.author,
    status:           article.status,
    category:         article.category ?? '',
    tags:             article.tags.join(', '),
    hero_image_url:   article.hero_image_url,
    image_alt:        article.image_alt ?? '',
    seo_title:        article.seo_title ?? '',
    meta_description: article.meta_description ?? '',
  });

  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm(f => ({ ...f, [key]: e.target.value }));
    setSaved(false);
  };

  const handleSave = () => {
    setError(null);
    startTransition(async () => {
      const res = await fetch(`/api/admin/articles/${article.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
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

      {/* Status + save bar */}
      <div className="bg-white border border-stone-200 rounded-xl px-5 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold text-stone-500 uppercase tracking-wide">Status</label>
          <select value={form.status} onChange={set('status')} className={`${inputCls} w-auto`}>
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-3">
          {saved && <span className="text-xs text-emerald-600 font-medium">✓ Gemt</span>}
          {error && <span className="text-xs text-red-600">{error}</span>}
          <button
            onClick={handleSave}
            disabled={isPending}
            className="text-sm px-4 py-2 bg-stone-800 text-white rounded-lg hover:bg-stone-700 transition font-medium disabled:opacity-50"
          >
            {isPending ? 'Gemmer…' : 'Gem ændringer'}
          </button>
        </div>
      </div>

      {/* Core fields */}
      <div className="bg-white border border-stone-200 rounded-xl p-6 space-y-5">
        <h2 className="text-sm font-semibold text-stone-800 border-b border-stone-100 pb-3">Indhold</h2>

        <Field label="Titel">
          <input type="text" value={form.title} onChange={set('title')} className={inputCls} />
        </Field>

        <Field label="Slug" hint="Bruges i URL: /journal/[slug]">
          <input type="text" value={form.slug} onChange={set('slug')} className={`${inputCls} font-mono`} />
        </Field>

        <Field label="Uddrag / Excerpt">
          <textarea value={form.excerpt} onChange={set('excerpt')} rows={3} className={textareaCls} />
        </Field>

        <Field label="Body (Markdown)">
          <textarea value={form.body} onChange={set('body')} rows={16} className={textareaCls} />
        </Field>
      </div>

      {/* Meta */}
      <div className="bg-white border border-stone-200 rounded-xl p-6 space-y-5">
        <h2 className="text-sm font-semibold text-stone-800 border-b border-stone-100 pb-3">Metadata</h2>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Forfatter">
            <input type="text" value={form.author} onChange={set('author')} className={inputCls} />
          </Field>
          <Field label="Kategori">
            <input type="text" value={form.category} onChange={set('category')} className={inputCls} />
          </Field>
        </div>

        <Field label="Tags" hint="Kommasepareret, f.eks: sleep, recovery, policy">
          <input type="text" value={form.tags} onChange={set('tags')} className={inputCls} />
        </Field>
      </div>

      {/* Image */}
      <div className="bg-white border border-stone-200 rounded-xl p-6 space-y-5">
        <h2 className="text-sm font-semibold text-stone-800 border-b border-stone-100 pb-3">Billede</h2>

        <Field label="Hero Image URL">
          <input type="url" value={form.hero_image_url} onChange={set('hero_image_url')} className={`${inputCls} font-mono`} />
        </Field>

        <Field label="Alt-tekst" hint="Tilgængelighed og SEO">
          <input type="text" value={form.image_alt} onChange={set('image_alt')} className={inputCls} />
        </Field>

        {form.hero_image_url && (
          <div className="rounded-lg overflow-hidden border border-stone-100 aspect-video bg-stone-50">
            <img src={form.hero_image_url} alt={form.image_alt || 'Preview'} className="w-full h-full object-cover" />
          </div>
        )}
      </div>

      {/* SEO */}
      <div className="bg-white border border-stone-200 rounded-xl p-6 space-y-5">
        <h2 className="text-sm font-semibold text-stone-800 border-b border-stone-100 pb-3">SEO</h2>

        <Field label="SEO Titel" hint="Overskriver browser-titel hvis udfyldt">
          <input type="text" value={form.seo_title} onChange={set('seo_title')} className={inputCls} />
        </Field>

        <Field label="Meta Description" hint="Max ~160 tegn">
          <textarea value={form.meta_description} onChange={set('meta_description')} rows={3} className={textareaCls} />
        </Field>
      </div>

    </div>
  );
}
