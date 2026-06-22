'use client';

import { useState, useTransition } from 'react';

export interface DraftArticle {
  id: string;
  title: string;
  excerpt: string | null;
  review_status: 'pending_review' | 'approved' | 'rejected' | 'published';
  pipeline_stage: string;
  relevancy_score: number | null;
  tags: string[];
  affiliate_link: string | null;
  published_at: string | null;
  created_at: string;
  scout_output: {
    context_briefing?: string;
    summary?: string;
    relevancy_score?: number;
    tags?: string[];
    source?: string;
  } | null;
}

const STATUS_STYLES: Record<string, string> = {
  pending_review: 'bg-amber-50 text-amber-700 border border-amber-200',
  approved:       'bg-blue-50 text-blue-700 border border-blue-200',
  rejected:       'bg-red-50 text-red-700 border border-red-200',
  published:      'bg-emerald-50 text-emerald-700 border border-emerald-200',
};

const STATUS_DK: Record<string, string> = {
  pending_review: 'Afventer',
  approved:       'Godkendt',
  rejected:       'Afvist',
  published:      'Publiceret',
};

function ScoreBar({ score }: { score: number }) {
  const color = score >= 80 ? '#059669' : score >= 60 ? '#d97706' : '#dc2626';
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 bg-stone-200 rounded-full overflow-hidden">
        <div style={{ width: `${score}%`, backgroundColor: color }} className="h-full rounded-full" />
      </div>
      <span className="text-xs tabular-nums" style={{ color }}>{score}</span>
    </div>
  );
}

function ExpandedSummary({ article, onClose }: { article: DraftArticle; onClose: () => void }) {
  const summary = article.scout_output?.context_briefing ?? article.scout_output?.summary ?? article.excerpt;
  const source = article.scout_output?.source;
  return (
    <tr>
      <td colSpan={7} className="px-6 py-5 bg-stone-50 border-b border-stone-200">
        <div className="max-w-3xl space-y-3">
          {source && (
            <p className="text-xs text-stone-400 font-medium uppercase tracking-wide">Kilde: {source}</p>
          )}
          {summary ? (
            <p className="text-sm text-stone-700 leading-relaxed font-serif">{summary}</p>
          ) : (
            <p className="text-sm text-stone-400 italic">Intet resumé tilgængeligt.</p>
          )}
          {article.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {article.tags.map(t => (
                <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-stone-200 text-stone-600 font-medium">{t}</span>
              ))}
            </div>
          )}
          <button onClick={onClose} className="text-xs text-stone-400 hover:text-stone-600 underline mt-1">
            Luk resumé
          </button>
        </div>
      </td>
    </tr>
  );
}

