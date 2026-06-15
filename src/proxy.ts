// v1.4 Attribution Engine - Next.js 16 Compatible
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Cookie names
const REF_ID_COOKIE = 'weeds_ref_id';
const SESSION_ID_COOKIE = 'weeds_session_id';
const CONSENT_COOKIE = 'weeds_consent_marketing';
const COUNTRY_COOKIE = 'x-country-code';

// Cookie settings
const COOKIE_MAX_AGE = 30 * 24 * 60 * 60; // 30 days in seconds
const SESSION_MAX_AGE = 24 * 60 * 60; // 24 hours in seconds

/**
 * Generate a random ID for attribution
 */
function generateRefId(): string {
  return `ref_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * Generate a session ID
 */
function generateSessionId(): string {
  return `sess_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * Parse UTM parameters from URL
 */
function parseUtmParams(url: URL): Record<string, string> {
  const utmParams: Record<string, string> = {};
  const utmKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
  
  utmKeys.forEach(key => {
    const value = url.searchParams.get(key);
    if (value) {
      utmParams[key] = value;
    }
  });
  
  return utmParams;
}

/**
 * Middleware for attribution tracking and geofencing
 * Runs on: /, /journal/*, /shop/* (configured in matcher below)
 */
export function proxy(request: NextRequest) {
  const url = request.nextUrl;
  const response = NextResponse.next();
  
  // Get existing cookies
  const existingRefId = request.cookies.get(REF_ID_COOKIE)?.value;
  const existingSessionId = request.cookies.get(SESSION_ID_COOKIE)?.value;
  const consentGiven = request.cookies.get(CONSENT_COOKIE)?.value === 'true';
  
  // Get country from Vercel geolocation headers
  const countryHeader = request.headers.get('x-vercel-ip-country') || 'DK';
  const countryCode = countryHeader.toUpperCase();
  
  // Check for UTM parameters in URL
  const utmParams = parseUtmParams(url);
  const hasUtmParams = Object.keys(utmParams).length > 0;
  
  // Debug logging in development
  if (process.env.NODE_ENV === 'development') {
    console.log('[Attribution Debug]', {
      path: url.pathname,
      hasRefId: !!existingRefId,
      hasSessionId: !!existingSessionId,
      consentGiven,
      hasUtmParams,
      utmParams: hasUtmParams ? utmParams : undefined,
      countryCode,
    });
  }
  
  // Set country code cookie (always, as it's needed for compliance)
  response.cookies.set(COUNTRY_COOKIE, countryCode, {
    path: '/',
    maxAge: SESSION_MAX_AGE,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    httpOnly: false, // Needs to be accessible by client for geofencing
  });
  
  // Only set attribution cookies if:
  // 1. User has given consent (weeds_consent_marketing = true), OR
  // 2. UTM parameters are present in URL (first visit), OR  
  // 3. There's already a ref_id cookie (returning visitor)
  
  const shouldTrack = consentGiven || hasUtmParams || existingRefId;
  
  if (shouldTrack) {
    // Set or refresh ref_id cookie
    if (!existingRefId) {
      const newRefId = generateRefId();
      response.cookies.set(REF_ID_COOKIE, newRefId, {
        path: '/',
        maxAge: COOKIE_MAX_AGE,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true, // Prevent JavaScript access for security
      });
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Attribution] New ref_id created: ${newRefId}`);
      }
    }
    
    // Set or refresh session_id cookie
    if (!existingSessionId) {
      const newSessionId = generateSessionId();
      response.cookies.set(SESSION_ID_COOKIE, newSessionId, {
        path: '/',
        maxAge: SESSION_MAX_AGE,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
      });
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Attribution] New session_id created: ${newSessionId}`);
      }
    }
  }
  
  // Inject headers for server components to read
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(COUNTRY_COOKIE, countryCode);
  
  if (existingRefId) {
    requestHeaders.set('x-attribution-ref-id', existingRefId);
  }
  if (existingSessionId) {
    requestHeaders.set('x-attribution-session-id', existingSessionId);
  }
  
  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

/**
 * Matcher configuration
 * Only runs on specific routes: /, /journal/*, /shop/*
 * Excludes: API routes (except /api/exit), static files, _next/*
 */
export const config = {
  matcher: [
    // Home page
    '/',
    // Journal routes
    '/journal/:path*',
    // Shop routes
    '/shop/:path*',
  ],
};
