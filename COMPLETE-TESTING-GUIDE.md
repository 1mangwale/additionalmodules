# 🧪 COMPLETE TESTING GUIDE - END TO END

**Last Updated:** January 30, 2026  
**System Status:** Core features working, services running  
**Prerequisites:** Docker running, all services started

---

## QUICK START - Test in 5 Minutes

```bash
# 1. Verify services are running
curl http://localhost:4000/health

# 2. Test a complete booking flow
curl -X POST http://localhost:4001/vendor/rooms/room-types \
  -H "Content-Type: application/json" \
  -d '{
    "store_id": 1,
    "name": "Test Room",
    "accommodation_type": "hotel",
    "occupancy_adults": 2,
    "occupancy_children": 1
  }'

# 3. Create inventory
curl -X POST http://localhost:4001/vendor/rooms/inventory \
  -H "Content-Type: application/json" \
  -d '{
    "room_type_id": 1,
    "date": "2026-03-15",
    "total_rooms": 10,
    "sold_rooms": 0,
    "status": "open"
  }'

# 4. Book a room
curl -X POST http://localhost:4001/rooms/book \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 1,
    "storeId": 1,
    "checkIn": "2026-03-15",
    "checkOut": "2026-03-17",
    "rooms": 1,
    "adults": 2,
    "children": 0,
    "items": [{
      "roomTypeId": 1,
      "ratePlanId": 1,
      "nights": 2,
      "pricePerNightMinor": 500000,
      "taxMinor": 20000,
      "totalMinor": 1040000
    }],
    "payment": {
      "mode": "prepaid",
      "walletMinor": 1040000,
      "gatewayMinor": 0
    }
  }'

# 5. View your bookings
curl "http://localhost:4001/rooms/my-bookings?userId=1" | jq

# ✅ If you see booking data, EVERYTHING WORKS!
```

---

## TABLE OF CONTENTS

