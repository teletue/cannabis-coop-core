'use server';

import { cookies } from 'next/headers';

// Cookie configuration
const CONSENT_COOKIE = 'weeds_consent_marketing';
const REF_ID_COOKIE = 'weeds_ref_id';
const SESSION_ID_COOKIE = 'weeds_session_id';
const COOKIE_MAX_AGE = 30 * 24 * 60 * 60; // 30 days

/**
 * Check if marketing consent has been given
 */
export async function hasMarketingConsent(): Promise<boolean> {
  const cookieStore = await cookies();
  return cookieStore.get(CONSENT_COOKIE)?.value === 'true';
}

/**
 * Accept marketing consent and promote session cookies to persistent
 * This is called when user clicks "Accept" on the cookie banner
 */
export async function acceptMarketingConsent(): Promise<{ success: boolean; message: string }> {
  try {
    const cookieStore = await cookies();
    
    // Set consent cookie (30 days)
    cookieStore.set(CONSENT_COOKIE, 'true', {
      path: '/',
      maxAge: COOKIE_MAX_AGE,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
    });
    
    // If there's already a session_id, extend it to 30 days
    const existingSessionId = cookieStore.get(SESSION_ID_COOKIE)?.value;
    if (existingSessionId) {
      cookieStore.set(SESSION_ID_COOKIE, existingSessionId, {
        path: '/',
        maxAge: COOKIE_MAX_AGE,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
      });
    }
    
    // If there's already a ref_id, extend it to 30 days  
    const existingRefId = cookieStore.get(REF_ID_COOKIE)?.value;
    if (existingRefId) {
      cookieStore.set(REF_ID_COOKIE, existingRefId, {
        path: '/',
        maxAge: COOKIE_MAX_AGE,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
      });
    }
    
    console.log('[Consent] Marketing consent accepted and cookies promoted to persistent');
    
    return {
      success: true,
      message: 'Consent accepted successfully',
    };
    
  } catch (error) {
    console.error('[Consent] Failed to accept consent:', error);
    return {
      success: false,
      message: 'Failed to set consent',
    };
  }
}

/**
 * Reject marketing consent
 * Removes all tracking cookies
 */
export async function rejectMarketingConsent(): Promise<{ success: boolean; message: string }> {
  try {
    const cookieStore = await cookies();
    
    // Clear consent cookie
    cookieStore.set(CONSENT_COOKIE, '', {
      path: '/',
      maxAge: 0,
    });
    
    // Clear tracking cookies
    cookieStore.set(REF_ID_COOKIE, '', {
      path: '/',
      maxAge: 0,
    });
    
    cookieStore.set(SESSION_ID_COOKIE, '', {
      path: '/',
      maxAge: 0,
    });
    
    console.log('[Consent] Marketing consent rejected and tracking cookies cleared');
    
    return {
      success: true,
      message: 'Consent rejected and tracking cookies cleared',
    };
    
  } catch (error) {
    console.error('[Consent] Failed to reject consent:', error);
    return {
      success: false,
      message: 'Failed to clear consent',
    };
  }
}
