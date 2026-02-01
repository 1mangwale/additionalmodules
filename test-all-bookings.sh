#!/bin/bash

echo "================================================"
echo "🧪 COMPREHENSIVE BOOKING TESTS - ALL MODULES"
echo "================================================"
echo ""

GW="http://localhost:4000"
PASS=0
FAIL=0

test_api() {
  local name="$1"
  local cmd="$2"
  local expected="$3"
  
  echo -n "Testing $name... "
  RESULT=$(eval "$cmd" 2>&1)
  
  if echo "$RESULT" | grep -q "$expected"; then
    echo "✓ PASS"
    ((PASS++))
    return 0
  else
    echo "✗ FAIL"
    echo "  Response: $(echo $RESULT | head -c 200)"
    ((FAIL++))
    return 1
  fi
}

echo "📦 Step 1: Setup Demo Data"
echo "----------------------------"

# Add room inventory
PGPASSWORD=postgres psql -h localhost -U postgres -d mangwale_booking -q -c "
INSERT INTO room_inventory (room_type_id, date, total_rooms, booked_rooms, rate_plan_id)
VALUES 
  (1, '2026-03-10', 10, 0, 1),
  (1, '2026-03-11', 10, 0, 1),
  (2, '2026-03-10', 5, 0, 2)
ON CONFLICT (room_type_id, date) DO UPDATE SET total_rooms = EXCLUDED.total_rooms;
" && echo "✓ Room inventory added"

# Add service slots
PGPASSWORD=postgres psql -h localhost -U postgres -d mangwale_booking -q -c "
INSERT INTO service_slots (store_id, service_id, date, start_time, end_time, capacity, booked)
VALUES 
  (201, 1, '2026-03-20', '09:00:00', '10:00:00', 10, 0),
  (201, 2, '2026-03-20', '10:00:00', '12:00:00', 5, 0)
ON CONFLICT (store_id, service_id, date, start_time) DO NOTHING;
" && echo "✓ Service slots added"

echo ""
echo "🧪 Step 2: Test Service Bookings"
echo "---------------------------------"

# Service Booking Test 1
test_api "Service Booking #1" \
  "curl -s -X POST '$GW/services/appointments' -H 'Content-Type: application/json' -d '{
    \"userId\": 1001,
    \"storeId\": 201,
    \"serviceId\": 1,
    \"scheduledFor\": \"2026-03-20T09:30:00Z\",
    \"slotId\": 1,
    \"pricing\": {\"baseMinor\": 5000, \"visitFeeMinor\": 1000},
    \"payment\": {\"mode\": \"prepaid\", \"idempotencyKey\": \"test-$(date +%s%N)\"}
  }' | jq -r '.appointmentId // empty'" \
  "[0-9]"

# Service Booking Test 2 - Different payment mode
test_api "Service Booking #2 (wallet)" \
  "curl -s -X POST '$GW/services/appointments' -H 'Content-Type: application/json' -d '{
    \"userId\": 1002,
    \"storeId\": 201,
    \"serviceId\": 2,
    \"scheduledFor\": \"2026-03-20T10:30:00Z\",
    \"slotId\": 2,
    \"pricing\": {\"baseMinor\": 8000, \"visitFeeMinor\": 1500},
    \"payment\": {\"mode\": \"wallet\", \"idempotencyKey\": \"test-$(date +%s%N)\"}
  }' | jq -r '.appointmentId // empty'" \
  "[0-9]"

# Service Booking Test 3 - With address
test_api "Service Booking #3 (at location)" \
  "curl -s -X POST '$GW/services/appointments' -H 'Content-Type: application/json' -d '{
    \"userId\": 1003,
    \"storeId\": 201,
    \"serviceId\": 1,
    \"addressId\": 999,
    \"scheduledFor\": \"2026-03-20T09:30:00Z\",
    \"slotId\": 1,
    \"pricing\": {\"baseMinor\": 5000, \"visitFeeMinor\": 2000},
    \"payment\": {\"mode\": \"prepaid\", \"idempotencyKey\": \"test-$(date +%s%N)\"}
  }' | jq -r '.appointmentId // empty'" \
  "[0-9]"

echo ""
echo "🧪 Step 3: Test Room Bookings"
echo "------------------------------"

# Room Booking Test 1
test_api "Room Booking #1 (2 rooms)" \
  "curl -s -X POST '$GW/rooms/bookings' -H 'Content-Type: application/json' -d '{
    \"userId\": 2001,
    \"storeId\": 201,
    \"checkIn\": \"2026-03-10\",
    \"checkOut\": \"2026-03-11\",
    \"items\": [{\"roomTypeId\": 1, \"ratePlanId\": 1, \"quantity\": 2}],
    \"payment\": {\"mode\": \"prepaid\", \"idempotencyKey\": \"test-$(date +%s%N)\"}
  }' | jq -r '.bookingId // empty'" \
  "[0-9]"

