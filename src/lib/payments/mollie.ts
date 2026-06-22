import crypto from 'crypto';
import type { PaymentGatewayAdapter, PaymentOrder, PaymentResult, WebhookParseResult } from './types';

/**
 * Mollie adapter.
 *
 * Environment variables required:
 *   MOLLIE_API_KEY      – Mollie live or test API key (live_... / test_...)
 *   NEXT_PUBLIC_APP_URL – Base URL of this app (for redirect/webhook URLs)
 *
 * Mollie does not sign webhooks with HMAC — instead it sends a payment ID
 * and we verify by fetching the payment status from the API.
 * verifyWebhook() therefore always returns true; the actual status check
 * happens inside parseWebhookPayload() by re-fetching from Mollie's API.
 */
export class MollieAdapter implements PaymentGatewayAdapter {
  readonly name = 'mollie';

  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor() {
    this.apiKey = process.env.MOLLIE_API_KEY ?? '';
    this.baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  }

  async createPayment(order: PaymentOrder): Promise<PaymentResult> {
    const res = await fetch('https://api.mollie.com/v2/payments', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: {
          currency: order.currency,
          value: order.amount.toFixed(2),
        },
        description: order.productName,
        redirectUrl: `${this.baseUrl}/checkout/success?order_id=${order.id}`,
        cancelUrl: `${this.baseUrl}/checkout/cancel?order_id=${order.id}`,
        webhookUrl: `${this.baseUrl}/api/webhooks/payment`,
        metadata: { orderId: order.id, email: order.email },
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`[Mollie] createPayment failed: ${res.status} ${err}`);
    }

    const payment = await res.json();
    return {
      redirectUrl: payment._links.checkout.href as string,
      gatewayPaymentId: payment.id as string,
    };
  }

  async verifyWebhook(_rawBody: string, _signature: string): Promise<boolean> {
    return true;
  }

  async parseWebhookPayload(payload: unknown): Promise<WebhookParseResult> {
    const p = payload as Record<string, unknown>;
    const gatewayPaymentId = String(p['id'] ?? '');

    const res = await fetch(`https://api.mollie.com/v2/payments/${gatewayPaymentId}`, {
      headers: { Authorization: `Bearer ${this.apiKey}` },
    });

    if (!res.ok) {
      throw new Error(`[Mollie] Could not fetch payment ${gatewayPaymentId}: ${res.status}`);
    }

    const payment = await res.json();
    const mollieStatus: string = payment.status;
    const orderId: string = (payment.metadata?.orderId as string) ?? gatewayPaymentId;
    const amountValue = parseFloat(payment.amount?.value ?? '0');

    let status: WebhookParseResult['status'] = 'pending';
    if (mollieStatus === 'paid') status = 'completed';
    else if (['failed', 'canceled', 'expired'].includes(mollieStatus)) status = 'failed';

    return { orderId, amount: amountValue, status, gatewayPaymentId };
  }
}
