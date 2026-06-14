'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function ContentSensor() {
  const pathname = usePathname();

  useEffect(() => {
    // Respect user's browser-level Do Not Track preference
    const dnt = navigator.doNotTrack || (window as any).doNotTrack || (navigator as any).msDoNotTrack;
    if (dnt === '1' || dnt === 'yes') {
      return;
    }

    const reportEvent = async (payload: {
      url: string;
      elementId?: string;
      eventType: 'view' | 'click';
      timestamp: number;
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

    // 1. Report page view on pathname change
    reportEvent({
      url: pathname,
      eventType: 'view',
      timestamp: Date.now(),
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
