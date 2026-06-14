import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  // Capture country from Vercel geolocation headers, fallback to Denmark (DK)
  const countryHeader = request.headers.get('x-vercel-ip-country') || 'DK';
  const countryCode = countryHeader.toUpperCase();

  // Create response
  const response = NextResponse.next();

  // Set the country code cookie so subsequent client/server requests can read it.
  response.cookies.set('x-country-code', countryCode, {
    path: '/',
    maxAge: 60 * 60 * 24, // 24 hours
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  });

  // Inject country code into the request headers so server-side routes/API can read it directly.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-country-code', countryCode);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

// Configure proxy matcher to run on pages and API endpoints, excluding assets.
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public assets)
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};
