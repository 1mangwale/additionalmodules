# Complete API Demo - How Users & Vendors Interact

## ✅ ALL APIs ARE BUILT AND WORKING!

Here's exactly how users and vendors interact with the system:

---

## 1. VENDOR: How to List Bookings 👨‍💼

### View All Bookings for Your Property
```bash
# Vendor wants to see all bookings
curl "http://localhost:4001/vendor/rooms/bookings?storeId=1"

# Vendor wants to see only confirmed bookings
curl "http://localhost:4001/vendor/rooms/bookings?storeId=1&status=confirmed"

# Vendor wants to see pending bookings
curl "http://localhost:4001/vendor/rooms/bookings?storeId=1&status=pending"

# Vendor wants to see cancelled bookings
curl "http://localhost:4001/vendor/rooms/bookings?storeId=1&status=cancelled"
```

**Response Example:**
```json
{
  "bookings": [
    {
      "id": "uuid-here",
      "user_id": 1,
      "store_id": 1,
      "check_in": "2026-02-15",
      "check_out": "2026-02-17",
      "rooms": 1,
      "adults": 2,
      "children": 0,
      "status": "confirmed",
      "created_at": "2026-01-30T07:30:00Z",
      "items": [
        {
          "id": 1,
          "room_type_id": 1,
          "nights": 2,
          "price_per_night": "2500.00",
          "tax_amount": "100.00",
          "total": "5100.00",
          "room_type": {
            "id": 1,
            "name": "Deluxe Suite",
            "accommodation_type": "hotel",
            "description": "Luxury room"
          }
        }
      ]
    }
  ],
  "total": 1
}
```

### View All Service Appointments (For Service Vendors)
```bash
# Plumber/Gardener vendor wants to see all appointments
curl "http://localhost:4002/vendor/services/appointments?storeId=1"

# Filter by confirmed appointments
curl "http://localhost:4002/vendor/services/appointments?storeId=1&status=confirmed"

# Filter by completed appointments
curl "http://localhost:4002/vendor/services/appointments?storeId=1&status=completed"
```

---

## 2. USER: How to See Your Bookings 👤

### View Your Booking History
```bash
# User wants to see all their room bookings
curl "http://localhost:4001/rooms/my-bookings?userId=1"

# Via Gateway (recommended for production)
curl "http://localhost:4000/api/rooms/my-bookings?userId=1"
```

**Response Example:**
```json
{
  "bookings": [
    {
      "id": "uuid-123",
      "check_in": "2026-02-15",
      "check_out": "2026-02-17",
      "rooms": 1,
      "adults": 2,
      "status": "confirmed",
      "items": [...]
    },
    {
      "id": "uuid-456",
      "check_in": "2026-03-20",
      "check_out": "2026-03-22",
      "rooms": 2,
      "adults": 4,
      "status": "pending",
      "items": [...]
    }
  ],
  "total": 2
}
```

### View Your Appointment History (Services)
```bash
# User wants to see all their service appointments (plumber, gardener, etc)
curl "http://localhost:4002/services/my-appointments?userId=1"

# Via Gateway
curl "http://localhost:4000/api/services/my-appointments?userId=1"
```

### Get Detailed Booking Information
```bash
# User clicks on a booking to see full details
curl "http://localhost:4001/rooms/bookings/UUID-FROM-ABOVE"

# User clicks on an appointment to see full details
curl "http://localhost:4002/services/appointments/UUID-FROM-ABOVE"
```

---

## 3. Complete Live Demo

Let me show you the EXACT commands to test right now:

### Step 1: Create a Room Type (Vendor Action)
```bash
curl -X POST http://localhost:4001/vendor/rooms/room-types \
  -H "Content-Type: application/json" \
  -d '{
    "store_id": 1,
    "name": "Deluxe Suite",
    "accommodation_type": "hotel",
    "description": "Luxury room with ocean view",
    "max_occupancy": 3,
    "base_price": "3500.00"
  }'
```

### Step 2: Create Inventory for Feb 15-16
```bash
curl -X POST http://localhost:4001/vendor/rooms/inventory \
  -H "Content-Type: application/json" \
  -d '{"room_type_id": 1, "date": "2026-02-15", "total_rooms": 10, "sold_rooms": 0, "status": "open"}'

curl -X POST http://localhost:4001/vendor/rooms/inventory \
  -H "Content-Type: application/json" \
  -d '{"room_type_id": 1, "date": "2026-02-16", "total_rooms": 10, "sold_rooms": 0, "status": "open"}'
```

### Step 3: User Makes a Booking
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
      "pricePerNightMinor": 350000,
      "taxMinor": 14000,
      "totalMinor": 714000
    }],
    "payment": {
      "mode": "prepaid",
      "walletMinor": 714000,
      "gatewayMinor": 0
    }
  }'