function ArticleRow({ article, onUpdate, onDelete }: {
  article: DraftArticle;
  onUpdate: (id: string, patch: Partial<DraftArticle>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [expanded, setExpanded] = useState(false);
  const [affiliateInput, setAffiliateInput] = useState(article.affiliate_link ?? '');
  const [isPending, startTransition] = useTransition();

  const handleApprove = () => {
    startTransition(async () => {
      await onUpdate(article.id, {
        review_status: 'published',
        affiliate_link: affiliateInput || null,
      });
    });
  };

  const handleSaveAffiliate = () => {
    startTransition(async () => {
      await onUpdate(article.id, { affiliate_link: affiliateInput || null });
    });
  };

  const handleDelete = () => {
    if (!confirm(`Slet "${article.title}"?`)) return;
    startTransition(async () => {
      await onDelete(article.id);
    });
  };

  const isPublished = article.review_status === 'published';

  return (
    <>
      <tr className={`border-b border-stone-100 hover:bg-stone-50 transition-colors ${isPending ? 'opacity-50' : ''}`}>
        {/* Titel */}
        <td className="px-4 py-4 max-w-xs">
          <button
            onClick={() => setExpanded(e => !e)}
            className="text-left group"
          >
            <p className="text-sm font-semibold text-stone-800 group-hover:text-stone-600 leading-snug line-clamp-2">
              {article.title}
            </p>
            <p className="text-xs text-stone-400 mt-0.5">
              {new Date(article.created_at).toLocaleDateString('da-DK', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
          </button>
        </td>

        {/* Kilde */}
        <td className="px-4 py-4">
          <span className="text-xs text-stone-500 font-mono">
            {article.scout_output?.source ?? article.pipeline_stage}
          </span>
        </td>

        {/* Score */}
        <td className="px-4 py-4">
          {article.relevancy_score != null
            ? <ScoreBar score={article.relevancy_score} />
            : <span className="text-xs text-stone-300">–</span>
          }
        </td>

        {/* Status */}
        <td className="px-4 py-4">
          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${STATUS_STYLES[article.review_status]}`}>
            {STATUS_DK[article.review_status]}
          </span>
        </td>

        {/* Affiliate link */}
        <td className="px-4 py-4">
          <div className="flex items-center gap-1.5 min-w-[200px]">
            <input
              type="url"
              value={affiliateInput}
              onChange={e => setAffiliateInput(e.target.value)}
              placeholder="https://..."
              className="w-full text-xs px-2 py-1.5 border border-stone-200 rounded focus:outline-none focus:border-stone-400 bg-white font-mono text-stone-700 placeholder:text-stone-300"
            />
            {affiliateInput !== (article.affiliate_link ?? '') && (
              <button
                onClick={handleSaveAffiliate}
                disabled={isPending}
                className="text-[10px] px-2 py-1.5 bg-stone-800 text-white rounded hover:bg-stone-700 transition whitespace-nowrap"
              >
                Gem
              </button>
            )}
          </div>
        </td>

        {/* Handlinger */}
        <td className="px-4 py-4">
          <div className="flex items-center gap-2">
            {!isPublished && (
              <button
                onClick={handleApprove}
                disabled={isPending}
                className="text-[11px] px-3 py-1.5 bg-stone-800 text-white rounded hover:bg-stone-600 transition font-medium whitespace-nowrap"
              >
                Godkend
              </button>
            )}
            {isPublished && (
              <span className="text-[11px] text-emerald-600 font-medium">✓ Live</span>
            )}
            <button
              onClick={handleDelete}
              disabled={isPending}
              className="text-[11px] px-2 py-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition"
              title="Slet"
            >
              Slet
            </button>
          </div>
        </td>

        {/* Resumé toggle */}
        <td className="px-4 py-4">
          <button
            onClick={() => setExpanded(e => !e)}
            className="text-xs text-stone-400 hover:text-stone-700 transition"
            title="Vis resumé"
          >
            {expanded ? '▲' : '▼'}
          </button>
        </td>
      </tr>
      {expanded && <ExpandedSummary article={article} onClose={() => setExpanded(false)} />}
    </>
  );
}

export default function ArticleTable({ initialDrafts }: { initialDrafts: DraftArticle[] }) {
  const [drafts, setDrafts] = useState<DraftArticle[]>(initialDrafts);
  const [filter, setFilter] = useState<string>('all');
  const [error, setError] = useState<string | null>(null);

  const filtered = filter === 'all' ? drafts : drafts.filter(d => d.review_status === filter);

  const handleUpdate = async (id: string, patch: Partial<DraftArticle>) => {
    setError(null);
    try {
      const res = await fetch('/api/drafts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...patch }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Ukendt fejl');
      setDrafts(prev => prev.map(d => d.id === id ? { ...d, ...patch, ...data.draft } : d));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Opdatering fejlede');
    }
  };

  const handleDelete = async (id: string) => {
    setError(null);
    try {
      const res = await fetch('/api/drafts', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Ukendt fejl');
      setDrafts(prev => prev.filter(d => d.id !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sletning fejlede');
    }
  };

  const counts = {
    all: drafts.length,
    pending_review: drafts.filter(d => d.review_status === 'pending_review').length,
    published: drafts.filter(d => d.review_status === 'published').length,
    approved: drafts.filter(d => d.review_status === 'approved').length,
  };

  return (
    <div>
      {/* Filter tabs */}
      <div className="flex items-center gap-1 mb-6 border-b border-stone-200 pb-4">
        {([
          ['all', 'Alle'],
          ['pending_review', 'Afventer'],
          ['approved', 'Godkendt'],
          ['published', 'Publiceret'],
        ] as const).map(([val, label]) => (
          <button
            key={val}
            onClick={() => setFilter(val)}
            className={`text-xs px-3 py-1.5 rounded-full font-medium transition ${
              filter === val
                ? 'bg-stone-800 text-white'
                : 'text-stone-500 hover:text-stone-800 hover:bg-stone-100'
            }`}
          >
            {label}
            <span className={`ml-1.5 text-[10px] ${filter === val ? 'text-stone-300' : 'text-stone-400'}`}>
              {counts[val as keyof typeof counts] ?? counts.all}
            </span>
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
          {error}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-stone-400 text-sm">
          Ingen artikler i denne kategori.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-stone-200">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-200">
                <th className="px-4 py-3 text-[11px] font-semibold text-stone-500 uppercase tracking-wide">Titel</th>
                <th className="px-4 py-3 text-[11px] font-semibold text-stone-500 uppercase tracking-wide">Kilde</th>
                <th className="px-4 py-3 text-[11px] font-semibold text-stone-500 uppercase tracking-wide">Score</th>
                <th className="px-4 py-3 text-[11px] font-semibold text-stone-500 uppercase tracking-wide">Status</th>
                <th className="px-4 py-3 text-[11px] font-semibold text-stone-500 uppercase tracking-wide">Affiliate-link</th>
                <th className="px-4 py-3 text-[11px] font-semibold text-stone-500 uppercase tracking-wide">Handling</th>
                <th className="px-4 py-3 text-[11px] font-semibold text-stone-500 uppercase tracking-wide w-8" />
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-stone-100">
              {filtered.map(article => (
                <ArticleRow
                  key={article.id}
                  article={article}
                  onUpdate={handleUpdate}
                  onDelete={handleDelete}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