1. [Pre-Test Setup](#pre-test-setup)
2. [Service Health Checks](#service-health-checks)
3. [Database Verification](#database-verification)
4. [Room Bookings Testing](#room-bookings-testing)
5. [Service Appointments Testing](#service-appointments-testing)
6. [Movies Testing](#movies-testing)
7. [Vendor Workflows](#vendor-workflows)
8. [Error Scenarios](#error-scenarios)
9. [Performance Testing](#performance-testing)
10. [Automated Testing Scripts](#automated-testing-scripts)

---

## PRE-TEST SETUP

### 1. Start All Services

```bash
# Navigate to project
cd /home/ubuntu/projects/additional-modules

# Start Docker (Postgres + NATS)
docker-compose up -d

# Wait for database to be ready
sleep 5

# Install dependencies (if not done)
pnpm install

# Build shared package
pnpm --filter @mangwale/shared build

# Apply database schemas
docker exec mwv2-postgres psql -U postgres -d mangwale_booking -f /sql/001_base_schema.sql
docker exec mwv2-postgres psql -U postgres -d mangwale_booking -f /sql/002_movies.sql

# Start all services (in separate terminals or use PM2)
# Terminal 1:
pnpm --filter gateway dev

# Terminal 2:
pnpm --filter rooms dev

# Terminal 3:
pnpm --filter services-api dev

# Terminal 4:
pnpm --filter movies dev

# Terminal 5:
pnpm --filter pricing dev

# Terminal 6:
pnpm --filter bridge-finance dev

# OR use PM2 (if configured):
pm2 start ecosystem.config.js
pm2 logs
```

### 2. Verify Environment Variables

```bash
# Check .env file exists
cat .env | grep -E "DATABASE_URL|NATS_URL|FINANCE_MOCK"

# Should see:
# DATABASE_URL=postgresql://postgres:postgres@localhost:5432/mangwale_booking
# NATS_URL=nats://localhost:4222
# FINANCE_MOCK=true
```

### 3. Create Test Data Script

```bash
cat > test-setup.sh << 'EOF'
#!/bin/bash
set -e

echo "🔧 Creating test data..."

# Create room type
ROOM_TYPE_ID=$(curl -s -X POST http://localhost:4001/vendor/rooms/room-types \
  -H "Content-Type: application/json" \
  -d '{
    "store_id": 1,
    "name": "Deluxe Suite",
    "accommodation_type": "hotel",
    "occupancy_adults": 2,
    "occupancy_children": 1,
    "base_rate_minor": 500000
  }' | jq -r '.id')

echo "✅ Room type created: ID=$ROOM_TYPE_ID"

# Create inventory for next 7 days
for i in {0..6}; do
  DATE=$(date -d "+$i days" +%Y-%m-%d)
  curl -s -X POST http://localhost:4001/vendor/rooms/inventory \
    -H "Content-Type: application/json" \
    -d "{
      \"room_type_id\": $ROOM_TYPE_ID,
      \"date\": \"$DATE\",
      \"total_rooms\": 10,
      \"sold_rooms\": 0,
      \"status\": \"open\"
    }" > /dev/null
  echo "✅ Inventory created for $DATE"
done

# Create service
SERVICE_ID=$(curl -s -X POST http://localhost:4002/vendor/services/catalog \
  -H "Content-Type: application/json" \
  -d '{
    "store_id": 1,
    "name": "Plumber Service",
    "parent_category": "plumber",
    "base_rate_minor": 50000,
    "visit_fee_minor": 20000
  }' | jq -r '.id')

echo "✅ Service created: ID=$SERVICE_ID"

# Create time slots
for i in {0..6}; do
  DATE=$(date -d "+$i days" +%Y-%m-%d)
  for hour in 9 10 11 14 15 16; do
    curl -s -X POST http://localhost:4002/vendor/services/slots \
      -H "Content-Type: application/json" \
      -d "{
        \"service_id\": $SERVICE_ID,
        \"store_id\": 1,
        \"date\": \"$DATE\",
        \"hour_start\": $hour,
        \"capacity\": 3,
        \"booked_count\": 0,
        \"status\": \"open\"
      }" > /dev/null
  done
  echo "✅ Slots created for $DATE"
done

echo "🎉 Test data setup complete!"
EOF

chmod +x test-setup.sh
```

---

## SERVICE HEALTH CHECKS

### Test 1: Gateway Health

```bash
# Basic health check
curl http://localhost:4000/health

# Expected response:
# {"ok":true,"ts":"2026-01-30T..."}
```

**✅ Pass Criteria:** Returns 200 OK with timestamp

### Test 2: All Services Responding

```bash
# Test each service directly
echo "Testing Gateway..." && curl -s http://localhost:4000/health | jq
echo "Testing Rooms..." && curl -s http://localhost:4001/health | jq
echo "Testing Services..." && curl -s http://localhost:4002/health | jq
echo "Testing Movies..." && curl -s http://localhost:4005/health | jq
echo "Testing Pricing..." && curl -s http://localhost:4003/health | jq
echo "Testing Finance..." && curl -s http://localhost:4004/health | jq
```

**✅ Pass Criteria:** All return `{"ok":true}`

### Test 3: Database Connection

```bash
# Check if services can query database
curl "http://localhost:4001/vendor/rooms/room-types"

# Should return array (empty or with data)
# {"items":[],"total":0} or {"items":[{...}],"total":1}
```

**✅ Pass Criteria:** No database connection errors

### Test 4: NATS Connection

```bash
# Check NATS is running
docker exec mwv2-nats nats account info

# Should show server info, not errors
```

**✅ Pass Criteria:** NATS responds without errors

---

## DATABASE VERIFICATION

### Test 5: Verify Schema Loaded

```bash
# List all tables
docker exec mwv2-postgres psql -U postgres -d mangwale_booking -c "\dt"

# Expected tables:
# room_types
# room_rate_plans
# room_inventory
# room_bookings
# room_booking_items
# services_catalog
# service_slots
# service_appointments
# movies
# screens
# showtimes
# vendor_pricing_slabs
```

**✅ Pass Criteria:** All tables exist

### Test 6: Check Table Structure

```bash
# Verify room_bookings has correct columns
docker exec mwv2-postgres psql -U postgres -d mangwale_booking -c \
  "SELECT column_name, data_type FROM information_schema.columns 
   WHERE table_name = 'room_bookings' ORDER BY ordinal_position;"

# Should include: id (uuid), user_id, store_id, check_in, check_out, status, etc.
```

**✅ Pass Criteria:** All expected columns present

### Test 7: Test Data Insertion

```bash
# Insert test row
docker exec mwv2-postgres psql -U postgres -d mangwale_booking -c \
  "INSERT INTO room_types (store_id, name, accommodation_type, occupancy_adults) 
   VALUES (999, 'Test Room', 'hotel', 2) RETURNING id;"

# Should return ID
```

**✅ Pass Criteria:** Row inserted successfully

---

## ROOM BOOKINGS TESTING

### Test 8: Create Room Type (Vendor)

```bash
curl -X POST http://localhost:4001/vendor/rooms/room-types \
  -H "Content-Type: application/json" \
  -d '{
    "store_id": 1,
    "name": "Premium Suite",
    "accommodation_type": "hotel",
    "occupancy_adults": 3,
    "occupancy_children": 2,
    "base_rate_minor": 750000
  }' | jq

# Expected: {"id":1,"store_id":"1","name":"Premium Suite",...}
```

**✅ Pass Criteria:** Returns room type with ID

### Test 9: Create Inventory (Vendor)

```bash
curl -X POST http://localhost:4001/vendor/rooms/inventory \
  -H "Content-Type: application/json" \
  -d '{
    "room_type_id": 1,
    "date": "2026-04-01",
    "total_rooms": 15,
    "sold_rooms": 0,
    "status": "open"
  }' | jq

# Repeat for 2026-04-02
curl -X POST http://localhost:4001/vendor/rooms/inventory \
  -H "Content-Type: application/json" \
  -d '{
    "room_type_id": 1,
    "date": "2026-04-02",
    "total_rooms": 15,
    "sold_rooms": 0,
    "status": "open"
  }' | jq
```

**✅ Pass Criteria:** Inventory created for both dates

### Test 10: Book Room (User)

```bash
curl -X POST http://localhost:4001/rooms/book \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 100,
    "storeId": 1,
    "checkIn": "2026-04-01",
    "checkOut": "2026-04-03",
    "rooms": 2,
    "adults": 4,
    "children": 1,
    "items": [{
      "roomTypeId": 1,
      "ratePlanId": 1,
      "nights": 2,
      "pricePerNightMinor": 750000,
      "taxMinor": 30000,
      "totalMinor": 3120000
    }],
    "payment": {
      "mode": "prepaid",
      "walletMinor": 3120000,
      "gatewayMinor": 0
    }
  }' | jq

# Expected: {"bookingId":"<uuid>","status":"confirmed"}
```

**✅ Pass Criteria:** Returns booking ID with confirmed status

**Save booking ID for next tests:**
```bash
BOOKING_ID="<paste-uuid-here>"
```

### Test 11: Verify Inventory Decremented

```bash
# Check sold_rooms increased
curl "http://localhost:4001/vendor/rooms/inventory" | jq '.[] | select(.date=="2026-04-01" or .date=="2026-04-02")'

# Expected: sold_rooms = 2 (we booked 2 rooms)
```

**✅ Pass Criteria:** sold_rooms increased from 0 to 2

### Test 12: Verify Booking in Database

```bash
docker exec mwv2-postgres psql -U postgres -d mangwale_booking -c \
  "SELECT id, user_id, store_id, check_in, check_out, rooms, status 
   FROM room_bookings WHERE user_id = 100;"

# Should show the booking we just created
```

**✅ Pass Criteria:** Booking exists in database

### Test 13: User Views Their Bookings

```bash
curl "http://localhost:4001/rooms/my-bookings?userId=100" | jq

# Expected: Array with our booking including nested roomType details
```

**✅ Pass Criteria:** Returns bookings array with full details

### Test 14: Vendor Views All Bookings

```bash
curl "http://localhost:4001/vendor/rooms/bookings?storeId=1" | jq

# Expected: Array with ALL bookings for store 1
```

**✅ Pass Criteria:** Vendor sees the booking

### Test 15: Filter by Status

```bash
# Get only confirmed bookings
curl "http://localhost:4001/vendor/rooms/bookings?storeId=1&status=confirmed" | jq

# Should include our booking

# Get cancelled bookings (should be empty)
curl "http://localhost:4001/vendor/rooms/bookings?storeId=1&status=cancelled" | jq

# Should be empty array
```

**✅ Pass Criteria:** Filtering works correctly

### Test 16: Cancel Booking

```bash
curl -X POST http://localhost:4001/rooms/cancel \
  -H "Content-Type: application/json" \
  -d "{
    \"bookingId\": \"$BOOKING_ID\",
    \"userId\": 100
  }" | jq

# Expected: {"bookingId":"...","refunded_minor":3120000,"message":"Refunded ₹31200.00"}
```

**✅ Pass Criteria:** Refund processed

### Test 17: Verify Inventory Restored

```bash
# Check sold_rooms decreased back
curl "http://localhost:4001/vendor/rooms/inventory" | jq '.[] | select(.date=="2026-04-01" or .date=="2026-04-02")'

# Expected: sold_rooms = 0 (inventory restored)
```

**✅ Pass Criteria:** sold_rooms back to 0

### Test 18: Verify Status Changed

```bash
curl "http://localhost:4001/rooms/my-bookings?userId=100" | jq '.bookings[0].status'

# Expected: "cancelled"
```

**✅ Pass Criteria:** Status is cancelled

---

## SERVICE APPOINTMENTS TESTING

### Test 19: Create Service (Vendor)

```bash
curl -X POST http://localhost:4002/vendor/services/catalog \
  -H "Content-Type: application/json" \
  -d '{
    "store_id": 1,
    "name": "Emergency Plumbing",
    "parent_category": "plumber",
    "base_rate_minor": 80000,
    "visit_fee_minor": 30000
  }' | jq

# Expected: {"id":1,"store_id":"1","name":"Emergency Plumbing",...}
```

**✅ Pass Criteria:** Service created with ID

### Test 20: Create Time Slots (Vendor)

```bash
# Create slots for tomorrow
TOMORROW=$(date -d "+1 day" +%Y-%m-%d)

for hour in 9 10 11 14 15; do
  curl -s -X POST http://localhost:4002/vendor/services/slots \
    -H "Content-Type: application/json" \
    -d "{
      \"service_id\": 1,
      \"store_id\": 1,
      \"date\": \"$TOMORROW\",
      \"hour_start\": $hour,
      \"capacity\": 2,
      \"booked_count\": 0,
      \"status\": \"open\"
    }" | jq -c '{id, hour_start}'
done
```

**✅ Pass Criteria:** 5 slots created

### Test 21: Book Service Appointment (User)

```bash
# Get a slot ID first
SLOT_ID=$(curl -s "http://localhost:4002/services/slots?store_id=1&date=$TOMORROW" | jq -r '.items[0].id')

echo "Booking slot: $SLOT_ID"

curl -X POST http://localhost:4002/services/book \
  -H "Content-Type: application/json" \
  -d "{
    \"userId\": 200,
    \"storeId\": 1,
    \"serviceId\": 1,
    \"slotId\": $SLOT_ID,
    \"baseAmountMinor\": 80000,
    \"visitFeeMinor\": 30000,
    \"payment\": {
      \"mode\": \"cod\",
      \"walletMinor\": 0,
      \"gatewayMinor\": 0
    }
  }" | jq

# Expected: {"jobId":"<uuid>","status":"confirmed"}
```

**✅ Pass Criteria:** Appointment created

**Save job ID:**
```bash
JOB_ID="<paste-uuid-here>"
```

### Test 22: Verify Slot Capacity Decremented

```bash
curl "http://localhost:4002/services/slots?store_id=1&date=$TOMORROW" | jq ".items[] | select(.id==$SLOT_ID)"

# Expected: booked_count = 1 (was 0)
```

**✅ Pass Criteria:** booked_count increased

### Test 23: User Views Their Appointments

```bash
curl "http://localhost:4002/services/my-appointments?userId=200" | jq

# Expected: Array with our appointment
```

**✅ Pass Criteria:** User sees their appointment

### Test 24: Vendor Views All Appointments

```bash
curl "http://localhost:4002/vendor/services/appointments?storeId=1" | jq

# Expected: Array with ALL appointments
```

**✅ Pass Criteria:** Vendor sees appointment

### Test 25: Complete Service with Additional Charges

```bash
curl -X POST http://localhost:4002/services/complete \
  -H "Content-Type: application/json" \
  -d "{
    \"jobId\": \"$JOB_ID\",
    \"additionsMinor\": 20000
  }" | jq

# Expected: {"jobId":"...","charged_minor":20000,"message":"Charged ₹200.00"}
```

**✅ Pass Criteria:** Additional charge processed

### Test 26: Verify Status Changed to Completed

```bash
curl "http://localhost:4002/services/my-appointments?userId=200" | jq '.appointments[0]'

# Expected: status = "completed", final_amount > base_amount
```

**✅ Pass Criteria:** Status is completed

### Test 27: Cancel Service Appointment

```bash
# Book another appointment first
SLOT_ID2=$(curl -s "http://localhost:4002/services/slots?store_id=1&date=$TOMORROW" | jq -r '.items[1].id')

JOB_ID2=$(curl -s -X POST http://localhost:4002/services/book \
  -H "Content-Type: application/json" \
  -d "{
    \"userId\": 200,
    \"storeId\": 1,
    \"serviceId\": 1,
    \"slotId\": $SLOT_ID2,
    \"baseAmountMinor\": 80000,
    \"visitFeeMinor\": 30000,
    \"payment\": {
      \"mode\": \"prepaid\",
      \"walletMinor\": 110000,
      \"gatewayMinor\": 0
    }
  }" | jq -r '.jobId')

# Now cancel it
curl -X POST http://localhost:4002/services/cancel \
  -H "Content-Type: application/json" \
  -d "{
    \"jobId\": \"$JOB_ID2\"
  }" | jq

# Expected: Refund minus visit fee penalty
```

**✅ Pass Criteria:** Refund processed

---

## MOVIES TESTING

### Test 28: Browse Movies

```bash
curl "http://localhost:4005/movies/catalog?store_id=1" | jq

# Expected: Array of movies (may be empty)
```

**✅ Pass Criteria:** Returns movies array

### Test 29: View Showtimes

```bash
curl "http://localhost:4005/movies/showtimes?store_id=1" | jq

# Expected: Array of showtimes
```

**✅ Pass Criteria:** Returns showtimes

### Test 30: Try to Book Movie (Should Fail - Not Implemented)

```bash
curl -X POST http://localhost:4005/movies/book \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 1,
    "showtimeId": 1,
    "seats": 2
  }'

# Expected: 404 Not Found or similar error
```

**✅ Pass Criteria:** Returns error (endpoint doesn't exist)

---

## VENDOR WORKFLOWS

### Test 31: Vendor Daily Workflow

```bash
# Morning: Check today's bookings
TODAY=$(date +%Y-%m-%d)

echo "=== Today's Room Bookings ==="
curl "http://localhost:4001/vendor/rooms/bookings?storeId=1" | \
  jq ".bookings[] | select(.check_in==\"$TODAY\" or .check_out==\"$TODAY\")"

echo "=== Today's Service Appointments ==="
curl "http://localhost:4002/vendor/services/appointments?storeId=1" | \
  jq ".appointments[] | select(.date==\"$TODAY\")"

echo "=== Inventory Status ==="
curl "http://localhost:4001/vendor/rooms/inventory" | \
  jq ".[] | select(.date==\"$TODAY\")"
```

**✅ Pass Criteria:** Vendor sees all relevant data

### Test 32: Vendor Revenue Calculation

```bash
# Calculate today's revenue
curl "http://localhost:4001/vendor/rooms/bookings?storeId=1&status=confirmed" | \
  jq '[.bookings[].items[].total | tonumber] | add'

# Expected: Total revenue in rupees
```

**✅ Pass Criteria:** Calculation works

---

## ERROR SCENARIOS

### Test 33: Overbooking Prevention

```bash
# Try to book more rooms than available
curl -X POST http://localhost:4001/rooms/book \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 999,
    "storeId": 1,
    "checkIn": "2026-04-01",
    "checkOut": "2026-04-03",
    "rooms": 999,
    "adults": 2,
    "children": 0,
    "items": [{
      "roomTypeId": 1,
      "ratePlanId": 1,
      "nights": 2,
      "pricePerNightMinor": 500000,
      "taxMinor": 20000,
      "totalMinor": 1040000
    }],
    "payment": {"mode": "prepaid", "walletMinor": 1040000, "gatewayMinor": 0}
  }'

# Expected: Error "Not enough rooms available"
```

**✅ Pass Criteria:** Booking rejected

### Test 34: Invalid Date Range

```bash
# Try check-out before check-in
curl -X POST http://localhost:4001/rooms/book \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 999,
    "storeId": 1,
    "checkIn": "2026-04-10",
    "checkOut": "2026-04-01",
    "rooms": 1,
    "adults": 2,
    "children": 0,
    "items": [{...}],
    "payment": {...}
  }'

# Expected: Validation error
```

**✅ Pass Criteria:** Request rejected

### Test 35: Cancel Non-Existent Booking

```bash
curl -X POST http://localhost:4001/rooms/cancel \
  -H "Content-Type: application/json" \
  -d '{
    "bookingId": "00000000-0000-0000-0000-000000000000",
    "userId": 1
  }'

# Expected: 404 Not Found
```

**✅ Pass Criteria:** Error returned

### Test 36: Book Without Inventory

```bash
# Try to book for a date with no inventory
curl -X POST http://localhost:4001/rooms/book \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 999,
    "storeId": 1,
    "checkIn": "2030-12-31",
    "checkOut": "2031-01-02",
    "rooms": 1,
    "adults": 2,
    "children": 0,
    "items": [{...}],
    "payment": {...}
  }'

# Expected: Error "Inventory not found"
```

**✅ Pass Criteria:** Booking rejected

---

## PERFORMANCE TESTING

### Test 37: Concurrent Bookings

```bash
# Create test script
cat > concurrent-test.sh << 'EOF'
#!/bin/bash
for i in {1..10}; do
  (curl -s -X POST http://localhost:4001/rooms/book \
    -H "Content-Type: application/json" \
    -d "{
      \"userId\": $i,
      \"storeId\": 1,
      \"checkIn\": \"2026-05-01\",
      \"checkOut\": \"2026-05-02\",
      \"rooms\": 1,
      \"adults\": 2,
      \"children\": 0,
      \"items\": [{
        \"roomTypeId\": 1,
        \"ratePlanId\": 1,
        \"nights\": 1,
        \"pricePerNightMinor\": 500000,
        \"taxMinor\": 20000,
        \"totalMinor\": 520000
      }],
      \"payment\": {\"mode\": \"prepaid\", \"walletMinor\": 520000, \"gatewayMinor\": 0}
    }" &)
done
wait
EOF

chmod +x concurrent-test.sh
./concurrent-test.sh
```

**✅ Pass Criteria:** All requests complete without race conditions

### Test 38: Load Test (Simple)

```bash
# Install apache bench if needed
sudo apt-get install apache2-utils -y

# Test room search endpoint
ab -n 1000 -c 10 "http://localhost:4001/rooms/search?location=Test"

# Expected: 0% failed requests
```

**✅ Pass Criteria:** All requests succeed

---

## AUTOMATED TESTING SCRIPTS

### Complete Test Suite

Save this as `run-all-tests.sh`:

```bash
#!/bin/bash
set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PASSED=0
FAILED=0

run_test() {
  local test_name=$1
  local test_cmd=$2
  
  echo -e "${YELLOW}Running: $test_name${NC}"
  
  if eval "$test_cmd"; then
    echo -e "${GREEN}✅ PASSED: $test_name${NC}\n"
    ((PASSED++))
  else
    echo -e "${RED}❌ FAILED: $test_name${NC}\n"
    ((FAILED++))
  fi
}

echo "🧪 Starting Complete Test Suite..."
echo "=================================="

# Health Checks
run_test "Gateway Health" "curl -sf http://localhost:4000/health > /dev/null"
run_test "Rooms Service Health" "curl -sf http://localhost:4001/health > /dev/null"
run_test "Services Health" "curl -sf http://localhost:4002/health > /dev/null"
run_test "Movies Health" "curl -sf http://localhost:4005/health > /dev/null"

# Database
run_test "Database Connection" "docker exec mwv2-postgres psql -U postgres -d mangwale_booking -c 'SELECT 1' > /dev/null"
run_test "Tables Exist" "docker exec mwv2-postgres psql -U postgres -d mangwale_booking -c '\dt' | grep -q room_bookings"

# Room Bookings Flow
run_test "Create Room Type" "curl -sf -X POST http://localhost:4001/vendor/rooms/room-types -H 'Content-Type: application/json' -d '{\"store_id\":1,\"name\":\"Test\",\"accommodation_type\":\"hotel\",\"occupancy_adults\":2}' | grep -q '\"id\"'"

run_test "Create Inventory" "curl -sf -X POST http://localhost:4001/vendor/rooms/inventory -H 'Content-Type: application/json' -d '{\"room_type_id\":1,\"date\":\"2026-06-01\",\"total_rooms\":10,\"sold_rooms\":0,\"status\":\"open\"}' | grep -q '\"date\"'"

run_test "Book Room" "curl -sf -X POST http://localhost:4001/rooms/book -H 'Content-Type: application/json' -d '{\"userId\":999,\"storeId\":1,\"checkIn\":\"2026-06-01\",\"checkOut\":\"2026-06-02\",\"rooms\":1,\"adults\":2,\"children\":0,\"items\":[{\"roomTypeId\":1,\"ratePlanId\":1,\"nights\":1,\"pricePerNightMinor\":500000,\"taxMinor\":20000,\"totalMinor\":520000}],\"payment\":{\"mode\":\"prepaid\",\"walletMinor\":520000,\"gatewayMinor\":0}}' | grep -q '\"bookingId\"'"

run_test "View User Bookings" "curl -sf 'http://localhost:4001/rooms/my-bookings?userId=999' | grep -q '\"bookings\"'"

run_test "View Vendor Bookings" "curl -sf 'http://localhost:4001/vendor/rooms/bookings?storeId=1' | grep -q '\"bookings\"'"

# Service Appointments Flow
run_test "Create Service" "curl -sf -X POST http://localhost:4002/vendor/services/catalog -H 'Content-Type: application/json' -d '{\"store_id\":1,\"name\":\"TestService\",\"parent_category\":\"plumber\",\"base_rate_minor\":50000,\"visit_fee_minor\":20000}' | grep -q '\"id\"'"

# Summary
echo "=================================="
echo -e "Test Results:"
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo "=================================="

if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}🎉 All tests passed!${NC}"
  exit 0
else
  echo -e "${RED}❌ Some tests failed${NC}"
  exit 1
fi
```

Make it executable and run:

```bash
chmod +x run-all-tests.sh
./run-all-tests.sh
```

---

## TEST RESULTS CHECKLIST

After running all tests, verify:

- [ ] All services respond to health checks
- [ ] Database tables exist with correct schema
- [ ] Room bookings save to database
- [ ] Service appointments save to database
- [ ] Inventory decrements on booking
- [ ] Inventory restores on cancellation
- [ ] Users can view their bookings
- [ ] Vendors can view all bookings
- [ ] Status filtering works
- [ ] Overbooking is prevented
- [ ] Invalid requests are rejected
- [ ] Refunds calculate correctly
- [ ] Additional charges work (services)
- [ ] Concurrent requests don't cause issues

---

## TROUBLESHOOTING

### Services Won't Start
```bash
# Check ports
lsof -i :4000 -i :4001 -i :4002 -i :4005

# Kill conflicting processes
kill -9 <PID>

# Check logs
pnpm --filter gateway dev
# Look for errors
```

### Database Connection Errors
```bash
# Restart Postgres
docker-compose restart postgres

# Check connection
docker exec mwv2-postgres psql -U postgres -c "SELECT version();"

# Reapply schema
docker exec mwv2-postgres psql -U postgres -d mangwale_booking -f /sql/001_base_schema.sql
```

### Bookings Not Saving
```bash
# Check entity files exist
ls apps/rooms/src/typeorm/entities.ts
ls apps/services-api/src/typeorm/entities.ts

# Check database for recent bookings
docker exec mwv2-postgres psql -U postgres -d mangwale_booking -c \
  "SELECT * FROM room_bookings ORDER BY created_at DESC LIMIT 5;"
```

### 404 Errors
```bash
# Verify route registration
grep -r "my-bookings" apps/rooms/src/
grep -r "vendor/rooms/bookings" apps/rooms/src/

# Check module imports
cat apps/rooms/src/module.ts
```

---

## NEXT STEPS

After all tests pass:

1. **Complete Movies Module** - Add booking endpoints
2. **Build Venues Module** - Cricket/badminton bookings
3. **Add Authentication** - Secure endpoints
4. **Build Frontend** - User and vendor UIs
5. **Add Notifications** - Email/SMS confirmations
6. **Production Deploy** - PM2, Nginx, SSL

---

## CONTINUOUS TESTING

Set up a cron job for daily testing:

```bash
# Edit crontab
crontab -e

# Add daily test at 2 AM
0 2 * * * /home/ubuntu/projects/additional-modules/run-all-tests.sh >> /var/log/mangwale-tests.log 2>&1
```

---

**✅ TESTING COMPLETE**

Your booking system is ready for integration!