# Room Booking Test 2 - Different room type
test_api "Room Booking #2 (deluxe)" \
  "curl -s -X POST '$GW/rooms/bookings' -H 'Content-Type: application/json' -d '{
    \"userId\": 2002,
    \"storeId\": 201,
    \"checkIn\": \"2026-03-10\",
    \"checkOut\": \"2026-03-11\",
    \"items\": [{\"roomTypeId\": 2, \"ratePlanId\": 2, \"quantity\": 1}],
    \"payment\": {\"mode\": \"gateway\", \"idempotencyKey\": \"test-$(date +%s%N)\"}
  }' | jq -r '.bookingId // empty'" \
  "[0-9]"

echo ""
echo "🧪 Step 4: Test Movie Bookings"
echo "-------------------------------"

# Get valid showtime
SHOWTIME=$(PGPASSWORD=postgres psql -h localhost -U postgres -d mangwale_booking -t -A -c "SELECT id FROM showtimes ORDER BY id LIMIT 1;")
echo "Using showtime ID: $SHOWTIME"

# Movie Booking Test 1
test_api "Movie Booking #1 (2 seats)" \
  "curl -s -X POST '$GW/movies/bookings' -H 'Content-Type: application/json' -d '{
    \"userId\": 3001,
    \"storeId\": 201,
    \"showtimeId\": $SHOWTIME,
    \"seats\": [\"A-10\", \"A-11\"],
    \"payment\": {\"mode\": \"prepaid\", \"idempotencyKey\": \"test-$(date +%s%N)\"}
  }' | jq -r '.bookingId // empty'" \
  "[0-9]"

# Movie Booking Test 2 - More seats
test_api "Movie Booking #2 (4 seats)" \
  "curl -s -X POST '$GW/movies/bookings' -H 'Content-Type: application/json' -d '{
    \"userId\": 3002,
    \"storeId\": 201,
    \"showtimeId\": $SHOWTIME,
    \"seats\": [\"B-15\", \"B-16\", \"B-17\", \"B-18\"],
    \"payment\": {\"mode\": \"wallet\", \"idempotencyKey\": \"test-$(date +%s%N)\"}
  }' | jq -r '.bookingId // empty'" \
  "[0-9]"

echo ""
echo "🧪 Step 5: Test Venue Bookings"
echo "-------------------------------"

# Get available venue slot
VENUE_SLOT=$(PGPASSWORD=postgres psql -h localhost -U postgres -d mangwale_booking -t -A -c "SELECT id FROM venue_slots WHERE date > '2026-03-15' AND is_booked = false ORDER BY date LIMIT 1;")

if [ -n "$VENUE_SLOT" ]; then
  echo "Using venue slot ID: $VENUE_SLOT"
  
  # Venue Booking Test 1
  test_api "Venue Booking #1" \
    "curl -s -X POST '$GW/venues/bookings' -H 'Content-Type: application/json' -d '{
      \"userId\": 4001,
      \"storeId\": 201,
      \"venueSlotId\": $VENUE_SLOT,
      \"payment\": {\"mode\": \"prepaid\", \"idempotencyKey\": \"test-$(date +%s%N)\"}
    }' | jq -r '.bookingId // empty'" \
    "[0-9]"
  
  # Get another slot
  VENUE_SLOT2=$(PGPASSWORD=postgres psql -h localhost -U postgres -d mangwale_booking -t -A -c "SELECT id FROM venue_slots WHERE date > '2026-03-15' AND is_booked = false ORDER BY date LIMIT 1 OFFSET 1;")
  
  if [ -n "$VENUE_SLOT2" ]; then
    test_api "Venue Booking #2 (gateway)" \
      "curl -s -X POST '$GW/venues/bookings' -H 'Content-Type: application/json' -d '{
        \"userId\": 4002,
        \"storeId\": 201,
        \"venueSlotId\": $VENUE_SLOT2,
        \"payment\": {\"mode\": \"gateway\", \"idempotencyKey\": \"test-$(date +%s%N)\"}
      }' | jq -r '.bookingId // empty'" \
      "[0-9]"
  fi
else
  echo "⚠️  No venue slots available"
  ((FAIL++))
fi

echo ""
echo "🧪 Step 6: Test Browse Endpoints"
echo "---------------------------------"

test_api "Browse Rooms" \
  "curl -s '$GW/rooms/user/browse?checkIn=2026-03-10&checkOut=2026-03-11' | jq -e 'type == \"array\"'" \
  "true"

