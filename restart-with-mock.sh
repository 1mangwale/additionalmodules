#!/bin/bash

echo "🔄 Restarting all services with FINANCE_MOCK=true..."

# Kill all existing services
pkill -f "services-api.*main.ts" 2>/dev/null
pkill -f "rooms.*main.ts" 2>/dev/null  
pkill -f "movies.*main.ts" 2>/dev/null
pkill -f "venues.*main.ts" 2>/dev/null

sleep 2

# Start services with FINANCE_MOCK
cd /home/ubuntu/projects/additional-modules

FINANCE_MOCK=true pnpm --filter @mangwale/services-api dev > /tmp/services.log 2>&1 &
FINANCE_MOCK=true pnpm --filter @mangwale/rooms dev > /tmp/rooms.log 2>&1 &
FINANCE_MOCK=true pnpm --filter @mangwale/movies dev > /tmp/movies.log 2>&1 &
FINANCE_MOCK=true pnpm --filter @mangwale/venues dev > /tmp/venues.log 2>&1 &

echo "Waiting for services to start..."
sleep 5

echo ""
echo "✅ Services restarted. Testing..."
echo ""

# Test each booking endpoint
echo "Service Booking:"
curl -s -X POST "http://localhost:4002/services/book" -H "Content-Type: application/json" -d '{
  "userId": 12345,
  "storeId": 201,
  "serviceId": 4,
  "scheduledFor": "2026-05-10T10:00:00Z",
  "slotId": 26,
  "pricing": {"baseMinor": 5000, "visitFeeMinor": 1000, "taxMinor": 600},
  "payment": {"mode": "prepaid", "idempotencyKey": "test-'$(date +%s)'"}
}' | jq -r 'if .appointmentId then "✓ Success - ID: \(.appointmentId)" else "✗ Error: \(.message)" end'

echo ""
echo "Room Booking:"
curl -s -X POST "http://localhost:4001/rooms/book" -H "Content-Type: application/json" -d '{
  "userId": 23456,
  "storeId": 201,
  "checkIn": "2026-05-01",
  "checkOut": "2026-05-02",
  "items": [{"roomTypeId": 1, "ratePlanId": 1, "quantity": 1}],
  "payment": {"mode": "prepaid", "idempotencyKey": "test-'$(date +%s)'"}
}' | jq -r 'if .bookingId then "✓ Success - ID: \(.bookingId)" else "✗ Error: \(.message)" end'

echo ""
echo "Movie Booking:"
curl -s -X POST "http://localhost:4005/movies/book" -H "Content-Type: application/json" -d '{
  "userId": 34567,
  "storeId": 201,
  "showtimeId": 1,
  "seats": ["D-50", "D-51"],
  "payment": {"mode": "prepaid", "idempotencyKey": "test-'$(date +%s)'"}
}' | jq -r 'if .bookingId then "✓ Success - ID: \(.bookingId)" else "✗ Error: \(.message)" end'

echo ""
echo "Done! Check logs in /tmp/*.log if issues"
