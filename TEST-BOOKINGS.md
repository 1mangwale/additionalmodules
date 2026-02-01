# Testing Booking Persistence

## Quick Test - All Endpoints Available

### 1. Check Services Are Running
```bash
curl http://localhost:4000/health
# Expected: {"ok":true,"ts":"..."}
```

### 2. View New Endpoints

#### Rooms Service Endpoints (User)
```bash
# List user's bookings
curl "http://localhost:4001/rooms/my-bookings?userId=1"

# Get specific booking details
curl "http://localhost:4001/rooms/bookings/BOOKING_ID_HERE"
```

#### Rooms Service Endpoints (Vendor)
```bash
# List all bookings for a property
curl "http://localhost:4001/vendor/rooms/bookings?storeId=1"

# Filter by status
curl "http://localhost:4001/vendor/rooms/bookings?storeId=1&status=confirmed"
```

#### Services API Endpoints (User)
```bash
# List user's appointments
curl "http://localhost:4002/services/my-appointments?userId=1"

# Get specific appointment details
curl "http://localhost:4002/services/appointments/APPOINTMENT_ID_HERE"
```

#### Services API Endpoints (Vendor)
```bash
# List all appointments for a vendor
curl "http://localhost:4002/vendor/services/appointments?storeId=1"

# Filter by status
curl "http://localhost:4002/vendor/services/appointments?storeId=1&status=confirmed"
```

### 3. Complete Flow Test

#### Step 1: Check Available Room Types
```bash
curl "http://localhost:4001/vendor/rooms/room-types"
```

#### Step 2: Create Test Room Type (if needed)
```bash
curl -X POST http://localhost:4001/vendor/rooms/room-types \
  -H "Content-Type: application/json" \
  -d '{
    "store_id": 1,
    "name": "Deluxe Room",
    "accommodation_type": "hotel",
    "description": "Spacious room with city view",
    "max_occupancy": 3,
    "base_price": "2500.00"
  }'
```

#### Step 3: Create Inventory
```bash
curl -X POST http://localhost:4001/vendor/rooms/inventory \
  -H "Content-Type: application/json" \
  -d '{
    "room_type_id": 1,
    "date": "2026-02-15",
    "total_rooms": 10,
    "sold_rooms": 0,
    "status": "open"
  }'

curl -X POST http://localhost:4001/vendor/rooms/inventory \
  -H "Content-Type: application/json" \
  -d '{
    "room_type_id": 1,
    "date": "2026-02-16",
    "total_rooms": 10,
    "sold_rooms": 0,
    "status": "open"
  }'
```

#### Step 4: Book a Room (ACTUAL DATABASE WRITE)
```bash
curl -X POST http://localhost:4001/rooms/book \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 1,
    "storeId": 1,
    "checkIn": "2026-02-15",
    "checkOut": "2026-02-17",
    "rooms": 1,
    "adults": 2,
    "children": 0,
    "items": [{
      "roomTypeId": 1,
      "ratePlanId": 1,
      "nights": 2,
      "pricePerNightMinor": 250000,
      "taxMinor": 10000,
      "totalMinor": 510000
    }],
    "payment": {
      "mode": "prepaid",
      "walletMinor": 510000,
      "gatewayMinor": 0
    }
  }'
# Expected: {"bookingId":"UUID-HERE","status":"confirmed"}
```

#### Step 5: Verify Booking Was Saved
```bash
# Check user's bookings
curl "http://localhost:4001/rooms/my-bookings?userId=1"
# Should see the booking with all details!

# Check vendor's bookings
curl "http://localhost:4001/vendor/rooms/bookings?storeId=1"
# Vendor can see it too!
```

#### Step 6: Verify Database (Direct SQL)
```bash
docker exec mwv2-postgres psql -U postgres -d mangwale_booking -c \
  "SELECT id, user_id, store_id, status, check_in, check_out, rooms, created_at FROM room_bookings ORDER BY created_at DESC LIMIT 3;"

docker exec mwv2-postgres psql -U postgres -d mangwale_booking -c \
  "SELECT id, booking_id, room_type_id, nights, total FROM room_booking_items ORDER BY id DESC LIMIT 3;"

docker exec mwv2-postgres psql -U postgres -d mangwale_booking -c \
  "SELECT room_type_id, date, total_rooms, sold_rooms, status FROM room_inventory WHERE date >= '2026-02-15' AND date <= '2026-02-16' ORDER BY date;"
```

