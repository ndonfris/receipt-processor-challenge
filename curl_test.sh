 #!/bin/bash

# Define server URL
SERVER_URL="http://localhost:3000"

echo "Testing Receipt Processor API..."
echo "--------------------------------"

# Test 1: Process a receipt
echo "STEP 1: Processing a receipt..."
RESPONSE=$(curl -s -X POST "$SERVER_URL/receipts/process" \
  -H "Content-Type: application/json" \
  -d '{
    "retailer": "Target",
    "purchaseDate": "2022-01-01",
    "purchaseTime": "13:01",
    "items": [
      {"shortDescription": "Mountain Dew 12PK", "price": "6.49"},
      {"shortDescription": "Emils Cheese Pizza", "price": "12.25"},
      {"shortDescription": "Knorr Creamy Chicken", "price": "1.26"},
      {"shortDescription": "Doritos Nacho Cheese", "price": "3.35"},
      {"shortDescription": "   Klarbrunn 12-PK 12 FL OZ  ", "price": "12.00"}
    ],
    "total": "35.35"
  }')

# Extract receipt ID from response using grep and cut
RECEIPT_ID=$(echo $RESPONSE | grep -o '"id":"[^"]*"' | cut -d'"' -f4)

if [ -z "$RECEIPT_ID" ]; then
  echo "❌ Failed to get receipt ID from response"
  echo "Response was: $RESPONSE"
  exit 1
else
  echo "✅ Receipt processed successfully!"
  echo "   Receipt ID: $RECEIPT_ID"
fi

# Test 2: Get points for the receipt
echo ""
echo "STEP 2: Checking points for receipt ID: $RECEIPT_ID"
POINTS_RESPONSE=$(curl -s -X GET "$SERVER_URL/receipts/$RECEIPT_ID/points")

# Extract points from response
POINTS=$(echo $POINTS_RESPONSE | grep -o '"points":[0-9]*' | cut -d':' -f2)

if [ -z "$POINTS" ]; then
  echo "❌ Failed to get points from response"
  echo "Response was: $POINTS_RESPONSE"
  exit 1
else
  echo "✅ Points retrieved successfully!"
  echo "   Receipt earned $POINTS points"
  
  # Verify points match expected value for the Target receipt example
  if [ "$POINTS" -eq 28 ]; then
    echo "✅ Points calculation is correct (expected 28 points)!"
  else
    echo "❌ Points calculation is incorrect (expected 28, got $POINTS)!"
  fi
fi

echo ""
echo "Test completed!"
