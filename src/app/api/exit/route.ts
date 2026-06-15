import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { query } from '@/lib/db';

// Cookie names (must match middleware)
const REF_ID_COOKIE = 'weeds_ref_id';
const SESSION_ID_COOKIE = 'weeds_session_id';
const COUNTRY_COOKIE = 'x-country-code';

/**
 * Exit Click Handler
 * 
 * This route:
 * 1. Reads attribution cookies server-side
 * 2. Logs 'clicked_out' event to Supabase async
 * 3. Transforms destination URL by appending ref_id
 * 4. Redirects user to final destination
 * 
 * GET /api/exit?to=<destination_url>&product_id=<optional>&content_id=<optional>
 */
export async function GET(request: NextRequest) {
  try {
    const url = request.nextUrl;
    const destinationUrl = url.searchParams.get('to');
    const productId = url.searchParams.get('product_id') || null;
    const contentId = url.searchParams.get('content_id') || null;
    
    // Validate destination URL
    if (!destinationUrl) {
      return NextResponse.json(
        { error: 'Missing destination URL' },
        { status: 400 }
      );
    }
    
    // Parse and validate the destination URL
    let parsedDestination: URL;
    try {
      parsedDestination = new URL(destinationUrl);
      
      // Security: Only allow http/https protocols
      if (!['http:', 'https:'].includes(parsedDestination.protocol)) {
        return NextResponse.json(
          { error: 'Invalid protocol' },
          { status: 400 }
        );
      }
    } catch {
      return NextResponse.json(
        { error: 'Invalid destination URL' },
        { status: 400 }
      );
    }
    
    // Read cookies server-side
    const refId = request.cookies.get(REF_ID_COOKIE)?.value || null;
    const sessionId = request.cookies.get(SESSION_ID_COOKIE)?.value || null;
    const countryCode = request.cookies.get(COUNTRY_COOKIE)?.value || 'DK';
    
    // Get referrer and user agent from request headers
    const referrer = request.headers.get('referer') || null;
    const userAgent = request.headers.get('user-agent') || null;
    
    // Debug logging in development
    if (process.env.NODE_ENV === 'development') {
      console.log('[Exit Click]', {
        destination: destinationUrl,
        refId,
        sessionId,
        productId,
        contentId,
        countryCode,
        hasReferrer: !!referrer,
      });
    }
    
    // Log conversion event to Supabase (async, don't block redirect)
    const logConversion = async () => {
      try {
        await query(
          `INSERT INTO conversions (
            ref_id, session_id, event_type, path, product_id, content_id,
            country_code, user_agent, referrer, metadata
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [
            refId,
            sessionId,
            'clicked_out',
            url.pathname,
            productId,
            contentId,
            countryCode,
            userAgent,
            referrer,
            JSON.stringify({
              destination: destinationUrl,
              destination_domain: parsedDestination.hostname,
            }),
          ]
        );
        
        if (process.env.NODE_ENV === 'development') {
          console.log('[Exit Click] Event logged successfully');
        }
      } catch (error) {
        // Log error but don't fail the redirect
        console.error('[Exit Click] Failed to log conversion:', error);
      }
    };
    
    // Fire-and-forget the logging (don't await)
    logConversion();
    
    // Transform destination URL by adding ref_id if available
    if (refId) {
      parsedDestination.searchParams.set('ref_id', refId);
    }
    
    // Add UTM parameters if they're missing and we have session data
    if (!parsedDestination.searchParams.has('utm_source') && refId) {
      parsedDestination.searchParams.set('utm_source', 'weeds.dk');
      parsedDestination.searchParams.set('utm_medium', 'affiliate');
    }
    
    const finalDestination = parsedDestination.toString();
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Exit Click] Redirecting to: ${finalDestination}`);
    }
    
    // Perform the redirect (302 temporary redirect)
    return NextResponse.redirect(finalDestination, {
      status: 302,
      headers: {
        // Add cache control to prevent caching of exit clicks
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
    
  } catch (error) {
    console.error('[Exit Click] Unexpected error:', error);
    
    // If we have a destination, redirect anyway even if logging failed
    const destinationUrl = request.nextUrl.searchParams.get('to');
    if (destinationUrl) {
      return NextResponse.redirect(destinationUrl, { status: 302 });
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Also support POST for JavaScript-initiated exit clicks
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { to, product_id, content_id } = body;
    
    if (!to) {
      return NextResponse.json(
        { error: 'Missing destination URL' },
        { status: 400 }
      );
    }
    
    // Reuse GET logic by constructing a URL with query params
    const url = new URL('/api/exit', request.url);
    url.searchParams.set('to', to);
    if (product_id) url.searchParams.set('product_id', product_id);
    if (content_id) url.searchParams.set('content_id', content_id);
    
    // Create a new request with the GET method
    const getRequest = new Request(url, {
      method: 'GET',
      headers: request.headers,
    });
    
    return GET(getRequest as NextRequest);
    
  } catch (error) {
    console.error('[Exit Click POST] Error:', error);
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    );
  }
}