#### Step 7: Test Cancellation
```bash
# Use the bookingId from step 4
curl -X POST http://localhost:4001/rooms/cancel \
  -H "Content-Type: application/json" \
  -d '{
    "bookingId": "BOOKING_ID_FROM_STEP_4",
    "askRefundDestination": true
  }'
# Expected: Refund calculation based on time until check-in
```

#### Step 8: Verify Cancellation
```bash
# Check booking status changed
curl "http://localhost:4001/rooms/my-bookings?userId=1"
# Status should be 'cancelled'

# Check inventory was restored
docker exec mwv2-postgres psql -U postgres -d mangwale_booking -c \
  "SELECT room_type_id, date, sold_rooms FROM room_inventory WHERE date >= '2026-02-15' AND date <= '2026-02-16' ORDER BY date;"
# sold_rooms should be back to 0
```

## Service Appointments Test

#### Step 1: Create Test Service
```bash
curl -X POST http://localhost:4002/vendor/services/catalog \
  -H "Content-Type: application/json" \
  -d '{
    "store_id": 1,
    "parent_category": "home_services",
    "name": "Plumbing Service",
    "description": "Professional plumbing repairs",
    "base_price": "500.00",
    "visit_fee": "100.00"
  }'
```

#### Step 2: Create Time Slot
```bash
curl -X POST http://localhost:4002/vendor/services/slots \
  -H "Content-Type: application/json" \
  -d '{
    "store_id": 1,
    "date": "2026-02-15",
    "start_time": "10:00:00",
    "end_time": "12:00:00",
    "capacity": 5,
    "booked_count": 0,
    "status": "open"
  }'
```

#### Step 3: Book Appointment
```bash
curl -X POST http://localhost:4002/services/book \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 1,
    "storeId": 1,
    "serviceId": 1,
    "slotId": 1,
    "scheduledFor": "2026-02-15T10:00:00Z",
    "address": "123 Main Street, Apt 4B",
    "pricing": {
      "baseMinor": 50000,
      "visitFeeMinor": 10000,
      "taxMinor": 3000
    },
    "payment": {
      "mode": "prepaid",
      "walletMinor": 63000,
      "gatewayMinor": 0
    }
  }'
# Expected: {"jobId":"UUID-HERE","status":"confirmed"}
```

#### Step 4: View Appointments
```bash
# User view
curl "http://localhost:4002/services/my-appointments?userId=1"

# Vendor view
curl "http://localhost:4002/vendor/services/appointments?storeId=1"
```

#### Step 5: Complete Service with Additional Charges
```bash
curl -X POST http://localhost:4002/services/complete \
  -H "Content-Type: application/json" \
  -d '{
    "jobId": "JOB_ID_FROM_STEP_3",
    "additionsMinor": 15000
  }'
# Expected: Final amount calculated, status changed to 'completed'
```

#### Step 6: Verify in Database
```bash
docker exec mwv2-postgres psql -U postgres -d mangwale_booking -c \
  "SELECT id, user_id, service_id, status, scheduled_for, payment_mode, base_amount, final_amount FROM service_appointments ORDER BY created_at DESC LIMIT 3;"
```

## Summary

✅ All endpoints implemented:
- GET /rooms/my-bookings (user bookings)
- GET /rooms/bookings/:id (booking details)
- GET /vendor/rooms/bookings (vendor view)
- GET /services/my-appointments (user appointments)
- GET /services/appointments/:id (appointment details)
- GET /vendor/services/appointments (vendor view)

✅ Core features working:
- Bookings persist to database
- Inventory management (sold_rooms incremented/decremented)
- Availability checking before booking
- Cancellation with refund calculation
- Service completion with final settlement
- Status lifecycle tracking

✅ Database tables now used:
- room_bookings (was empty, now has records)
- room_booking_items (line items with pricing)
- service_appointments (was empty, now has records)
- room_inventory (sold_rooms actively managed)
- service_slots (booked_count actively managed)

## Routes Summary

### Via Gateway (Port 4000)
- All user endpoints: `/api/rooms/*`, `/api/services/*`
- All vendor endpoints: `/rooms/vendor/*`, `/services/vendor/*`

### Direct Service Access
- Rooms: Port 4001
- Services: Port 4002
- Pricing: Port 4003
- Finance: Port 4004
- Movies: Port 4005

Gateway automatically proxies and rewrites paths for clean API structure.