```

**Response:**
```json
{
  "bookingId": "some-uuid-here",
  "status": "confirmed"
}
```

### Step 4: USER Checks Their Bookings
```bash
curl "http://localhost:4001/rooms/my-bookings?userId=1"
```

**They will see:**
- ✅ Their booking with all details
- ✅ Check-in and check-out dates
- ✅ Room information
- ✅ Pricing breakdown
- ✅ Booking status

### Step 5: VENDOR Checks Their Bookings
```bash
curl "http://localhost:4001/vendor/rooms/bookings?storeId=1"
```

**They will see:**
- ✅ All bookings for their property
- ✅ Guest information (user_id)
- ✅ Dates and room types
- ✅ Revenue information
- ✅ Booking statuses

---

## 4. All Available Endpoints Summary

### User Endpoints (What Users Can Do)

#### Rooms (Accommodation)
- ✅ `GET /rooms/search` - Browse available rooms
- ✅ `GET /rooms/:id` - View room details
- ✅ `POST /rooms/price` - Get pricing quote
- ✅ `POST /rooms/book` - **Make a booking (PERSISTED TO DB)**
- ✅ `GET /rooms/my-bookings?userId=X` - **View booking history**
- ✅ `GET /rooms/bookings/:id` - **View specific booking details**
- ✅ `POST /rooms/cancel` - Cancel booking with refund

#### Services (Plumber, Gardener, etc)
- ✅ `GET /services/catalog` - Browse services
- ✅ `GET /services/slots` - View available time slots
- ✅ `GET /services/:id` - View service details
- ✅ `POST /services/book` - **Book appointment (PERSISTED TO DB)**
- ✅ `GET /services/my-appointments?userId=X` - **View appointment history**
- ✅ `GET /services/appointments/:id` - **View appointment details**
- ✅ `POST /services/cancel` - Cancel appointment

### Vendor Endpoints (What Vendors Can Do)

#### Room Vendors (Hotels, Hostels, Villas)
- ✅ `GET /vendor/rooms/room-types` - List your room types
- ✅ `POST /vendor/rooms/room-types` - Create new room type
- ✅ `GET /vendor/rooms/inventory` - View inventory
- ✅ `POST /vendor/rooms/inventory` - Set room availability
- ✅ `GET /vendor/rooms/bookings?storeId=X` - **View all bookings for your property**
- ✅ `GET /vendor/rooms/bookings?storeId=X&status=confirmed` - **Filter by status**

#### Service Vendors (Plumbers, Gardeners)
- ✅ `GET /vendor/services/catalog` - List your services
- ✅ `POST /vendor/services/catalog` - Add new service
- ✅ `GET /vendor/services/slots` - View your time slots
- ✅ `POST /vendor/services/slots` - Create time slots
- ✅ `DELETE /vendor/services/slots/:id` - Remove slot
- ✅ `GET /vendor/services/appointments?storeId=X` - **View all appointments**
- ✅ `GET /vendor/services/appointments?storeId=X&status=confirmed` - **Filter by status**

---

## 5. Database Verification

### Check What's Actually Saved
```bash
# See all bookings in database
docker exec mwv2-postgres psql -U postgres -d mangwale_booking -c \
  "SELECT id, user_id, store_id, status, check_in, check_out, created_at FROM room_bookings ORDER BY created_at DESC LIMIT 10;"

# See booking line items
docker exec mwv2-postgres psql -U postgres -d mangwale_booking -c \
  "SELECT id, booking_id, room_type_id, nights, total FROM room_booking_items ORDER BY id DESC LIMIT 10;"

# Check inventory management
docker exec mwv2-postgres psql -U postgres -d mangwale_booking -c \
  "SELECT room_type_id, date, total_rooms, sold_rooms FROM room_inventory WHERE date >= '2026-02-15' ORDER BY date;"

# See service appointments
docker exec mwv2-postgres psql -U postgres -d mangwale_booking -c \
  "SELECT id, user_id, service_id, status, scheduled_for, payment_mode FROM service_appointments ORDER BY created_at DESC LIMIT 10;"
```

---

## 6. Via Gateway (Production URLs)

In production, all calls go through the gateway on port 4000:

### User APIs
```bash
# Instead of: http://localhost:4001/rooms/my-bookings
# Use:        http://localhost:4000/api/rooms/my-bookings

# Instead of: http://localhost:4002/services/my-appointments
# Use:        http://localhost:4000/api/services/my-appointments
```

### Vendor APIs
```bash
# Instead of: http://localhost:4001/vendor/rooms/bookings
# Use:        http://localhost:4000/rooms/vendor/bookings

# Instead of: http://localhost:4002/vendor/services/appointments
# Use:        http://localhost:4000/services/vendor/appointments
```

---

## 7. What Each Stakeholder Sees

### User Dashboard Would Show:
```
My Bookings:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📅 Deluxe Suite - Grand Hotel
   Feb 15-17, 2026 • 2 nights • ₹5,100
   Status: Confirmed ✓
   [View Details] [Cancel]

📅 Standard Room - Beach Resort  
   Mar 20-22, 2026 • 2 nights • ₹4,000
   Status: Pending ⏳
   [View Details] [Cancel]

My Appointments:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔧 Plumbing Service
   Feb 15, 2026 10:00 AM
   Status: Confirmed ✓
   Amount: ₹630
   [View Details] [Cancel]
```

### Vendor Dashboard Would Show:
```
Today's Check-ins: 3
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Guest: User #1
Room: Deluxe Suite
Dates: Feb 15-17 • 2 nights
Amount: ₹5,100
Status: Confirmed ✓

Guest: User #5
Room: Standard Room  
Dates: Feb 15-16 • 1 night
Amount: ₹2,500
Status: Confirmed ✓

Today's Appointments: 2
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Service: Plumbing Repair
Customer: User #1
Time: 10:00 AM - 12:00 PM
Status: Confirmed ✓
[Mark Complete] [Cancel]
```

---

## Summary

✅ **ALL APIs ARE BUILT** - Nothing is missing for basic operations

✅ **USERS CAN:**
- Browse and book rooms/services
- View their booking/appointment history
- See detailed information
- Cancel with automatic refunds

✅ **VENDORS CAN:**
- Manage their inventory/services
- View all bookings/appointments
- Filter by status
- See revenue information

✅ **EVERYTHING PERSISTS TO DATABASE** - No more fake UUIDs!

✅ **READY FOR FRONTEND INTEGRATION** - All endpoints return proper JSON

The only thing missing is the **Venues module** for cricket turf/badminton, which needs to be created as a separate service.
