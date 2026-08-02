'use client';

import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface SourceOption {
  id: string;
  name: string;
}

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

export default function ManualSignalForm() {
  const router = useRouter();
  const [sources, setSources] = useState<SourceOption[]>([]);

  const [form, setForm] = useState({
    title:          '',
    original_url:   '',
    raw_text:       '',
    editor_note:    '',
    source_id:      '',
    source_name:    '',
    detected_topic: '',
  });

  const [error, setError]       = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    fetch('/api/admin/sources')
      .then(r => r.json())
      .then(d => setSources(d.sources ?? []))
      .catch(() => {});
  }, []);

  const set = (key: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => setForm(f => ({ ...f, [key]: e.target.value }));

  const handleSubmit = () => {
    setError(null);
    if (!form.title.trim()) { setError('Titel er påkrævet'); return; }

    startTransition(async () => {
      const res = await fetch('/api/admin/signals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Ukendt fejl');
      } else {
        router.push(`/admin/inbox/${data.signal.id}`);
      }
    });
  };

  return (
    <div className="space-y-6">

      <div className="bg-white border border-stone-200 rounded-xl p-6 space-y-5">
        <h2 className="text-sm font-semibold text-stone-800 border-b border-stone-100 pb-3">Signal</h2>

        <Field label="Titel" hint="Kort beskrivende titel for signalet">
          <input type="text" value={form.title} onChange={set('title')} className={inputCls} required />
        </Field>

        <Field label="Original URL" hint="Link til opslag, artikel eller side">
          <input type="url" value={form.original_url} onChange={set('original_url')} className={`${inputCls} font-mono`} />
        </Field>

        <Field label="Råtekst" hint="Kopiér indhold fra kilden — citat, opslag, uddrag">
          <textarea value={form.raw_text} onChange={set('raw_text')} rows={8} className={textareaCls} />
        </Field>
      </div>

      <div className="bg-white border border-stone-200 rounded-xl p-6 space-y-5">
        <h2 className="text-sm font-semibold text-stone-800 border-b border-stone-100 pb-3">Kilde</h2>

        <Field label="Vælg registreret kilde" hint="Valgfrit — brug 'Kildenavn' nedenfor hvis kilden ikke er registreret">
          <select value={form.source_id} onChange={set('source_id')} className={`${inputCls} w-auto`}>
            <option value="">— Ingen registreret kilde —</option>
            {sources.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </Field>

        <Field label="Kildenavn (fallback)" hint="F.eks. 'Instagram — @hanf_magazin' eller 'Reddit r/cbd'">
          <input type="text" value={form.source_name} onChange={set('source_name')} className={inputCls} />
        </Field>
      </div>

      <div className="bg-white border border-stone-200 rounded-xl p-6 space-y-5">
        <h2 className="text-sm font-semibold text-stone-800 border-b border-stone-100 pb-3">Redaktion</h2>

        <Field label="Emne / topic" hint="F.eks. 'EU-regulering', 'CBD-marked', 'patientsikkerhed'">
          <input type="text" value={form.detected_topic} onChange={set('detected_topic')} className={inputCls} />
        </Field>

        <Field label="Redaktørnote" hint="Hvorfor er dette interessant? Hvad skal der ske med det?">
          <textarea value={form.editor_note} onChange={set('editor_note')} rows={3} className={textareaCls} />
        </Field>
      </div>

      <div className="flex items-center gap-3">
        {error && <span className="text-xs text-red-600">{error}</span>}
        <button
          onClick={handleSubmit}
          disabled={isPending}
          className="text-sm px-5 py-2.5 bg-stone-800 text-white rounded-lg hover:bg-stone-700 transition font-medium disabled:opacity-50"
        >
          {isPending ? 'Gemmer…' : 'Gem signal →'}
        </button>
      </div>

    </div>
  );
}