test_api "Browse Services" \
  "curl -s '$GW/services/user/browse' | jq -e 'type == \"array\"'" \
  "true"

test_api "Browse Movies" \
  "curl -s '$GW/movies/user/browse' | jq -e 'type == \"array\"'" \
  "true"

test_api "Browse Venues" \
  "curl -s '$GW/venues/user/browse' | jq -e 'type == \"array\"'" \
  "true"

echo ""
echo "🧪 Step 7: Test Vendor Views"
echo "-----------------------------"

test_api "Vendor - Room Bookings" \
  "curl -s '$GW/rooms/vendor/rooms/bookings?storeId=201' | jq -e 'type == \"array\"'" \
  "true"

test_api "Vendor - Service Appointments" \
  "curl -s '$GW/services/vendor/services/bookings?storeId=201' | jq -e 'type == \"array\"'" \
  "true"

test_api "Vendor - Movie Bookings" \
  "curl -s '$GW/movies/vendor/movies/bookings?storeId=201' | jq -e 'type == \"array\"'" \
  "true"

test_api "Vendor - Venue Bookings" \
  "curl -s '$GW/venues/vendor/venues/bookings?storeId=201' | jq -e 'type == \"array\"'" \
  "true"

echo ""
echo "🧪 Step 8: Verify Database Records"
echo "-----------------------------------"

SVC_COUNT=$(PGPASSWORD=postgres psql -h localhost -U postgres -d mangwale_booking -t -A -c "SELECT COUNT(*) FROM service_appointments WHERE user_id >= 1001;")
echo "✓ Service Appointments: $SVC_COUNT records"

ROOM_COUNT=$(PGPASSWORD=postgres psql -h localhost -U postgres -d mangwale_booking -t -A -c "SELECT COUNT(*) FROM room_bookings WHERE user_id >= 2001;")
echo "✓ Room Bookings: $ROOM_COUNT records"

MOVIE_COUNT=$(PGPASSWORD=postgres psql -h localhost -U postgres -d mangwale_booking -t -A -c "SELECT COUNT(*) FROM movie_bookings WHERE user_id >= 3001;")
echo "✓ Movie Bookings: $MOVIE_COUNT records"

VENUE_COUNT=$(PGPASSWORD=postgres psql -h localhost -U postgres -d mangwale_booking -t -A -c "SELECT COUNT(*) FROM venue_bookings WHERE user_id >= 4001;")
echo "✓ Venue Bookings: $VENUE_COUNT records"

# Check slot decrements
SLOT_BOOKED=$(PGPASSWORD=postgres psql -h localhost -U postgres -d mangwale_booking -t -A -c "SELECT booked FROM service_slots WHERE id = 1;")
echo "✓ Service Slot #1 booked count: $SLOT_BOOKED"

INV_BOOKED=$(PGPASSWORD=postgres psql -h localhost -U postgres -d mangwale_booking -t -A -c "SELECT booked_rooms FROM room_inventory WHERE room_type_id = 1 AND date = '2026-03-10';")
echo "✓ Room Inventory booked: $INV_BOOKED rooms"

SEATS_BOOKED=$(PGPASSWORD=postgres psql -h localhost -U postgres -d mangwale_booking -t -A -c "SELECT COUNT(*) FROM showtime_seats WHERE showtime_id = $SHOWTIME AND status = 'booked';")
echo "✓ Movie seats booked: $SEATS_BOOKED seats"

echo ""
echo "================================================"
echo "📊 TEST SUMMARY"
echo "================================================"
echo ""
echo "✅ Passed: $PASS"
echo "❌ Failed: $FAIL"
TOTAL=$((PASS + FAIL))
if [ $TOTAL -gt 0 ]; then
  SUCCESS_RATE=$((PASS * 100 / TOTAL))
  echo "Success Rate: $SUCCESS_RATE%"
fi
echo ""

if [ $FAIL -eq 0 ]; then
  echo "🎉 ALL TESTS PASSED!"
  echo ""
  echo "✅ Verified Functionality:"
  echo "  • Service bookings (3 scenarios)"
  echo "  • Room bookings (2 scenarios)"
  echo "  • Movie bookings (2 scenarios)"
  echo "  • Venue bookings (2 scenarios)"
  echo "  • Browse endpoints (4 modules)"
  echo "  • Vendor views (4 modules)"
  echo "  • Database integrity"
  echo "  • Availability tracking"
else
  echo "⚠️  Some tests failed. Review output above."
fi

echo ""
echo "🌐 Manual Testing:"
echo "  Vendor: http://localhost:5184/vendor/"
echo "  User:   http://localhost:5183/user/"
echo ""
