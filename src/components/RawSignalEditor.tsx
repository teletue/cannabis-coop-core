'use client';

import { useState, useTransition } from 'react';

interface RawSignal {
  id: string;
  source: string;
  source_id: string | null;
  source_url: string | null;
  title: string;
  abstract: string | null;
  published_at: string | null;
  authors: string[] | null;
  relevancy_score: number | null;
  scout_output: Record<string, unknown> | null;
  status: string;
  editor_notes: string | null;
  created_at: string;
}

const STATUSES = [
  { value: 'pending',         label: 'Afventer' },
  { value: 'scored',          label: 'Scoret' },
  { value: 'below_threshold', label: 'Under tærskel' },
  { value: 'promoted',        label: 'Promoveret' },
  { value: 'ignored',         label: 'Ignoreret' },
  { value: 'ready_for_draft', label: 'Klar til kladde' },
  { value: 'error',           label: 'Fejl' },
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
const textareaCls = `${inputCls} resize-y`;

export default function RawSignalEditor({ signal }: { signal: RawSignal }) {
  const [form, setForm] = useState({
    title:           signal.title,
    abstract:        signal.abstract ?? '',
    source:          signal.source,
    source_url:      signal.source_url ?? '',
    relevancy_score: signal.relevancy_score ?? '',
    status:          signal.status,
    editor_notes:    signal.editor_notes ?? '',
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

  const setStatus = (status: string) => {
    setForm(f => ({ ...f, status }));
    setSaved(false);
  };

  const handleSave = (overrideStatus?: string) => {
    setError(null);
    const payload = {
      ...form,
      status:          overrideStatus ?? form.status,
      relevancy_score: form.relevancy_score === '' ? null : Number(form.relevancy_score),
    };
    if (overrideStatus) setForm(f => ({ ...f, status: overrideStatus }));

    startTransition(async () => {
      const res = await fetch(`/api/admin/inbox/${signal.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
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

      {/* Status + actions bar */}
      <div className="bg-white border border-stone-200 rounded-xl px-5 py-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold text-stone-500 uppercase tracking-wide">Status</label>
          <select value={form.status} onChange={set('status')} className={`${inputCls} w-auto`}>
            {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {saved && <span className="text-xs text-emerald-600 font-medium">✓ Gemt</span>}
          {error && <span className="text-xs text-red-600">{error}</span>}

          <button
            onClick={() => handleSave('ignored')}
            disabled={isPending}
            className="text-xs px-3 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition font-medium disabled:opacity-50"
          >
            Ignorer
          </button>
          <button
            onClick={() => handleSave('ready_for_draft')}
            disabled={isPending}
            className="text-xs px-3 py-2 border border-emerald-200 text-emerald-700 rounded-lg hover:bg-emerald-50 transition font-medium disabled:opacity-50"
          >
            Klar til kladde
          </button>
          <button
            onClick={() => handleSave()}
            disabled={isPending}
            className="text-sm px-4 py-2 bg-stone-800 text-white rounded-lg hover:bg-stone-700 transition font-medium disabled:opacity-50"
          >
            {isPending ? 'Gemmer…' : 'Gem'}
          </button>
        </div>
      </div>

      {/* Source info (read-only) */}
      <div className="bg-white border border-stone-200 rounded-xl p-6 space-y-4">
        <h2 className="text-sm font-semibold text-stone-800 border-b border-stone-100 pb-3">Kildeinfo</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-xs text-stone-400 mb-1">Kilde</p>
            <p className="text-stone-700 font-mono">{signal.source}</p>
          </div>
          <div>
            <p className="text-xs text-stone-400 mb-1">Eksternt ID</p>
            <p className="text-stone-700 font-mono">{signal.source_id ?? '—'}</p>
          </div>
          <div>
            <p className="text-xs text-stone-400 mb-1">Publiceret (original)</p>
            <p className="text-stone-700">
              {signal.published_at
                ? new Date(signal.published_at).toLocaleDateString('da-DK', { day: 'numeric', month: 'long', year: 'numeric' })
                : '—'}
            </p>
          </div>
          <div>
            <p className="text-xs text-stone-400 mb-1">Forfattere</p>
            <p className="text-stone-700">{signal.authors?.join(', ') ?? '—'}</p>
          </div>
        </div>
      </div>

      {/* Editable content */}
      <div className="bg-white border border-stone-200 rounded-xl p-6 space-y-5">
        <h2 className="text-sm font-semibold text-stone-800 border-b border-stone-100 pb-3">Indhold</h2>

        <Field label="Titel">
          <input type="text" value={form.title} onChange={set('title')} className={inputCls} />
        </Field>

        <Field label="Abstract / råtekst" hint="Det originale indhold fra kilden">
          <textarea value={form.abstract} onChange={set('abstract')} rows={8} className={textareaCls} />
        </Field>

        <Field label="Kilde-URL">
          <input type="url" value={form.source_url} onChange={set('source_url')} className={`${inputCls} font-mono`} />
        </Field>

        <Field label="Relevans-score" hint="1–100 — NULL hvis ikke scoret endnu">
          <input
            type="number"
            min={1}
            max={100}
            value={form.relevancy_score}
            onChange={set('relevancy_score')}
            className={`${inputCls} w-32`}
          />
        </Field>
      </div>

      {/* Scout output (read-only) */}
      {signal.scout_output && (
        <div className="bg-white border border-stone-200 rounded-xl p-6">
          <h2 className="text-sm font-semibold text-stone-800 border-b border-stone-100 pb-3 mb-4">Scout-output</h2>
          <pre className="text-xs text-stone-600 bg-stone-50 rounded-lg p-4 overflow-auto max-h-64 leading-relaxed">
            {JSON.stringify(signal.scout_output, null, 2)}
          </pre>
        </div>
      )}

      {/* Editor notes */}
      <div className="bg-white border border-stone-200 rounded-xl p-6 space-y-5">
        <h2 className="text-sm font-semibold text-stone-800 border-b border-stone-100 pb-3">Redaktørnoter</h2>
        <Field label="Noter" hint="Interne noter — vises kun i CMS">
          <textarea value={form.editor_notes} onChange={set('editor_notes')} rows={4} className={textareaCls} />
        </Field>
      </div>

    </div>
  );
}
