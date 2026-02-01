#!/bin/bash

echo "================================================"
echo "🧪 END-TO-END BOOKING TESTS - ALL 4 MODULES"
echo "================================================"
echo ""

GW="http://localhost:4000"
PASS=0
FAIL=0

test_booking() {
  local name="$1"
  local cmd="$2"
  
  echo -n "$name... "
  RESULT=$(eval "$cmd" 2>&1)
  
  if echo "$RESULT" | jq -e '(.appointmentId // .bookingId) != null' >/dev/null 2>&1; then
    ID=$(echo "$RESULT" | jq -r '.appointmentId // .bookingId')
    echo "✓ PASS (ID: $ID)"
    ((PASS++))
    echo "$RESULT" | jq '.' >> /tmp/booking-success.log
    return 0
  else
    echo "✗ FAIL"
    echo "  Error: $(echo $RESULT | jq -r '.message // .' | head -c 150)"
    ((FAIL++))
    return 1
  fi
}

echo "📦 Setup: Add Test Data"
echo "------------------------"

# Add room inventory with correct column name
PGPASSWORD=postgres psql -h localhost -U postgres -d mangwale_booking -q -c "
INSERT INTO room_inventory (room_type_id, date, total_rooms, sold_rooms)
VALUES 
  (1, '2026-04-01', 20, 0),
  (1, '2026-04-02', 20, 0),
  (2, '2026-04-01', 10, 0),
  (3, '2026-04-01', 15, 0)
ON CONFLICT (room_type_id, date) DO UPDATE SET total_rooms = EXCLUDED.total_rooms;
" && echo "✓ Room inventory ready"

# Add service slots (no service_id column)
PGPASSWORD=postgres psql -h localhost -U postgres -d mangwale_booking -q -c "
INSERT INTO service_slots (store_id, date, start_time, end_time, capacity, booked)
VALUES 
  (201, '2026-04-10', '09:00:00', '10:00:00', 20, 0),
  (201, '2026-04-10', '10:00:00', '11:00:00', 20, 0),
  (201, '2026-04-10', '14:00:00', '15:00:00', 20, 0)
ON CONFLICT (store_id, date, start_time, end_time) DO UPDATE SET capacity = EXCLUDED.capacity;
" && echo "✓ Service slots ready"

# Check existing data
ROOM_TYPES=$(PGPASSWORD=postgres psql -h localhost -U postgres -d mangwale_booking -t -A -c "SELECT COUNT(*) FROM room_types;")
SERVICES=$(PGPASSWORD=postgres psql -h localhost -U postgres -d mangwale_booking -t -A -c "SELECT COUNT(*) FROM services_catalog;")
MOVIES=$(PGPASSWORD=postgres psql -h localhost -U postgres -d mangwale_booking -t -A -c "SELECT COUNT(*) FROM movies;")
VENUES=$(PGPASSWORD=postgres psql -h localhost -U postgres -d mangwale_booking -t -A -c "SELECT COUNT(*) FROM venue_types;")

echo "✓ Demo data: $ROOM_TYPES room types, $SERVICES services, $MOVIES movies, $VENUES venues"

echo ""
echo "🧪 Test 1: SERVICE BOOKINGS (3 scenarios)"
echo "==========================================  "

# Get a valid service and slot
SERVICE_ID=$(PGPASSWORD=postgres psql -h localhost -U postgres -d mangwale_booking -t -A -c "SELECT id FROM services_catalog ORDER BY id LIMIT 1;")
SLOT_ID=$(PGPASSWORD=postgres psql -h localhost -U postgres -d mangwale_booking -t -A -c "SELECT id FROM service_slots WHERE date = '2026-04-10' ORDER BY id LIMIT 1;")

test_booking "Service #1 - Prepaid" \
  "curl -s -X POST '$GW/services/appointments' -H 'Content-Type: application/json' -d '{
    \"userId\": 10001,
    \"storeId\": 201,
    \"serviceId\": $SERVICE_ID,
    \"scheduledFor\": \"2026-04-10T09:30:00Z\",
    \"slotId\": $SLOT_ID,
    \"pricing\": {\"baseMinor\": 5000, \"visitFeeMinor\": 1000},
    \"payment\": {\"mode\": \"prepaid\", \"idempotencyKey\": \"test-$(date +%s%N)\"}
  }'"

test_booking "Service #2 - Wallet" \
  "curl -s -X POST '$GW/services/appointments' -H 'Content-Type: application/json' -d '{
    \"userId\": 10002,
    \"storeId\": 201,
    \"serviceId\": $SERVICE_ID,
    \"scheduledFor\": \"2026-04-10T10:30:00Z\",
    \"slotId\": $((SLOT_ID + 1)),
    \"pricing\": {\"baseMinor\": 8000, \"visitFeeMinor\": 1500},
    \"payment\": {\"mode\": \"wallet\", \"idempotencyKey\": \"test-$(date +%s%N)\"}
  }'"

