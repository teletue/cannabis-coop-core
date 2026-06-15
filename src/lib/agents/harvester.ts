/**
 * Agent 1: The Harvester
 * Fetches structured signals from PubMed (free, no API key required).
 * Web/news signals are handled by The Scout via Gemini Search Grounding.
 */

export interface RawSignal {
  source: 'pubmed' | 'google_grounding';
  source_id: string;
  source_url: string;
  title: string;
  abstract: string;
  published_at: string | null;
  authors: string[];
  raw_payload: Record<string, unknown>;
}

// ─── PubMed ──────────────────────────────────────────────────────────────────

const PUBMED_SEARCH_QUERY = [
  '("cannabinoid" OR "phytochemical" OR "endocannabinoid")',
  'AND',
  '("clinical trial" OR "randomized controlled trial" OR "systematic review" OR "policy")',
  'AND',
  '("pain" OR "sleep" OR "anxiety" OR "inflammation" OR "recovery")',
].join(' ');

const PUBMED_BASE = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils';

async function fetchPubMed(maxResults = 10): Promise<RawSignal[]> {
  const searchUrl = `${PUBMED_BASE}/esearch.fcgi?db=pubmed&term=${encodeURIComponent(PUBMED_SEARCH_QUERY)}&retmax=${maxResults}&sort=pub_date&retmode=json`;

  const searchRes = await fetch(searchUrl, { next: { revalidate: 3600 } });
  if (!searchRes.ok) throw new Error(`PubMed search failed: ${searchRes.status}`);

  const searchData = await searchRes.json();
  const ids: string[] = searchData.esearchresult?.idlist ?? [];

  if (ids.length === 0) return [];

  const summaryUrl = `${PUBMED_BASE}/esummary.fcgi?db=pubmed&id=${ids.join(',')}&retmode=json`;
  const summaryRes = await fetch(summaryUrl, { next: { revalidate: 3600 } });
  if (!summaryRes.ok) throw new Error(`PubMed summary failed: ${summaryRes.status}`);

  const summaryData = await summaryRes.json();
  const results = summaryData.result ?? {};

  return ids
    .filter((id) => results[id])
    .map((id): RawSignal => {
      const article = results[id];
      return {
        source: 'pubmed',
        source_id: id,
        source_url: `https://pubmed.ncbi.nlm.nih.gov/${id}/`,
        title: article.title ?? '',
        abstract: article.source ?? '',
        published_at: article.pubdate ? new Date(article.pubdate).toISOString() : null,
        authors: (article.authors ?? []).map((a: { name: string }) => a.name),
        raw_payload: article,
      };
    });
}

// ─── Public entry point ───────────────────────────────────────────────────────

export interface HarvesterResult {
  pubmed: RawSignal[];
  errors: string[];
}

export async function runHarvester(maxPerSource = 10): Promise<HarvesterResult> {
  const errors: string[] = [];

  const result = await Promise.allSettled([fetchPubMed(maxPerSource)]);
  const [pubmed] = result;

  return {
    pubmed:
      pubmed.status === 'fulfilled'
        ? pubmed.value
        : (errors.push(`PubMed: ${(pubmed as PromiseRejectedResult).reason}`), []),
    errors,
  };
}
