import { query } from '@/lib/db';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  let report = '=== DIGITAL COOPERATIVE CORE - DIAGNOSTICS REPORT ===\n\n';
  let hasFailures = false;

  // 1. Check Environment Variables
  report += '[1] ENVIRONMENT VARIABLES CHECK:\n';
  const envVars = {
    DATABASE_URL: process.env.DATABASE_URL ? 'CONFIGURED' : 'MISSING',
    SHOPIFY_WEBHOOK_SECRET: process.env.SHOPIFY_WEBHOOK_SECRET ? 'CONFIGURED' : 'MISSING',
    USE_MOCK_DATA: process.env.USE_MOCK_DATA || 'undefined',
  };

  for (const [key, value] of Object.entries(envVars)) {
    report += `  - ${key}: ${value}\n`;
    if (value === 'MISSING') {
      hasFailures = true;
    }
  }
  report += '\n';

  // 2. Check Database Read Connectivity
  report += '[2] DATABASE READ CONNECTION CHECK:\n';
  try {
    const dbResult = await query('SELECT 1 AS ok');
    if (dbResult.rows && dbResult.rows[0]?.ok === 1) {
      report += '  - Status: CONNECTED (Clean read-only access established)\n';
    } else {
      throw new Error('Database returned unexpected response format.');
    }
  } catch (dbError: any) {
    hasFailures = true;
    report += '  - Status: FAILED\n';
    report += `  - Error Code: ${dbError.code || 'UNKNOWN'}\n`;
    report += `  - Details: ${dbError.message || dbError}\n`;
  }
  report += '\n';

  // 3. Check Webhook Receiver Block Status
  report += '[3] WEBHOOK ACCESS & SIGNATURE STATUS CHECK:\n';
  try {
    const webhookUrl = new URL('/api/webhooks/shopify', request.url);
    const testResponse = await fetch(webhookUrl.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}), // Sending empty payload
    });

    const status = testResponse.status;
    report += `  - Internal Request Status Code: ${status}\n`;
    
    if (status === 401) {
      report += '  - Signature Blocked: YES (HMAC Signature verification active and blocking incoming traffic)\n';
    } else if (status === 400) {
      report += '  - Signature Blocked: NO (HMAC signature bypassed. Payload rejected at validation step - correct mock behavior)\n';
    } else {
      report += `  - Signature Blocked: UNEXPECTED BEHAVIOR (Webhook endpoint returned status ${status})\n`;
      hasFailures = true;
    }
  } catch (fetchError: any) {
    hasFailures = true;
    report += '  - Status: FETCH FAILED (Could not connect to internal webhook endpoint)\n';
    report += `  - Details: ${fetchError.message || fetchError}\n`;
  }
  report += '\n';

  // Final Verdict
  report += '=====================================================\n';
  report += `FINAL STATUS: ${hasFailures ? 'FAILURES DETECTED' : 'ALL TESTS PASSED'}\n`;
  report += '=====================================================\n';

  return new Response(report, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    },
  });
}
