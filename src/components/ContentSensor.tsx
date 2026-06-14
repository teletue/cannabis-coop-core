'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

// Tracking parameters to capture from URL and persist
const TRACKING_PARAMS = ['gclid', 'click_id', 'utm_source', 'utm_medium', 'utm_campaign', 'affiliate_id'];

interface TrackingData {
  gclid?: string;
  click_id?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  affiliate_id?: string;
  captured_at: number;
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
 * Persist tracking data to sessionStorage
 */
function persistTrackingData(data: Partial<TrackingData>): void {
  if (typeof window === 'undefined' || !window.sessionStorage) return;
  
  try {
    const existing = sessionStorage.getItem('tracking_data');
    const parsed: TrackingData = existing ? JSON.parse(existing) : { captured_at: Date.now() };
    
    // Merge new data, preferring existing values if already set
    const merged: TrackingData = {
      ...parsed,
      ...data,
      captured_at: parsed.captured_at || Date.now(),
    };
    
    sessionStorage.setItem('tracking_data', JSON.stringify(merged));
  } catch (e) {
    console.warn('Failed to persist tracking data:', e);
  }
}

/**
 * Get persisted tracking data from sessionStorage
 */
export function getTrackingData(): TrackingData | null {
  if (typeof window === 'undefined' || !window.sessionStorage) return null;
  
  try {
    const data = sessionStorage.getItem('tracking_data');
    return data ? JSON.parse(data) : null;
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