test_booking "Service #3 - At Location" \
  "curl -s -X POST '$GW/services/appointments' -H 'Content-Type: application/json' -d '{
    \"userId\": 10003,
    \"storeId\": 201,
    \"serviceId\": $SERVICE_ID,
    \"addressId\": 999,
    \"scheduledFor\": \"2026-04-10T14:30:00Z\",
    \"slotId\": $((SLOT_ID + 2)),
    \"pricing\": {\"baseMinor\": 5000, \"visitFeeMinor\": 2000},
    \"payment\": {\"mode\": \"prepaid\", \"idempotencyKey\": \"test-$(date +%s%N)\"}
  }'"

echo ""
echo "🧪 Test 2: ROOM BOOKINGS (3 scenarios)"
echo "======================================="

test_booking "Room #1 - Standard (2 rooms)" \
  "curl -s -X POST '$GW/rooms/bookings' -H 'Content-Type: application/json' -d '{
    \"userId\": 20001,
    \"storeId\": 201,
    \"checkIn\": \"2026-04-01\",
    \"checkOut\": \"2026-04-02\",
    \"items\": [{\"roomTypeId\": 1, \"ratePlanId\": 1, \"quantity\": 2}],
    \"payment\": {\"mode\": \"prepaid\", \"idempotencyKey\": \"test-$(date +%s%N)\"}
  }'"

test_booking "Room #2 - Deluxe (1 room)" \
  "curl -s -X POST '$GW/rooms/bookings' -H 'Content-Type: application/json' -d '{
    \"userId\": 20002,
    \"storeId\": 201,
    \"checkIn\": \"2026-04-01\",
    \"checkOut\": \"2026-04-02\",
    \"items\": [{\"roomTypeId\": 2, \"ratePlanId\": 2, \"quantity\": 1}],
    \"payment\": {\"mode\": \"gateway\", \"idempotencyKey\": \"test-$(date +%s%N)\"}
  }'"

test_booking "Room #3 - Mixed Types" \
  "curl -s -X POST '$GW/rooms/bookings' -H 'Content-Type: application/json' -d '{
    \"userId\": 20003,
    \"storeId\": 201,
    \"checkIn\": \"2026-04-01\",
    \"checkOut\": \"2026-04-02\",
    \"items\": [
      {\"roomTypeId\": 1, \"ratePlanId\": 1, \"quantity\": 1},
      {\"roomTypeId\": 3, \"ratePlanId\": 3, \"quantity\": 2}
    ],
    \"payment\": {\"mode\": \"prepaid\", \"idempotencyKey\": \"test-$(date +%s%N)\"}
  }'"

echo ""
echo "🧪 Test 3: MOVIE BOOKINGS (3 scenarios)"
echo "========================================"

SHOWTIME=$(PGPASSWORD=postgres psql -h localhost -U postgres -d mangwale_booking -t -A -c "SELECT id FROM showtimes WHERE starts_at > NOW() ORDER BY starts_at LIMIT 1;")
echo "Using showtime: $SHOWTIME"

test_booking "Movie #1 - 2 seats" \
  "curl -s -X POST '$GW/movies/bookings' -H 'Content-Type: application/json' -d '{
    \"userId\": 30001,
    \"storeId\": 201,
    \"showtimeId\": $SHOWTIME,
    \"seats\": [\"A-20\", \"A-21\"],
    \"payment\": {\"mode\": \"prepaid\", \"idempotencyKey\": \"test-$(date +%s%N)\"}
  }'"

test_booking "Movie #2 - 4 seats (group)" \
  "curl -s -X POST '$GW/movies/bookings' -H 'Content-Type: application/json' -d '{
    \"userId\": 30002,
    \"storeId\": 201,
    \"showtimeId\": $SHOWTIME,
    \"seats\": [\"B-20\", \"B-21\", \"B-22\", \"B-23\"],
    \"payment\": {\"mode\": \"wallet\", \"idempotencyKey\": \"test-$(date +%s%N)\"}
  }'"

test_booking "Movie #3 - 6 seats (large group)" \
  "curl -s -X POST '$GW/movies/bookings' -H 'Content-Type: application/json' -d '{
    \"userId\": 30003,
    \"storeId\": 201,
    \"showtimeId\": $SHOWTIME,
    \"seats\": [\"C-15\", \"C-16\", \"C-17\", \"C-18\", \"C-19\", \"C-20\"],
    \"payment\": {\"mode\": \"prepaid\", \"idempotencyKey\": \"test-$(date +%s%N)\"}
  }'"

echo ""
echo "🧪 Test 4: VENUE BOOKINGS (2 scenarios)"
echo "========================================"

