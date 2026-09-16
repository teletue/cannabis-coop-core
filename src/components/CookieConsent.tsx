'use client';

import { useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { GoogleAnalytics } from '@next/third-parties/google';
import { acceptMarketingConsent, rejectMarketingConsent } from '@/lib/consent';

const GA_MEASUREMENT_ID = 'G-WEY03MZ34B';

// Cookie name matching lib/consent.ts and proxy.ts
const CONSENT_COOKIE = 'weeds_consent_marketing';

type ConsentState = 'loading' | 'undecided' | 'accepted' | 'rejected';

/**
 * Read the consent cookie client-side (it is set with httpOnly: false)
 */
function readConsentCookie(): ConsentState {
  if (typeof document === 'undefined') return 'loading';

  const match = document.cookie.match(
    new RegExp(`(?:^|;\\s*)${CONSENT_COOKIE}=(true|false)`)
  );
  if (match?.[1] === 'true') return 'accepted';
  if (match?.[1] === 'false') return 'rejected';
  return 'undecided';
}

/**
 * Cookie consent banner + gated Google Analytics.
 *
 * - No consent decision yet → banner is shown, GA is NOT loaded
 * - Accepted               → banner hidden, GA tag loads
 * - Declined               → banner hidden, GA stays off (tracked cookies cleared server-side)
 *
 * State is read after mount to avoid hydration mismatch.
 */
// Cookies never change externally during a session, so no subscription needed
const subscribe = () => () => {};
const getServerSnapshot = (): ConsentState => 'loading';

export default function CookieConsent() {
  const cookieState = useSyncExternalStore(
    subscribe,
    readConsentCookie,
    getServerSnapshot
  );
  // Local override after the user clicks Accept/Decline in this session
  const [override, setOverride] = useState<ConsentState | null>(null);
  const state = override ?? cookieState;

  const handleAccept = async () => {
    const result = await acceptMarketingConsent();
    if (result.success) setOverride('accepted');
  };

  const handleReject = async () => {
    const result = await rejectMarketingConsent();
    if (result.success) setOverride('rejected');
  };

  return (
    <>
      {state === 'accepted' && <GoogleAnalytics gaId={GA_MEASUREMENT_ID} />}

      {state === 'undecided' && (
        <div className="fixed bottom-0 inset-x-0 z-50 border-t border-[#E2E8F0] bg-[#FAF9F6]/95 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <p className="text-sm font-light text-[#2D3748] max-w-2xl">
              We use cookies for statistics (Google Analytics) and attribution to
              understand how weeds.dk is used. Accept to help us improve, or
              decline to continue with necessary cookies only.{' '}
              <Link href="/privatlivspolitik" className="underline underline-offset-2 hover:text-[#1A202C]">
                Læs vores privatlivspolitik
              </Link>
            </p>
            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={handleReject}
                className="px-4 py-2 text-sm text-[#718096] hover:text-[#2D3748] border border-[#E2E8F0] rounded transition-colors"
              >
                Decline
              </button>
              <button
                onClick={handleAccept}
                className="px-4 py-2 text-sm bg-[#2D3748] text-[#FAF9F6] rounded hover:bg-[#4A5568] transition-colors"
              >
                Accept
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
