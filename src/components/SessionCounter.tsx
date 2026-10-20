'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

// Session marker cookie: presence = an active session. It holds no data,
// expires after 10 minutes, and is refreshed on every page view, giving a
// sliding 10-minute inactivity window. Fully anonymous — value is static.
const SESSION_COOKIE = 'wsc_active';
const SESSION_COOKIE_MAX_AGE = 10 * 60; // 10 minutes in seconds

// Paths where the counter is not displayed or counted
const EXCLUDED_PREFIXES = ['/admin', '/api'];

function hasActiveSession(): boolean {
  return document.cookie
    .split(';')
    .some((c) => c.trim().startsWith(`${SESSION_COOKIE}=`));
}

function refreshSessionCookie(): void {
  const secure = window.location.protocol === 'https:' ? '; secure' : '';
  document.cookie = `${SESSION_COOKIE}=1; max-age=${SESSION_COOKIE_MAX_AGE}; path=/; samesite=lax${secure}`;
}

async function fetchCount(path: string, increment: boolean): Promise<number | null> {
  try {
    const res = increment
      ? await fetch('/api/session-count', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ path }),
        })
      : await fetch(`/api/session-count?path=${encodeURIComponent(path)}`);
    if (!res.ok) return null;
    const data = await res.json();
    return typeof data.count === 'number' ? data.count : null;
  } catch {
    return null; // Counter must never break the page
  }
}

/**
 * Per-page session counter. Counts a new session only at its start
 * (no page views, no user tracking) and displays the page's count.
 */
export default function SessionCounter() {
  const pathname = usePathname();
  const [count, setCount] = useState<number | null>(null);

  const excluded = EXCLUDED_PREFIXES.some((p) => pathname?.startsWith(p));

  useEffect(() => {
    if (!pathname || excluded) {
      return;
    }

    // Respect the browser-level Do Not Track preference
    const dnt =
      navigator.doNotTrack ||
      (window as unknown as { doNotTrack?: string }).doNotTrack ||
      (navigator as unknown as { msDoNotTrack?: string }).msDoNotTrack;
    if (dnt === '1' || dnt === 'yes') {
      return;
    }

    // Every page view is counted, regardless of session state
    fetch('/api/page-view', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: pathname }),
    }).catch(() => {});

    const isSessionStart = !hasActiveSession();
    refreshSessionCookie();

    fetchCount(pathname, isSessionStart).then((n) => {
      if (n !== null) setCount(n);
    });
  }, [pathname, excluded]);

  if (excluded || count === null) return null;

  return (
    <div className="fixed bottom-4 right-4 z-40 px-3 py-1.5 rounded-full border border-[#E2E8F0] bg-[#FAF9F6]/90 backdrop-blur-sm text-xs text-[#718096]">
      Sessions: {count}
    </div>
  );
}
