import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

interface MediaPreview {
  url: string;
  platform: 'youtube' | 'instagram' | 'facebook' | 'tiktok' | 'twitter' | 'web';
  media_type: 'video' | 'post' | 'article';
  title: string;
  description: string;
  thumbnail_url: string;
  embed_id?: string;
  embed_url?: string;
  author_name?: string;
}

function extractYoutubeId(urlStr: string): string | null {
  try {
    const url = new URL(urlStr);
    if (url.hostname === 'youtu.be') {
      return url.pathname.slice(1);
    }
    if (url.hostname.includes('youtube.com')) {
      if (url.pathname.startsWith('/shorts/')) {
        return url.pathname.split('/shorts/')[1].split('/')[0];
      }
      if (url.pathname.startsWith('/embed/')) {
        return url.pathname.split('/embed/')[1].split('/')[0];
      }
      return url.searchParams.get('v');
    }
  } catch {
    // fallback regex
    const match = urlStr.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/);
    return match ? match[1] : null;
  }
  return null;
}

function extractInstagramShortcode(urlStr: string): string | null {
  const match = urlStr.match(/instagram\.com\/(?:p|reel|tv)\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const rawUrl = (body.url || '').trim();

    if (!rawUrl) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(rawUrl);
    } catch {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
    }

    // 1. YouTube
    const ytId = extractYoutubeId(rawUrl);
    if (ytId) {
      let title = 'YouTube Video';
      let author_name = '';
      let thumbnail_url = `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;

      try {
        const oembedRes = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${ytId}&format=json`, {
          signal: AbortSignal.timeout(5000),
        });
        if (oembedRes.ok) {
          const oembed = await oembedRes.json();
          title = oembed.title || title;
          author_name = oembed.author_name || author_name;
          thumbnail_url = oembed.thumbnail_url || thumbnail_url;
        }
      } catch {
        // use fallback thumbnail
      }

      const preview: MediaPreview = {
        url: rawUrl,
        platform: 'youtube',
        media_type: 'video',
        title,
        description: `Video af ${author_name || 'YouTube'}`,
        thumbnail_url,
        embed_id: ytId,
        embed_url: `https://www.youtube-nocookie.com/embed/${ytId}`,
        author_name,
      };

      return NextResponse.json({ preview });
    }

    // 2. Instagram
    const igCode = extractInstagramShortcode(rawUrl);
    if (igCode) {
      const isReel = rawUrl.includes('/reel/');
      const preview: MediaPreview = {
        url: rawUrl,
        platform: 'instagram',
        media_type: isReel ? 'video' : 'post',
        title: isReel ? 'Instagram Reel' : 'Instagram Opslag',
        description: 'Se opslaget på Instagram',
        thumbnail_url: '',
        embed_id: igCode,
        embed_url: `https://www.instagram.com/p/${igCode}/embed/captioned/`,
        author_name: 'Instagram',
      };
      return NextResponse.json({ preview });
    }

    // 3. TikTok
    if (parsedUrl.hostname.includes('tiktok.com')) {
      let title = 'TikTok Video';
      let author_name = 'TikTok';
      let thumbnail_url = '';

      try {
        const oembedRes = await fetch(`https://www.tiktok.com/oembed?url=${encodeURIComponent(rawUrl)}`, {
          signal: AbortSignal.timeout(5000),
        });
        if (oembedRes.ok) {
          const oembed = await oembedRes.json();
          title = oembed.title || title;
          author_name = oembed.author_name || author_name;
          thumbnail_url = oembed.thumbnail_url || thumbnail_url;
        }
      } catch {
        // fallback
      }

      const preview: MediaPreview = {
        url: rawUrl,
        platform: 'tiktok',
        media_type: 'video',
        title,
        description: `Video af ${author_name}`,
        thumbnail_url,
        embed_id: '',
        embed_url: rawUrl,
        author_name,
      };
      return NextResponse.json({ preview });
    }

    // 4. Facebook
    if (parsedUrl.hostname.includes('facebook.com') || parsedUrl.hostname.includes('fb.watch')) {
      const preview: MediaPreview = {
        url: rawUrl,
        platform: 'facebook',
        media_type: 'post',
        title: 'Facebook Opslag',
        description: 'Se indholdet på Facebook',
        thumbnail_url: '',
        embed_url: `https://www.facebook.com/plugins/post.php?href=${encodeURIComponent(rawUrl)}&show_text=true`,
        author_name: 'Facebook',
      };
      return NextResponse.json({ preview });
    }

    // 5. Generic Web / Articles (OpenGraph Scraper)
    try {
      const pageRes = await fetch(rawUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; weedsBot/1.0; +https://weeds.dk)',
          'Accept': 'text/html,application/xhtml+xml',
        },
        signal: AbortSignal.timeout(6000),
      });

      if (pageRes.ok) {
        const html = await pageRes.text();

        const getMeta = (prop: string): string => {
          const match = html.match(new RegExp(`<meta[^>]+(?:property|name)=["'](?:og:)?${prop}["'][^>]+content=["']([^"']+)["']`, 'i')) ||
                        html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["'](?:og:)?${prop}["']`, 'i'));
          return match ? match[1].trim() : '';
        };

        const pageTitleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
        const title = getMeta('title') || (pageTitleMatch ? pageTitleMatch[1].trim() : parsedUrl.hostname);
        const description = getMeta('description');
        const thumbnail_url = getMeta('image');
        const siteName = getMeta('site_name') || parsedUrl.hostname;

        const preview: MediaPreview = {
          url: rawUrl,
          platform: 'web',
          media_type: 'article',
          title,
          description,
          thumbnail_url,
          author_name: siteName,
        };

        return NextResponse.json({ preview });
      }
    } catch {
      // Fallback if fetch fails
    }

    // Basic Fallback
    const preview: MediaPreview = {
      url: rawUrl,
      platform: 'web',
      media_type: 'article',
      title: parsedUrl.hostname,
      description: rawUrl,
      thumbnail_url: '',
      author_name: parsedUrl.hostname,
    };

    return NextResponse.json({ preview });

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

