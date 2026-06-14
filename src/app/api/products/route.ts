import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getCountryCompliance } from '@/lib/compliance';

export const runtime = 'nodejs';

export interface Product {
  id: string;
  shopify_product_id: string;
  name: string;
  description: string;
  thc_percentage: number;
  price: number;
  image_url: string | null;
  category: string;
  supplier_id: string;
}

/**
 * GET /api/products
 * Returns geofenced products with content negotiation based on country compliance rules.
 * 
 * Headers:
 * - x-country-code: ISO country code (e.g., 'DK', 'DE')
 * 
 * Response:
 * - Products filtered by THC threshold for the country
 * - Descriptions switch between standard and compliant based on medical_claims_forbidden
 */
export async function GET(request: Request) {
  try {
    // 1. Capture country code from headers
    const headers = request.headers;
    const countryCode = headers.get('x-country-code') || 'DK';

    // 2. Fetch country compliance rules
    const compliance = await getCountryCompliance(countryCode);

    // 3. Default to restrictive if no compliance rules found
    const thcThreshold = compliance?.thc_threshold ?? 0.30;
    const medicalClaimsForbidden = compliance?.medical_claims_forbidden ?? true;

    // 4. Query products filtered by THC threshold
    const productsResult = await query(
      `SELECT 
        id,
        shopify_product_id,
        name,
        ${medicalClaimsForbidden ? 'description_compliant' : 'description_standard'} as description,
        thc_percentage,
        price,
        image_url,
        category,
        supplier_id
      FROM products
      WHERE thc_percentage <= $1
      ORDER BY category, name`,
      [thcThreshold]
    );

    const products: Product[] = productsResult.rows.map(row => ({
      id: row.id,
      shopify_product_id: row.shopify_product_id,
      name: row.name,
      description: row.description,
      thc_percentage: parseFloat(row.thc_percentage),
      price: parseFloat(row.price),
      image_url: row.image_url,
      category: row.category,
      supplier_id: row.supplier_id,
    }));

    return NextResponse.json({
      success: true,
      country: countryCode,
      compliance: {
        thc_threshold: thcThreshold,
        medical_claims_forbidden: medicalClaimsForbidden,
      },
      products,
      count: products.length,
    });

  } catch (error) {
    console.error('Failed to fetch products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}
