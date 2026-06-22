import { NextResponse } from 'next/server';
import { getAttributionCookies } from '@/lib/tracker';
import { getActiveGateway } from '@/lib/payments/router';

export const runtime = 'nodejs';

interface CheckoutPayload {
  productId: string;
  productName: string;
  price: number;
  currency?: string;
  email: string;
}

/**
 * POST /api/checkout
 * Real B2C checkout endpoint.
 *
 * Flow:
 * 1. Validate payload
 * 2. Read attribution cookies (set by proxy.ts)
 * 3. Select active payment gateway from the payment_gateways DB table
 * 4. Create a payment via the gateway adapter
 * 5. Return { redirectUrl } — client navigates the user to the payment page
 *
 * On return from the gateway the user lands on /checkout/success or /checkout/cancel.
 * The gateway POSTs a server-side webhook to /api/webhooks/payment which writes
 * the transaction to the DB.
 */
export async function POST(request: Request) {
  try {
    const body: CheckoutPayload = await request.json();
    const { productId, productName, price, email } = body;
    const currency = body.currency ?? 'DKK';

    if (!productId || !productName || !price || !email) {
      return NextResponse.json(
        { error: 'Missing required fields: productId, productName, price, email' },
        { status: 400 }
      );
    }

    // Read attribution cookies captured by proxy.ts
    const attribution = await getAttributionCookies();

    // Generate a stable order ID that will be threaded through to the webhook
    const orderId = `ord_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // Select gateway and create payment
    const gateway = await getActiveGateway();
    const { redirectUrl, gatewayPaymentId } = await gateway.createPayment({
      id: orderId,
      amount: price,
      currency,
      email,
      productName,
    });

    console.log(`[Checkout] Order ${orderId} created via ${gateway.name} (payment: ${gatewayPaymentId})`);
    if (attribution.gclid || attribution.affiliate_id) {
      console.log(`[Checkout] Attribution:`, {
        gclid: attribution.gclid ?? 'none',
        affiliate_id: attribution.affiliate_id ?? 'none',
        utm_source: attribution.utm_source ?? 'none',
      });
    }

    return NextResponse.json({
      success: true,
      orderId,
      redirectUrl,
      gateway: gateway.name,
    });

  } catch (error) {
    console.error('[Checkout] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