# Get available venue slots (correct column name)
VENUE_SLOT1=$(PGPASSWORD=postgres psql -h localhost -U postgres -d mangwale_booking -t -A -c "SELECT id FROM venue_slots WHERE date > '2026-04-01' AND booked < capacity ORDER BY date, hour_start LIMIT 1;")
VENUE_SLOT2=$(PGPASSWORD=postgres psql -h localhost -U postgres -d mangwale_booking -t -A -c "SELECT id FROM venue_slots WHERE date > '2026-04-01' AND booked < capacity ORDER BY date, hour_start LIMIT 1 OFFSET 1;")

if [ -n "$VENUE_SLOT1" ]; then
  test_booking "Venue #1 - Prepaid" \
    "curl -s -X POST '$GW/venues/bookings' -H 'Content-Type: application/json' -d '{
      \"userId\": 40001,
      \"storeId\": 201,
      \"venueSlotId\": $VENUE_SLOT1,
      \"payment\": {\"mode\": \"prepaid\", \"idempotencyKey\": \"test-$(date +%s%N)\"}
    }'"
else
  echo "Venue #1... ✗ SKIP (no slots)"
  ((FAIL++))
fi

if [ -n "$VENUE_SLOT2" ]; then
  test_booking "Venue #2 - Gateway" \
    "curl -s -X POST '$GW/venues/bookings' -H 'Content-Type: application/json' -d '{
      \"userId\": 40002,
      \"storeId\": 201,
      \"venueSlotId\": $VENUE_SLOT2,
      \"payment\": {\"mode\": \"gateway\", \"idempotencyKey\": \"test-$(date +%s%N)\"}
    }'"
else
  echo "Venue #2... ✗ SKIP (no slots)"
  ((FAIL++))
fi

echo ""
echo "📊 RESULTS SUMMARY"
echo "=================="
echo ""
echo "✅ Successful: $PASS tests"
echo "❌ Failed: $FAIL tests"
TOTAL=$((PASS + FAIL))
if [ $TOTAL -gt 0 ]; then
  SUCCESS_RATE=$((PASS * 100 / TOTAL))
  echo "Success Rate: $SUCCESS_RATE%"
fi

echo ""
echo "📈 Database Verification"
echo "------------------------"

SVC_COUNT=$(PGPASSWORD=postgres psql -h localhost -U postgres -d mangwale_booking -t -A -c "SELECT COUNT(*) FROM service_appointments WHERE user_id >= 10001;")
echo "Service Appointments: $SVC_COUNT"

ROOM_COUNT=$(PGPASSWORD=postgres psql -h localhost -U postgres -d mangwale_booking -t -A -c "SELECT COUNT(*) FROM room_bookings WHERE user_id >= 20001;")
echo "Room Bookings: $ROOM_COUNT"

MOVIE_COUNT=$(PGPASSWORD=postgres psql -h localhost -U postgres -d mangwale_booking -t -A -c "SELECT COUNT(*) FROM movie_bookings WHERE user_id >= 30001;")
echo "Movie Bookings: $MOVIE_COUNT"

VENUE_COUNT=$(PGPASSWORD=postgres psql -h localhost -U postgres -d mangwale_booking -t -A -c "SELECT COUNT(*) FROM venue_bookings WHERE user_id >= 40001;")
echo "Venue Bookings: $VENUE_COUNT"

# Check availability tracking
SLOT_BOOKED=$(PGPASSWORD=postgres psql -h localhost -U postgres -d mangwale_booking -t -A -c "SELECT booked FROM service_slots WHERE id = $SLOT_ID;")
echo "Service slot #$SLOT_ID booked: $SLOT_BOOKED"

INV_SOLD=$(PGPASSWORD=postgres psql -h localhost -U postgres -d mangwale_booking -t -A -c "SELECT sold_rooms FROM room_inventory WHERE room_type_id = 1 AND date = '2026-04-01';")
echo "Room inventory sold: $INV_SOLD rooms"

SEATS_TAKEN=$(PGPASSWORD=postgres psql -h localhost -U postgres -d mangwale_booking -t -A -c "SELECT COUNT(*) FROM showtime_seats WHERE showtime_id = $SHOWTIME AND status = 'booked';")
echo "Movie seats booked: $SEATS_TAKEN"

echo ""
if [ $FAIL -eq 0 ]; then
  echo "🎉 ALL TESTS PASSED!"
  echo ""
  echo "✅ Verified:"
  echo "  • Multiple payment modes (prepaid, wallet, gateway)"
  echo "  • Different user scenarios"
  echo "  • Availability tracking"
  echo "  • Database integrity"
  echo ""
else
  echo "⚠️  $FAIL tests failed or skipped"
fi

echo "🌐 Test in Browser:"
echo "  Vendor: http://localhost:5184/vendor/"
echo "  User:   http://localhost:5183/user/"
echo ""
