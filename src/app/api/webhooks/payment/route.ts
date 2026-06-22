import { NextResponse } from 'next/server';
import { after } from 'next/server';
import { query } from '@/lib/db';
import { getAdapterByName } from '@/lib/payments/router';

export const runtime = 'nodejs';

/**
 * POST /api/webhooks/payment
 * Unified payment webhook handler for all gateway adapters.
 *
 * The gateway name is expected via the `x-gateway` header or the `gateway`
 * query parameter, e.g.:
 *   POST /api/webhooks/payment?gateway=quickpay
 *   POST /api/webhooks/payment?gateway=mollie
 *
 * Both QuickPay and Mollie are registered to call this URL.
 *
 * Flow:
 * 1. Identify gateway
 * 2. Verify webhook signature (QuickPay HMAC / Mollie re-fetch)
 * 3. Parse payload → orderId, amount, status
 * 4. On 'completed': upsert member + insert transaction (idempotent)
 * 5. On 'failed': update transaction status if exists
 */
export async function POST(request: Request) {
  const url = new URL(request.url);
  const gatewayName =
    request.headers.get('x-gateway') ??
    url.searchParams.get('gateway') ??
    'quickpay';

  const adapter = getAdapterByName(gatewayName);
  if (!adapter) {
    console.error(`[PaymentWebhook] Unknown gateway: ${gatewayName}`);
    return NextResponse.json({ error: 'Unknown gateway' }, { status: 400 });
  }

  const rawBody = await request.text();
  const signature =
    request.headers.get('x-quickpay-checksum-sha256') ??
    request.headers.get('x-mollie-signature') ??
    '';

  const valid = await adapter.verifyWebhook(rawBody, signature);
  if (!valid) {
    console.warn(`[PaymentWebhook] Invalid signature from ${gatewayName}`);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    payload = Object.fromEntries(new URLSearchParams(rawBody));
  }

  // Respond immediately; process DB work in background
  const response = NextResponse.json({ received: true });

  after(async () => {
    try {
      const { orderId, amount, status, gatewayPaymentId } =
        await adapter.parseWebhookPayload(payload);

      console.log(`[PaymentWebhook] ${gatewayName} → order=${orderId} status=${status} amount=${amount}`);

      if (status === 'completed') {
        // A. Find or create member (email not available at webhook time — use orderId as key)
        // The orderId embeds enough entropy; we rely on the checkout having stored
        // the email elsewhere (e.g. pending_orders table in a full implementation).
        // For now we upsert by shopify_order_id to stay idempotent.
        await query(
          `INSERT INTO transactions
             (member_id, shopify_order_id, amount, points_generated, status)
           SELECT
             m.id,
             $1,
             $2,
             $2,
             'completed'
           FROM members m
           WHERE m.id = (
             SELECT member_id FROM transactions WHERE shopify_order_id = $1 LIMIT 1
           )
           ON CONFLICT (shopify_order_id) DO UPDATE
             SET status = 'completed',
                 updated_at = NOW()`,
          [orderId, amount]
        );

        console.log(`[PaymentWebhook] Order ${orderId} marked completed (gateway: ${gatewayName}, paymentId: ${gatewayPaymentId ?? 'n/a'})`);
      } else if (status === 'failed') {
        await query(
          `UPDATE transactions
           SET status = 'failed', updated_at = NOW()
           WHERE shopify_order_id = $1 AND status != 'completed'`,
          [orderId]
        );
        console.log(`[PaymentWebhook] Order ${orderId} marked failed`);
      }
    } catch (err) {
      console.error(`[PaymentWebhook] Background DB error for ${gatewayName}:`, err);
    }
  });

  return response;
}
