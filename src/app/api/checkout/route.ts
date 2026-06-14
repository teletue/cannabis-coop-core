import { NextResponse } from 'next/server';
import { after } from 'next/server';

export const runtime = 'nodejs';

interface CheckoutPayload {
  productId: string;
  productName: string;
  price: number;
  email: string;
  gclid?: string;
  click_id?: string;
  utm_source?: string;
  affiliate_id?: string;
}

/**
 * POST /api/checkout
 * Simulated B2C checkout endpoint for luxury wellness products.
 * 
 * This endpoint:
 * 1. Receives product and tracking data from the frontend
 * 2. Persists tracking parameters from sessionStorage/cookies
 * 3. Forwards the order to the Shopify webhook handler internally
 * 
 * Tracking parameters are captured for:
 * - gclid: Google Click Identifier (Google Ads)
 * - click_id: Generic click tracking ID
 * - utm_source: Campaign source attribution
 * - affiliate_id: Partner/affiliate identifier
 */
export async function POST(request: Request) {
  try {
    const body: CheckoutPayload = await request.json();
    const { 
      productId, 
      productName, 
      price, 
      email, 
      gclid, 
      click_id, 
      utm_source, 
      affiliate_id 
    } = body;

    // Validate required fields
    if (!productId || !productName || !price || !email) {
      return NextResponse.json(
        { error: 'Missing required fields: productId, productName, price, email' },
        { status: 400 }
      );
    }

    // Generate mock order ID
    const mockOrderId = `mock_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // Construct internal webhook payload matching Shopify format
    const webhookPayload = {
      id: mockOrderId,
      email: email,
      total_price: price.toString(),
      customer: { email: email },
      // Pass tracking parameters in attributes for the webhook to extract
      attributes: {
        gclid: gclid || null,
        click_id: click_id || null,
        utm_source: utm_source || null,
        affiliate_id: affiliate_id || null,
        product_id: productId,
      },
      // Also include at root level for compatibility
      gclid: gclid || null,
      click_id: click_id || null,
      utm_source: utm_source || null,
      affiliate_id: affiliate_id || null,
      product_id: productId,
      line_items: [{
        product_id: productId,
        title: productName,
        price: price.toString(),
      }],
      created_at: new Date().toISOString(),
    };

    // Respond immediately to client
    const response = NextResponse.json({
      success: true,
      orderId: mockOrderId,
      message: 'Order received and processing',
      tracking: {
        gclid: gclid || null,
        affiliate_id: affiliate_id || null,
      },
    });

    // Asynchronously forward to Shopify webhook handler
    after(async () => {
      try {
        const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/webhooks/shopify`;
        
        // In mock mode, call the webhook directly without HMAC verification
        const webhookResponse = await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-shopify-hmac-sha256': 'mock-signature',
          },
          body: JSON.stringify(webhookPayload),
        });

        if (webhookResponse.ok) {
          console.log(`[Checkout] Order ${mockOrderId} forwarded successfully with tracking:`, {
            gclid: gclid || 'none',
            affiliate_id: affiliate_id || 'none',
          });
        } else {
          console.error(`[Checkout] Webhook forward failed for order ${mockOrderId}:`, await webhookResponse.text());
        }
      } catch (error) {
        console.error(`[Checkout] Error forwarding order ${mockOrderId}:`, error);
      }
    });

    return response;

  } catch (error) {
    console.error('Checkout processing error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
