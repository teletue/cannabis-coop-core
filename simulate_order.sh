#!/bin/bash

# Simple shell script to simulate a Shopify order webhook locally.
# Sends a mock payload of 1500 DKK to the local webhook endpoint.
# Useful for verifying the database triggers and anti-whale progressive scaling.

PORT=3000
ENDPOINT="http://localhost:$PORT/api/webhooks/shopify"
MOCK_ORDER_ID="shopify-mock-order-$(date +%s)"

echo "--------------------------------------------------------"
echo "Simulating Shopify Purchase Hook:"
echo "Destination: $ENDPOINT"
echo "Order Reference: $MOCK_ORDER_ID"
echo "Price: 1500.00 DKK"
echo "Customer Email: kontakt@demokratisk-andel.dk"
echo "--------------------------------------------------------"

curl -X POST "$ENDPOINT" \
  -H "Content-Type: application/json" \
  -H "X-Shopify-Hmac-Sha256: mock-signature" \
  -d "{
    \"id\": \"$MOCK_ORDER_ID\",
    \"email\": \"kontakt@demokratisk-andel.dk\",
    \"total_price\": \"1500.00\",
    \"currency\": \"DKK\",
    \"customer\": {
      \"email\": \"kontakt@demokratisk-andel.dk\"
    }
  }"

echo -e "\n\nWebhook request dispatched. Check server logs for database write confirmations."
