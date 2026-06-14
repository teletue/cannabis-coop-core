import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Geofencing Middleware
 * Detects user country and sets x-country-code header for compliance filtering.
 * 
 * Priority:
 * 1. Vercel's x-vercel-ip-country header (automatic on Vercel)
 * 2. Cloudflare's CF-IPCountry header
 * 3. Default to 'DK' for Denmark
 */
export function middleware(request: NextRequest) {
  // Get country from various sources
  const countryCode = 
    request.headers.get('x-vercel-ip-country') ||
    request.headers.get('cf-ipcountry') ||
    'DK'; // Default to Denmark

  // Clone the request headers and add our country code
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-country-code', countryCode);

  // Also set it in the response for client-side access if needed
  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  // Add country code to response headers for debugging
  response.headers.set('x-country-code', countryCode);
  response.headers.set('x-debug-region', countryCode);

  return response;
}

export const config = {
  matcher: [
    // Apply to all routes except static files and API webhooks
    '/((?!_next/static|_next/image|favicon.ico|api/webhooks).*)',
  ],
};
