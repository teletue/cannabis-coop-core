import { NextResponse } from 'next/server';
import { after } from 'next/server';
import crypto from 'crypto';
import { query } from '@/lib/db';

// Ensure the endpoint runs in the full Node.js environment (not Edge) for TCP DB pool support.
export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    // 1. Read raw request body to perform signature verification
    const rawBody = await request.text();
    const hmacHeader = request.headers.get('x-shopify-hmac-sha256') || '';
    
    const useMock = process.env.USE_MOCK_DATA === 'true';
    const secret = process.env.SHOPIFY_WEBHOOK_SECRET || '';

    // 2. Signature verification
    if (!useMock) {
      if (!secret) {
        console.error('SHOPIFY_WEBHOOK_SECRET is not configured in environment.');
        return NextResponse.json({ error: 'Webhook secret is not configured' }, { status: 500 });
      }
      const generatedHmac = crypto
        .createHmac('sha256', secret)
        .update(rawBody)
        .digest('base64');

      if (generatedHmac !== hmacHeader) {
        console.warn('Webhook signature mismatch. Refusing payload.');
        return NextResponse.json({ error: 'Invalid HMAC signature' }, { status: 401 });
      }
    }

    // 3. Ingest and parse payload
    const payload = JSON.parse(rawBody);
    const email = payload.email || payload.customer?.email;
    const totalAmount = payload.total_price || payload.total;
    const orderId = payload.id || payload.order_id;

    if (!email || !totalAmount || !orderId) {
      return NextResponse.json(
        { error: 'Missing customer email, total price, or unique order ID' },
        { status: 400 }
      );
    }

    // 4. Respond with 200 OK instantly to Shopify to avoid timeouts
    const response = NextResponse.json({ received: true });

    // 5. Asynchronously run database transactions using after() in the background
    after(async () => {
      try {
        console.log(`[Webhook Background] Processing order ${orderId} for ${email}...`);

        // A. Find or create member in members table
        const memberResult = await query(
          `INSERT INTO members (email, partner_level)
           VALUES ($1, 'medlem')
           ON CONFLICT (email) 
           DO UPDATE SET email = EXCLUDED.email -- No-op to return existing record
           RETURNING id, partner_level`,
          [email.toLowerCase()]
        );
        
        const member = memberResult.rows[0];

        // B. Calculate points generated (1 DKK = 1 Point)
        const pointsGenerated = parseFloat(totalAmount);

        // C. Extract tracking parameters from payload (for paid media & affiliate attribution)
        const gclid = payload.gclid || payload.attributes?.gclid || null;
        const clickId = payload.click_id || payload.attributes?.click_id || null;
        const utmSource = payload.utm_source || payload.attributes?.utm_source || null;
        const affiliateId = payload.affiliate_id || payload.attributes?.affiliate_id || null;
        const productId = payload.product_id || payload.attributes?.product_id || null;

        // D. Insert transaction with tracking data. ON CONFLICT (shopify_order_id) DO NOTHING silently drops duplicates.
        const txResult = await query(
          `INSERT INTO transactions 
           (member_id, shopify_order_id, amount, points_generated, status, gclid, click_id, utm_source, affiliate_id, product_id)
           VALUES ($1, $2, $3, $4, 'completed', $5, $6, $7, $8, $9)
           ON CONFLICT (shopify_order_id) DO NOTHING`,
          [member.id, String(orderId), parseFloat(totalAmount), pointsGenerated, gclid, clickId, utmSource, affiliateId, productId]
        );

        if (txResult.rowCount === 0) {
          console.log(`[Webhook Background] Order ${orderId} already exists in database. Request silently ignored.`);
        } else {
          console.log(`[Webhook Background] Order ${orderId} ingested successfully. ${pointsGenerated} points added.`);
        }
      } catch (dbError) {
        console.error(`[Webhook Background Error] Failed database write for order ${orderId}:`, dbError);
      }
    });

    return response;
  } catch (error) {
    console.error('Failed to parse webhook body:', error);
    return NextResponse.json({ error: 'Invalid payload body' }, { status: 400 });
  }
}
