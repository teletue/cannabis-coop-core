import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const runtime = 'nodejs';

interface Params {
  params: Promise<{ id: string }>;
}

export interface DiscoveredMedia {
  url: string;
  platform: 'youtube' | 'web';
  media_type: 'video' | 'article';
  title: string;
  description: string;
  thumbnail_url: string;
  embed_id?: string;
  embed_url?: string;
  author_name?: string;
  published_at?: string;
  alreadyAdded?: boolean;
}

function decodeHtml(str: string): string {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .trim();
}

async function discoverYouTube(searchTerm: string): Promise<DiscoveredMedia[]> {
  const ytUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(searchTerm)}`;
  try {
    const res = await fetch(ytUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept-Language': 'da-DK,da;q=0.9,en-US;q=0.8,en;q=0.7',
      },
      signal: AbortSignal.timeout(7000),
    });

    if (!res.ok) return [];
    const html = await res.text();

    const videoIds: string[] = [];
    const seen = new Set<string>();
    const videoRegex = /"videoRenderer":\{"videoId":"([a-zA-Z0-9_-]{11})"/g;
    let m;
    while ((m = videoRegex.exec(html)) !== null && videoIds.length < 6) {
      if (!seen.has(m[1])) {
        seen.add(m[1]);
        videoIds.push(m[1]);
      }
    }

    // Enrich with oEmbed in parallel
    const enriched = await Promise.all(
      videoIds.map(async (id): Promise<DiscoveredMedia> => {
        const videoUrl = `https://www.youtube.com/watch?v=${id}`;
        let title = 'YouTube Video';
        let author_name = 'YouTube';
        let thumbnail_url = `https://img.youtube.com/vi/${id}/hqdefault.jpg`;

        try {
          const oRes = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(videoUrl)}&format=json`, {
            signal: AbortSignal.timeout(4000),
          });
          if (oRes.ok) {
            const oData = await oRes.json();
            title = oData.title || title;
            author_name = oData.author_name || author_name;
            thumbnail_url = oData.thumbnail_url || thumbnail_url;
          }
        } catch {
          // fallback
        }

        return {
          url: videoUrl,
          platform: 'youtube',
          media_type: 'video',
          title,
          description: `Video af ${author_name}`,
          thumbnail_url,
          embed_id: id,
          embed_url: `https://www.youtube-nocookie.com/embed/${id}`,
          author_name,
        };
      })
    );

    return enriched;
  } catch {
    return [];
  }
}

async function discoverGoogleNews(searchTerm: string): Promise<DiscoveredMedia[]> {
  const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(searchTerm)}&hl=da&gl=DK&ceid=DK:da`;
  try {
    const res = await fetch(rssUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; weedsBot/1.0)',
      },
      signal: AbortSignal.timeout(6000),
    });

    if (!res.ok) return [];
    const xml = await res.text();

    const items: DiscoveredMedia[] = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
    let match;

    while ((match = itemRegex.exec(xml)) !== null && items.length < 6) {
      const block = match[1];
      const titleMatch = block.match(/<title>([\s\S]*?)<\/title>/i);
      const linkMatch = block.match(/<link>([\s\S]*?)<\/link>/i);
      const pubMatch = block.match(/<pubDate>([\s\S]*?)<\/pubDate>/i);
      const sourceMatch = block.match(/<source[^>]*>([\s\S]*?)<\/source>/i);

      if (titleMatch && linkMatch) {
        const rawTitle = decodeHtml(titleMatch[1]);
        const link = decodeHtml(linkMatch[1]);
        const source = sourceMatch ? decodeHtml(sourceMatch[1]) : 'Nyhedsmedie';
        const pubDate = pubMatch ? decodeHtml(pubMatch[1]) : '';

        items.push({
          url: link,
          platform: 'web',
          media_type: 'article',
          title: rawTitle,
          description: pubDate ? `Publiceret: ${new Date(pubDate).toLocaleDateString('da-DK')}` : `Nyhedsartikel fra ${source}`,
          thumbnail_url: '',
          author_name: source,
          published_at: pubDate || undefined,
        });
      }
    }

    return items;
  } catch {
    return [];
  }
}

export async function POST(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));

    const profileRes = await query(`SELECT id, name, entity_type FROM profiles WHERE id = $1`, [id]);
    if (profileRes.rowCount === 0) {
      return NextResponse.json({ error: 'Profil ikke fundet' }, { status: 404 });
    }

    const profile = profileRes.rows[0];
    const searchTerm = (body.customQuery && String(body.customQuery).trim())
      ? String(body.customQuery).trim()
      : `${profile.name} cannabis`;

    // Run both scrapers in parallel
    const [ytResults, newsResults] = await Promise.all([
      discoverYouTube(searchTerm),
      discoverGoogleNews(searchTerm),
    ]);

    const combined = [...ytResults, ...newsResults];

    // Check which URLs are already in media_items
    const existingRes = await query(`SELECT url FROM media_items`);
    const existingUrls = new Set(existingRes.rows.map(r => r.url));

    const results = combined.map(item => ({
      ...item,
      alreadyAdded: existingUrls.has(item.url),
    }));

    return NextResponse.json({
      query: searchTerm,
      profileName: profile.name,
      results,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

