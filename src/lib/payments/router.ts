import { query } from '@/lib/db';
import type { PaymentGatewayAdapter } from './types';
import { QuickPayAdapter } from './quickpay';
import { MollieAdapter } from './mollie';

const ADAPTERS: Record<string, () => PaymentGatewayAdapter> = {
  quickpay: () => new QuickPayAdapter(),
  mollie:   () => new MollieAdapter(),
};

/**
 * Returns the highest-priority active gateway from the payment_gateways table.
 * Falls back to QuickPay if the DB is unreachable or no active gateway is found.
 */
export async function getActiveGateway(): Promise<PaymentGatewayAdapter> {
  try {
    const res = await query(
      `SELECT name FROM payment_gateways
       WHERE status = 'active'
       ORDER BY priority DESC
       LIMIT 1`
    );

    if (res.rows.length > 0) {
      const name: string = res.rows[0].name.toLowerCase();
      const factory = ADAPTERS[name];
      if (factory) {
        console.log(`[PaymentRouter] Selected gateway: ${name}`);
        return factory();
      }
      console.warn(`[PaymentRouter] Unknown gateway "${name}" in DB, falling back to quickpay`);
    } else {
      console.warn('[PaymentRouter] No active gateway in DB, falling back to quickpay');
    }
  } catch (err) {
    console.error('[PaymentRouter] DB error selecting gateway, falling back to quickpay:', err);
  }

  return new QuickPayAdapter();
}

/**
 * Returns an adapter by explicit name (used by webhook handler to match gateway).
 */
export function getAdapterByName(name: string): PaymentGatewayAdapter | null {
  const factory = ADAPTERS[name.toLowerCase()];
  return factory ? factory() : null;
}
