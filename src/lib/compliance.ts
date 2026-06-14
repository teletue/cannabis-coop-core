import { query } from './db';

export interface CountryCompliance {
  country_code: string;
  country_name: string;
  country_allowed: boolean;
  thc_threshold: number;
  medical_claims_forbidden: boolean;
  requires_club_membership: boolean;
}

// In-memory cache for country compliance rules to avoid redundant database calls.
const complianceCache = new Map<string, { rules: CountryCompliance; expiresAt: number }>();
const CACHE_TTL_MS = 60 * 1000; // 1 minute cache TTL

/**
 * Checks compliance rules for a specific country.
 * Queries the `country_compliance` table and caches the result for 60 seconds.
 */
export async function getCountryCompliance(countryCode: string): Promise<CountryCompliance | null> {
  const normalizedCode = countryCode.toUpperCase();
  const cached = complianceCache.get(normalizedCode);
  
  if (cached && cached.expiresAt > Date.now()) {
    return cached.rules;
  }

  try {
    const res = await query(
      'SELECT country_code, country_name, country_allowed, thc_threshold, medical_claims_forbidden, requires_club_membership FROM country_compliance WHERE country_code = $1',
      [normalizedCode]
    );

    if (res.rows.length === 0) {
      return null;
    }

    const rules = res.rows[0] as CountryCompliance;
    complianceCache.set(normalizedCode, {
      rules,
      expiresAt: Date.now() + CACHE_TTL_MS,
    });

    return rules;
  } catch (error) {
    console.error('Failed to fetch country compliance for', normalizedCode, error);
    // If database fails, return a safe default (highly restrictive)
    return {
      country_code: normalizedCode,
      country_name: 'Unknown (Fallback)',
      country_allowed: false, // block by default on error
      thc_threshold: 0.00,
      medical_claims_forbidden: true,
      requires_club_membership: true,
    };
  }
}
