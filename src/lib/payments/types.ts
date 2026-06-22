export interface PaymentOrder {
  id: string;
  amount: number;
  currency: string;
  email: string;
  productName: string;
}

export interface PaymentResult {
  redirectUrl: string;
  gatewayPaymentId: string;
}

export interface WebhookParseResult {
  orderId: string;
  amount: number;
  status: 'completed' | 'failed' | 'pending';
  gatewayPaymentId?: string;
}

export interface PaymentGatewayAdapter {
  readonly name: string;

  createPayment(order: PaymentOrder): Promise<PaymentResult>;

  verifyWebhook(rawBody: string, signature: string): Promise<boolean>;

  parseWebhookPayload(payload: unknown): Promise<WebhookParseResult>;
}
