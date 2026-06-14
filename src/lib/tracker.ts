import { cookies } from 'next/headers';

// Attribution cookie names
export const ATTRIBUTION_COOKIES = {
  GCLID: 'attr_gclid',
  CLICK_ID: 'attr_click_id',
  UTM_SOURCE: 'attr_utm_source',
  UTM_MEDIUM: 'attr_utm_medium',
  UTM_CAMPAIGN: 'attr_utm_campaign',
  AFFILIATE_ID: 'attr_affiliate_id',
} as const;

// 30 days in seconds
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 2592000 seconds

export interface AttributionData {
  gclid?: string;
  click_id?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  affiliate_id?: string;
}

/**
 * Server-side: Read attribution cookies from request headers
 * Use this in API routes and Server Components
 */
export async function getAttributionCookies(): Promise<AttributionData> {
  try {
    const cookieStore = await cookies();
    
    return {
      gclid: cookieStore.get(ATTRIBUTION_COOKIES.GCLID)?.value,
      click_id: cookieStore.get(ATTRIBUTION_COOKIES.CLICK_ID)?.value,
      utm_source: cookieStore.get(ATTRIBUTION_COOKIES.UTM_SOURCE)?.value,
      utm_medium: cookieStore.get(ATTRIBUTION_COOKIES.UTM_MEDIUM)?.value,
      utm_campaign: cookieStore.get(ATTRIBUTION_COOKIES.UTM_CAMPAIGN)?.value,
      affiliate_id: cookieStore.get(ATTRIBUTION_COOKIES.AFFILIATE_ID)?.value,
    };
  } catch (e) {
    // Cookies not available (e.g., during static generation)
    return {};
  }
}

/**
 * Server-side: Set attribution cookies with 30-day lifetime
 * Use this in API routes when capturing initial attribution
 */
export async function setAttributionCookies(data: AttributionData): Promise<void> {
  try {
    const cookieStore = await cookies();
    
    if (data.gclid) {
      cookieStore.set(ATTRIBUTION_COOKIES.GCLID, data.gclid, {
        maxAge: COOKIE_MAX_AGE,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
      });
    }
    
    if (data.click_id) {
      cookieStore.set(ATTRIBUTION_COOKIES.CLICK_ID, data.click_id, {
        maxAge: COOKIE_MAX_AGE,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
      });
    }
    
    if (data.utm_source) {
      cookieStore.set(ATTRIBUTION_COOKIES.UTM_SOURCE, data.utm_source, {
        maxAge: COOKIE_MAX_AGE,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
      });
    }
    
    if (data.utm_medium) {
      cookieStore.set(ATTRIBUTION_COOKIES.UTM_MEDIUM, data.utm_medium, {
        maxAge: COOKIE_MAX_AGE,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
      });
    }
    
    if (data.utm_campaign) {
      cookieStore.set(ATTRIBUTION_COOKIES.UTM_CAMPAIGN, data.utm_campaign, {
        maxAge: COOKIE_MAX_AGE,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
      });
    }
    
    if (data.affiliate_id) {
      cookieStore.set(ATTRIBUTION_COOKIES.AFFILIATE_ID, data.affiliate_id, {
        maxAge: COOKIE_MAX_AGE,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
      });
    }
  } catch (e) {
    // Cookies not available during static generation
    console.warn('Failed to set attribution cookies:', e);
  }
}

/**
 * Cookie configuration for client-side cookie setting
 */
export const CLIENT_COOKIE_CONFIG = {
  maxAge: COOKIE_MAX_AGE,
  path: '/',
  sameSite: 'lax' as const,
  secure: typeof window !== 'undefined' && window.location.protocol === 'https:',
};
