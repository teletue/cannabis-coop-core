// Simple script to simulate a Shopify order webhook locally.
// Sends a mock payload of 1500 DKK to the local webhook endpoint.
// Useful for verifying the database triggers and anti-whale progressive scaling.

const PORT = 3000;
const ENDPOINT = `http://localhost:${PORT}/api/webhooks/shopify`;
const MOCK_ORDER_ID = `shopify-mock-order-${Date.now()}`;

const payload = {
  id: MOCK_ORDER_ID,
  email: "kontakt@demokratisk-andel.dk",
  total_price: "1500.00",
  currency: "DKK",
  customer: {
    email: "kontakt@demokratisk-andel.dk",
  },
};

console.log("--------------------------------------------------------");
console.log("Simulating Shopify Purchase Hook:");
console.log(`Destination: ${ENDPOINT}`);
console.log(`Order Reference: ${MOCK_ORDER_ID}`);
console.log("Price: 1500.00 DKK");
console.log("Customer Email: kontakt@demokratisk-andel.dk");
console.log("--------------------------------------------------------");

fetch(ENDPOINT, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-Shopify-Hmac-Sha256": "mock-signature",
  },
  body: JSON.stringify(payload),
})
  .then(async (res) => {
    const text = await res.text();
    console.log(`\n\nWebhook request dispatched. Check server logs for database write confirmations.`);
    console.log(`Response status: ${res.status}`);
    console.log(`Response body: ${text}`);
  })
  .catch((err) => {
    console.error(`\nFailed to reach ${ENDPOINT}`);
    console.error(err.message);
    process.exit(1);
  });
