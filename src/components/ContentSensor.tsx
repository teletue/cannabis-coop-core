'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

// Tracking parameters to capture from URL and persist
const TRACKING_PARAMS = ['gclid', 'click_id', 'utm_source', 'utm_medium', 'utm_campaign', 'affiliate_id'];

// Attribution cookie names (matching server-side tracker.ts)
const ATTRIBUTION_COOKIES = {
  GCLID: 'attr_gclid',
  CLICK_ID: 'attr_click_id',
  UTM_SOURCE: 'attr_utm_source',
  UTM_MEDIUM: 'attr_utm_medium',
  UTM_CAMPAIGN: 'attr_utm_campaign',
  AFFILIATE_ID: 'attr_affiliate_id',
};

// 30 days in seconds
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

interface TrackingData {
  gclid?: string;
  click_id?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  affiliate_id?: string;
}

/**
 * Parse URL search parameters for tracking data
 */
function parseTrackingParams(searchParams: URLSearchParams): Partial<TrackingData> {
  const data: Partial<TrackingData> = {};
  
  TRACKING_PARAMS.forEach(param => {
    const value = searchParams.get(param);
    if (value) {
      (data as any)[param] = value;
    }
  });
  
  return data;
}

/**
 * Set a first-party cookie with 30-day lifetime
 */
function setAttributionCookie(name: string, value: string): void {
  if (typeof document === 'undefined') return;
  
  try {
    const secure = window.location.protocol === 'https:' ? '; secure' : '';
    document.cookie = `${name}=${encodeURIComponent(value)}; max-age=${COOKIE_MAX_AGE}; path=/; samesite=lax${secure}`;
  } catch (e) {
    console.warn('Failed to set attribution cookie:', e);
  }
}

/**
 * Persist attribution data to first-party cookies (30-day lifetime)
 */
function persistTrackingData(data: Partial<TrackingData>): void {
  if (typeof document === 'undefined') return;
  
  try {
    if (data.gclid) setAttributionCookie(ATTRIBUTION_COOKIES.GCLID, data.gclid);
    if (data.click_id) setAttributionCookie(ATTRIBUTION_COOKIES.CLICK_ID, data.click_id);
    if (data.utm_source) setAttributionCookie(ATTRIBUTION_COOKIES.UTM_SOURCE, data.utm_source);
    if (data.utm_medium) setAttributionCookie(ATTRIBUTION_COOKIES.UTM_MEDIUM, data.utm_medium);
    if (data.utm_campaign) setAttributionCookie(ATTRIBUTION_COOKIES.UTM_CAMPAIGN, data.utm_campaign);
    if (data.affiliate_id) setAttributionCookie(ATTRIBUTION_COOKIES.AFFILIATE_ID, data.affiliate_id);
  } catch (e) {
    console.warn('Failed to persist tracking data to cookies:', e);
  }
}

/**
 * Get attribution data from cookies (for client-side use)
 * Server-side should use lib/tracker.ts getAttributionCookies()
 */
export function getTrackingData(): TrackingData | null {
  if (typeof document === 'undefined') return null;
  
  try {
    const cookies = document.cookie.split(';');
    const data: Partial<TrackingData> = {};
    
    cookies.forEach(cookie => {
      const [name, value] = cookie.trim().split('=');
      const decodedValue = decodeURIComponent(value || '');
      
      switch (name) {
        case ATTRIBUTION_COOKIES.GCLID:
          data.gclid = decodedValue;
          break;
        case ATTRIBUTION_COOKIES.CLICK_ID:
          data.click_id = decodedValue;
          break;
        case ATTRIBUTION_COOKIES.UTM_SOURCE:
          data.utm_source = decodedValue;
          break;
        case ATTRIBUTION_COOKIES.UTM_MEDIUM:
          data.utm_medium = decodedValue;
          break;
        case ATTRIBUTION_COOKIES.UTM_CAMPAIGN:
          data.utm_campaign = decodedValue;
          break;
        case ATTRIBUTION_COOKIES.AFFILIATE_ID:
          data.affiliate_id = decodedValue;
          break;
      }
    });
    
    return Object.keys(data).length > 0 ? data as TrackingData : null;
  } catch (e) {
    return null;
  }
}

export default function ContentSensor() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Respect user's browser-level Do Not Track preference
    const dnt = navigator.doNotTrack || (window as any).doNotTrack || (navigator as any).msDoNotTrack;
    if (dnt === '1' || dnt === 'yes') {
      return;
    }

    // 1. Parse and persist tracking parameters from URL
    const trackingData = parseTrackingParams(searchParams);
    if (Object.keys(trackingData).length > 0) {
      persistTrackingData(trackingData);
    }

    const reportEvent = async (payload: {
      url: string;
      elementId?: string;
      eventType: 'view' | 'click';
      timestamp: number;
      tracking?: Partial<TrackingData>;
    }) => {
      try {
        await fetch('/api/analytics', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });
      } catch (err) {
        // Silently fail to ensure user experience isn't interrupted by tracking failures
        console.warn('Analytics ping skipped');
      }
    };

    // 2. Report page view on pathname change (include tracking data if available)
    const persistedTracking = getTrackingData();
    reportEvent({
      url: pathname,
      eventType: 'view',
      timestamp: Date.now(),
      tracking: persistedTracking || undefined,
    });

    // 2. Global event listener for click elements marked with data-sensor-id
    const handleGlobalClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      // Search upwards to find if clicked element or its parent is tracked
      const sensorElement = target.closest('[data-sensor-id]');
      
      if (sensorElement) {
        const sensorId = sensorElement.getAttribute('data-sensor-id') || 'unnamed-sensor';
        reportEvent({
          url: pathname,
          elementId: sensorId,
          eventType: 'click',
          timestamp: Date.now(),
        });
      }
    };

    document.addEventListener('click', handleGlobalClick, { passive: true });

    return () => {
      document.removeEventListener('click', handleGlobalClick);
    };
  }, [pathname]);

  // This is a logic-only component, rendering no visual output
  return null;
}
