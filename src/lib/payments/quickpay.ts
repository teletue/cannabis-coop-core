import crypto from 'crypto';
import type { PaymentGatewayAdapter, PaymentOrder, PaymentResult, WebhookParseResult } from './types';

/**
 * QuickPay / Clearhaus adapter.
 *
 * Environment variables required:
 *   QUICKPAY_API_KEY      – QuickPay API key (merchant account)
 *   QUICKPAY_PRIVATE_KEY  – QuickPay private key used for webhook signature verification
 *   NEXT_PUBLIC_APP_URL   – Base URL of this app (for continue/cancel callbacks)
 */
export class QuickPayAdapter implements PaymentGatewayAdapter {
  readonly name = 'quickpay';

  private readonly apiKey: string;
  private readonly privateKey: string;
  private readonly baseUrl: string;

  constructor() {
    this.apiKey = process.env.QUICKPAY_API_KEY ?? '';
    this.privateKey = process.env.QUICKPAY_PRIVATE_KEY ?? '';
    this.baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  }

  async createPayment(order: PaymentOrder): Promise<PaymentResult> {
    const authHeader = Buffer.from(`:${this.apiKey}`).toString('base64');

    const paymentRes = await fetch('https://api.quickpay.net/payments', {
      method: 'POST',
      headers: {
        'Accept-Version': 'v10',
        Authorization: `Basic ${authHeader}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        order_id: order.id,
        currency: order.currency,
        variables: { email: order.email, product: order.productName },
      }),
    });

    if (!paymentRes.ok) {
      const err = await paymentRes.text();
      throw new Error(`[QuickPay] createPayment failed: ${paymentRes.status} ${err}`);
    }

    const payment = await paymentRes.json();
    const gatewayPaymentId: string = String(payment.id);

    const linkRes = await fetch(`https://api.quickpay.net/payments/${gatewayPaymentId}/link`, {
      method: 'PUT',
      headers: {
        'Accept-Version': 'v10',
        Authorization: `Basic ${authHeader}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: Math.round(order.amount * 100),
        continue_url: `${this.baseUrl}/checkout/success?order_id=${order.id}`,
        cancel_url: `${this.baseUrl}/checkout/cancel?order_id=${order.id}`,
        callback_url: `${this.baseUrl}/api/webhooks/payment`,
        payment_methods: 'creditcard',
        language: 'da',
      }),
    });

    if (!linkRes.ok) {
      const err = await linkRes.text();
      throw new Error(`[QuickPay] createPaymentLink failed: ${linkRes.status} ${err}`);
    }

    const link = await linkRes.json();
    return { redirectUrl: link.url as string, gatewayPaymentId };
  }

  async verifyWebhook(rawBody: string, signature: string): Promise<boolean> {
    if (!this.privateKey) return false;
    const computed = crypto
      .createHmac('sha256', this.privateKey)
      .update(rawBody)
      .digest('hex');
    return computed === signature;
  }

  async parseWebhookPayload(payload: unknown): Promise<WebhookParseResult> {
    const p = payload as Record<string, unknown>;
    const orderId = String(p['order_id'] ?? '');
    const gatewayPaymentId = String(p['id'] ?? '');
    const amountCents =
      (p['operations'] as Array<Record<string, unknown>> | undefined)?.[0]?.['amount'];
    const amount = typeof amountCents === 'number' ? amountCents / 100 : 0;

    const accepted = p['accepted'] as boolean | undefined;
    const state = p['state'] as string | undefined;

    let status: WebhookParseResult['status'] = 'pending';
    if (accepted === true && state === 'processed') status = 'completed';
    else if (accepted === false) status = 'failed';

    return { orderId, amount, status, gatewayPaymentId };
  }
}
