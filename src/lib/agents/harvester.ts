/**
 * Agent 1: The Harvester
 * Fetches structured signals from curated external APIs.
 * Writes raw items to raw_content_inbox for The Scout to score.
 */

export interface RawSignal {
  source: 'pubmed' | 'google_news';
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

// ─── Google Custom Search API ───────────────────────────────────────────────

const GOOGLE_CSE_QUERY = '("cannabinoid" OR "phytochemical") AND ("clinical trial" OR "policy" OR "EU regulation")';

async function fetchGoogleNews(maxResults = 10): Promise<RawSignal[]> {
  const apiKey = process.env.GOOGLE_API_KEY;
  const cseId = process.env.GOOGLE_CSE_ID;

  if (!apiKey || !cseId) {
    console.warn('[Harvester] GOOGLE_API_KEY or GOOGLE_CSE_ID not set – skipping Google Custom Search');
    return [];
  }

  // Google CSE returns max 10 per request; cap accordingly
  const num = Math.min(maxResults, 10);
  const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cseId}&q=${encodeURIComponent(GOOGLE_CSE_QUERY)}&num=${num}&sort=date`;

  const res = await fetch(url, { next: { revalidate: 3600 } });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Google Custom Search failed ${res.status}: ${err}`);
  }

  const data = await res.json();
  const items: Record<string, unknown>[] = data.items ?? [];

  return items.map((item): RawSignal => ({
    source: 'google_news',
    source_id: String(item.link ?? item.cacheId ?? item.title),
    source_url: String(item.link ?? ''),
    title: String(item.title ?? ''),
    abstract: String(item.snippet ?? ''),
    published_at: (() => {
      const dateStr = (item.pagemap as Record<string, unknown[]> | undefined)
        ?.metatags?.[0] as Record<string, string> | undefined;
      const raw = dateStr?.['article:published_time'] ?? dateStr?.['og:updated_time'];
      return raw ? new Date(raw).toISOString() : null;
    })(),
    authors: [],
    raw_payload: item,
  }));
}

// ─── Public entry point ───────────────────────────────────────────────────────

export interface HarvesterResult {
  pubmed: RawSignal[];
  google_news: RawSignal[];
  errors: string[];
}

export async function runHarvester(maxPerSource = 10): Promise<HarvesterResult> {
  const errors: string[] = [];

  const [pubmed, google_news] = await Promise.allSettled([
    fetchPubMed(maxPerSource),
    fetchGoogleNews(maxPerSource),
  ]);

  return {
    pubmed:
      pubmed.status === 'fulfilled'
        ? pubmed.value
        : (errors.push(`PubMed: ${(pubmed as PromiseRejectedResult).reason}`), []),
    google_news:
      google_news.status === 'fulfilled'
        ? google_news.value
        : (errors.push(`Google News: ${(google_news as PromiseRejectedResult).reason}`), []),
    errors,
  };
}
