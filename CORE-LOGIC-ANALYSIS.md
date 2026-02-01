# Core Logic Deep Dive - What's Real vs What's Stubbed

**Date:** January 30, 2026  
**Focus:** Booking flows, vendor operations, user experience (NO auth/payments)

---

## TL;DR - The Critical Issue

**🚨 NOTHING IS ACTUALLY PERSISTED TO THE DATABASE 🚨**

```typescript
// rooms/src/svc.rooms.ts line 56
async book(dto: CreateRoomBookingDto) {
  // 1) persist booking in PG (skipped here for brevity — stub success)
  const bookingId = crypto.randomUUID();
  // ... payment calls happen ...
  return { bookingId, status: 'confirmed' };  // ← Returns UUID but never saved!
}
```

**What Actually Happens:**
1. ✅ Generate a UUID
2. ✅ Call mock payment APIs (returns success)
3. ❌ **NEVER write to room_bookings table**
4. ✅ Return `{ bookingId, status: 'confirmed' }`

**Result:** User thinks they booked, vendor sees nothing, database is empty.

---

## What Can Actually Be Booked?

### 1. **Rooms** 🛏️

#### User Journey (Current):
```
1. GET /rooms/search?checkin=2025-09-15&checkout=2025-09-16&guests=2
   ✅ Returns: List of RoomTypes from DB
   ❌ Problem: Doesn't check inventory/availability

2. GET /rooms/:id
   ✅ Returns: Single RoomType details
   ❌ Problem: No photos, amenities are just JSON blob

3. POST /rooms/price
   ✅ Returns: Price quote from pricing service
   ✅ Works: Dynamic pricing via slabs
   ❌ Problem: Doesn't validate dates or availability

4. POST /rooms/book
   ❌ CRITICAL: BOOKING NOT SAVED TO DATABASE
   ✅ Calls: Mock payment API (returns success)
   ✅ Returns: { bookingId: "uuid", status: "confirmed" }
   ❌ Problem: Can book same room infinite times
   ❌ Problem: No inventory deduction
   ❌ Problem: User has no way to view this booking later

5. POST /rooms/cancel
   ❌ BROKEN: Can't cancel what doesn't exist
   Calls refund API with hardcoded amount (100 INR)
```

#### What's in the Database (room_bookings table):
```sql
SELECT * FROM room_bookings;
-- Result: 0 rows (always empty)
```

#### What Vendors Can Do:
```
✅ GET /vendor/rooms/room-types      # View all room types
✅ POST /vendor/rooms/room-types     # Create new room type
✅ GET /vendor/rooms/inventory       # View inventory calendar
✅ POST /vendor/rooms/inventory      # Add/update inventory for a date

❌ Problem: No way to see bookings (because they don't exist)
❌ Problem: No way to block rooms
❌ Problem: No way to modify bookings
❌ Problem: No revenue reports
```

#### What's Actually Working:
1. **RoomType CRUD**: Vendors can create room types (Standard, Deluxe, Suite)
2. **Inventory Setup**: Vendors can set total_rooms=10 for date 2025-09-15
3. **Search**: Users can see available room types
4. **Pricing**: Dynamic pricing with slabs (weekday/weekend rates)

#### What's Completely Broken:
1. **Booking Persistence**: Nothing saved, everything is phantom
2. **Availability Checking**: Can book 100 rooms when only 10 exist
3. **Inventory Deduction**: sold_rooms never increments
4. **Concurrency**: Race conditions (2 users can book last room simultaneously)
5. **Booking Lifecycle**: No pending → confirmed → checked-in states
6. **Modifications**: Can't change dates, upgrade rooms, add guests

---

### 2. **Services** 🔧

#### User Journey (Current):
```
1. GET /services/catalog?store_id=1
   ✅ Returns: List of services (AC Repair, Plumbing, etc.) from DB
   ✅ Includes: base_price, visit_fee, duration_min

2. GET /services/:id
   ✅ Returns: Single service details
   ❌ Problem: No photos, no reviews, category not structured

3. GET /services/slots?store_id=1&date=2025-09-15
   ✅ Returns: Available time slots from DB
   ❌ Problem: Doesn't check if booked=capacity (overbooking possible)

4. POST /services/book
   ❌ CRITICAL: APPOINTMENT NOT SAVED TO DATABASE
   ✅ Calls: Mock payment API
   ✅ Returns: { jobId: "uuid", status: "confirmed" }
   ❌ Problem: Slot capacity not decremented
   ❌ Problem: No staff assignment
   ❌ Problem: No address validation

5. POST /services/complete
   ❌ BROKEN: Just returns stub response
   ❌ Problem: No final pricing, no actual completion logic

6. POST /services/cancel
   ❌ BROKEN: Calls refund with hardcoded 100 INR
```

#### What's in the Database (service_appointments table):
```sql
SELECT * FROM service_appointments;
-- Result: 0 rows (always empty)
```

#### What Vendors Can Do:
```
✅ GET /vendor/services/catalog       # View their services
✅ POST /vendor/services/catalog      # Add new service (e.g., "Deep Cleaning")
✅ GET /vendor/services/slots         # View time slots
✅ POST /vendor/services/slots        # Create slot (date, 9AM-10AM, capacity=3)
✅ DELETE /vendor/services/slots/:id  # Remove slot

❌ Problem: No way to see appointments (empty table)
❌ Problem: No technician assignment
❌ Problem: No route optimization
❌ Problem: No job status tracking
❌ Problem: No customer location view
```

#### What's Actually Working:
1. **Service Catalog**: Vendors can list services with base prices
2. **Slot Management**: Vendors can create time-bound slots
3. **Pricing**: Dynamic visit fees based on distance (via slabs)
4. **Payment Modes**: Supports prepaid, deposit, postpaid

#### What's Completely Broken:
1. **Appointment Persistence**: service_appointments table is empty
2. **Slot Capacity**: Can book slot 10 times when capacity=1
3. **Completion Flow**: complete() method is a stub
4. **Job Assignment**: No staff/technician concept
5. **Location Services**: No GPS validation, distance calc missing
6. **Real-time Updates**: No status tracking (en route, in progress, done)

---

### 3. **Movies** 🎬

#### User Journey (Current):
```
1. GET /movies/catalog?store_id=1
   ✅ Returns: List of movies from DB
   ✅ Includes: title, genre, duration_min

2. GET /movies/:id
   ✅ Returns: Single movie details
   ❌ Problem: No cast, director, ratings, trailer URL

3. GET /movies/showtimes?store_id=1&movie_id=5
   ✅ Returns: List of showtimes
   ❌ Problem: No seat availability info

4. ❌ NO BOOKING ENDPOINT AT ALL
   - Can view movies
   - Can view showtimes
   - Cannot book tickets
   - No seat selection
   - No pricing
```

#### What's in the Database:
```sql
SELECT * FROM movies;     -- Has data (if vendor added)
SELECT * FROM screens;    -- Has data (if vendor added)
SELECT * FROM showtimes;  -- Has data (if vendor added)

-- But no booking table exists at all!
```

#### What Vendors Can Do:
```
✅ GET /vendor/movies/catalog          # View movies
✅ POST /vendor/movies/catalog         # Add movie
✅ GET /vendor/movies/screens          # View screens
✅ POST /vendor/movies/screens         # Add screen (Screen 1, 100 seats)
✅ GET /vendor/movies/showtimes        # View showtimes
✅ POST /vendor/movies/showtimes       # Schedule show (movie_id, screen_id, time)
✅ DELETE /vendor/movies/showtimes/:id # Cancel show

❌ Problem: No seat layout editor
❌ Problem: No pricing tiers (premium/regular)
❌ Problem: No occupancy tracking (booked field exists but unused)
```

#### What's Actually Working:
1. **Content Management**: Vendors can add movies, screens, showtimes
2. **Showtime Listing**: Users can see what's playing when
3. **Basic Data Model**: Tables exist with proper structure

#### What's Completely Broken:
1. **NO BOOKING SYSTEM**: Cannot buy tickets at all
2. **No Seat Layout**: Screen has seat_count but no seat map
3. **No Seat Selection**: No way to choose 12A, 12B
4. **No Pricing**: showtimes has base_price but no booking flow
5. **No E-Tickets**: No QR codes, no ticket generation
6. **No Food Orders**: Combo not integrated

---

## Database Reality Check

### Tables That Have Data ✅
```sql
-- Vendors can populate these:
room_types         -- ✅ Works
room_rate_plans    -- ✅ Works  
room_inventory     -- ✅ Works
services_catalog   -- ✅ Works
service_slots      -- ✅ Works
movies             -- ✅ Works
screens            -- ✅ Works
showtimes          -- ✅ Works
vendor_pricing_slabs -- ✅ Works
```

### Tables That Are Always Empty ❌
```sql
room_bookings      -- ❌ NEVER WRITTEN
room_booking_items -- ❌ NEVER WRITTEN
service_appointments -- ❌ NEVER WRITTEN

-- These don't even have TypeORM entities:
room_bookings      -- No entity file
room_booking_items -- No entity file
service_appointments -- No entity file (imported but not in entities.ts)
```

### The Missing Entity Problem

**Current entities.ts files:**
```typescript
// apps/rooms/src/typeorm/entities.ts
export { RoomType };
export { RoomRatePlan };
export { RoomInventory };
// ❌ RoomBooking is missing!
// ❌ RoomBookingItem is missing!

// apps/services-api/src/typeorm/entities.ts
export { ServiceCatalog };
export { ServiceSlot };
export { VendorStore };
// ❌ ServiceAppointment is missing!
```

**Why bookings don't work:**
1. No TypeORM entity = Can't use `@InjectRepository`
2. Code has the repository injection commented out
3. Service methods just return fake UUIDs

---

## The Core Logic Gaps - Detailed

### Gap 1: NO PERSISTENCE LAYER
**Impact:** Everything is a mirage

**Rooms Example:**
```typescript
// CURRENT CODE (svc.rooms.ts):
async book(dto: CreateRoomBookingDto) {
  const bookingId = crypto.randomUUID();  // ← Just a random string
  // ... payment calls ...
  return { bookingId, status: 'confirmed' };  // ← Nothing in DB
}

// WHAT'S NEEDED:
async book(dto: CreateRoomBookingDto) {
  // 1. Check inventory
  const available = await this.checkAvailability(dto);
  if (!available) throw new BadRequestException('No rooms available');
  
  // 2. Create booking
  const booking = this.bookingsRepo.create({
    user_id: dto.userId,
    store_id: dto.storeId,
    check_in: dto.checkIn,
    check_out: dto.checkOut,
    rooms: dto.rooms,
    adults: dto.adults,
    children: dto.children,
    status: 'pending'
  });
  await this.bookingsRepo.save(booking);
  
  // 3. Create booking items
  for (const item of dto.items) {
    const bookingItem = this.bookingItemsRepo.create({
      booking_id: booking.id,
      room_type_id: item.roomTypeId,
      rate_plan_id: item.ratePlanId,
      nights: item.nights,
      price_per_night: item.pricePerNightMinor / 100,
      tax_amount: item.taxMinor / 100,
      total: item.totalMinor / 100
    });
    await this.bookingItemsRepo.save(bookingItem);
  }
  
  // 4. Decrement inventory
  for (let d = new Date(dto.checkIn); d < new Date(dto.checkOut); d.setDate(d.getDate() + 1)) {
    await this.inventoryRepo.increment(
      { room_type_id: item.roomTypeId, date: d },
      'sold_rooms',
      1
    );
  }
  
  // 5. Payment & order mirroring
  // ... existing payment code ...
  
  // 6. Update status
  booking.status = 'confirmed';
  await this.bookingsRepo.save(booking);
  
  return { bookingId: booking.id, status: booking.status };
}
```

### Gap 2: NO AVAILABILITY CHECKING
**Impact:** Can book 1000 rooms when only 1 exists

**What's Needed:**
```typescript
async checkAvailability(dto: CreateRoomBookingDto): Promise<boolean> {
  const dates = getDatesInRange(dto.checkIn, dto.checkOut);
  
  for (const item of dto.items) {
    for (const date of dates) {
      const inv = await this.inventoryRepo.findOne({
        where: { room_type_id: item.roomTypeId, date }
      });
      
      if (!inv) return false; // No inventory for this date
      if (inv.status !== 'open') return false; // Closed for booking
      if (inv.sold_rooms + dto.rooms > inv.total_rooms) return false; // Overbooked
    }
  }
  
  return true;
}
```

### Gap 3: NO INVENTORY MANAGEMENT
**Impact:** sold_rooms never changes, no "sold out" state

**What Happens Now:**
```sql
-- Vendor sets inventory:
INSERT INTO room_inventory (room_type_id, date, total_rooms, sold_rooms)
VALUES (1, '2025-09-15', 10, 0);

-- User books 2 rooms:
-- ... nothing happens to the row ...

-- Check inventory:
SELECT * FROM room_inventory WHERE date='2025-09-15';
-- sold_rooms is still 0 ❌

-- 100 more users can book all 10 rooms ❌
```

**What's Needed:**
```typescript
// After successful booking:
await this.inventoryRepo.increment(
  { room_type_id: item.roomTypeId, date: bookingDate },
  'sold_rooms',
  numberOfRooms
);

// Before booking (check):
const inv = await this.inventoryRepo.findOne({...});
if (inv.sold_rooms >= inv.total_rooms) {
  throw new BadRequestException('Sold out for this date');
}
```

### Gap 4: NO SLOT CAPACITY MANAGEMENT (Services)
**Impact:** Can book same time slot unlimited times

**Current Code:**
```typescript
// services/src/svc.services.ts
async slots(q: any) {
  // Just returns all slots, doesn't filter by availability
  return this.slotRepo.find({ where, take: 200 });
}

async book(dto: CreateServiceAppointmentDto) {
  // Doesn't check slot capacity
  // Doesn't increment booked count
  return { jobId: crypto.randomUUID() };
}
```

**What's Needed:**
```typescript
async book(dto: CreateServiceAppointmentDto) {
  // 1. Check slot capacity
  if (dto.slotId) {
    const slot = await this.slotRepo.findOne({ where: { id: dto.slotId } });
    if (!slot) throw new NotFoundException('Slot not found');
    if (slot.booked >= slot.capacity) {
      throw new BadRequestException('Slot fully booked');
    }
    
    // 2. Increment booked count
    slot.booked += 1;
    await this.slotRepo.save(slot);
  }
  
  // 3. Create appointment
  const appointment = this.appointmentsRepo.create({
    user_id: dto.userId,
    store_id: dto.storeId,
    service_id: dto.serviceId,
    slot_id: dto.slotId,
    scheduled_for: dto.scheduledFor,
    address_id: dto.addressId,
    status: 'pending'
  });
  await this.appointmentsRepo.save(appointment);
  
  return { jobId: appointment.id, status: 'confirmed' };
}
```

### Gap 5: NO BOOKING RETRIEVAL
**Impact:** User books but can never see their bookings

**What's Missing Entirely:**
```typescript
// User endpoints needed:
GET /rooms/my-bookings          // List user's bookings
GET /rooms/bookings/:id         // Single booking details
GET /services/my-appointments   // List user's appointments
GET /services/appointments/:id  // Single appointment details

// Vendor endpoints needed:
GET /vendor/rooms/bookings      // All bookings for this vendor
GET /vendor/services/appointments  // All appointments

// Implementation:
async getUserBookings(userId: number) {
  return this.bookingsRepo.find({
    where: { user_id: userId },
    order: { created_at: 'DESC' },
    relations: ['items', 'items.roomType']
  });
}
```

### Gap 6: NO STATUS LIFECYCLE
**Impact:** Booking created as 'pending' but never moves forward

**States Needed:**
```typescript
// Room Booking States:
'pending'    → Payment processing
'confirmed'  → Payment successful, waiting for check-in
'checked-in' → Guest arrived
'checked-out' → Guest left
'cancelled'  → User/vendor cancelled
'no-show'    → User didn't show up

// Service Appointment States:
'pending'     → Created, payment processing
'confirmed'   → Payment done, scheduled
'assigned'    → Technician assigned
'en-route'    → Technician traveling
'in-progress' → Service being performed
'completed'   → Service done
'cancelled'   → Cancelled by user/vendor
```

**Code Needed:**
```typescript
async checkIn(bookingId: string) {
  const booking = await this.bookingsRepo.findOne({ where: { id: bookingId } });
  if (booking.status !== 'confirmed') {
    throw new BadRequestException('Cannot check-in');
  }
  booking.status = 'checked-in';
  await this.bookingsRepo.save(booking);
  return booking;
}
```

### Gap 7: NO MODIFICATION SUPPORT
**Impact:** User books wrong date, cannot change it

**What's Missing:**
```typescript
// Modify booking dates
PUT /rooms/bookings/:id/dates
async modifyDates(bookingId: string, newCheckIn: string, newCheckOut: string) {
  // 1. Check new availability
  // 2. Calculate price difference
  // 3. Process refund/charge difference
  // 4. Update inventory (release old dates, occupy new dates)
  // 5. Update booking record
}

// Upgrade room type
PUT /rooms/bookings/:id/upgrade
async upgradeRoom(bookingId: string, newRoomTypeId: number) {
  // 1. Check new room availability
  // 2. Calculate price difference
  // 3. Charge difference
  // 4. Update booking_items
}

// Add guests
PUT /rooms/bookings/:id/guests
async addGuests(bookingId: string, additionalGuests: number) {
  // 1. Check room capacity
  // 2. Calculate additional charges
  // 3. Process payment
  // 4. Update booking
}
```

### Gap 8: NO CANCELLATION LOGIC
**Impact:** cancel() method exists but is completely stubbed

**Current Code:**
```typescript
async cancel(bookingId: string, askRefundDestination: boolean) {
  // Compute refund via slabs (TODO); for demo, refund everything to wallet
  const refundMinor = 100;  // ← Hardcoded! Should calculate actual amount
  // ... calls refund API ...
  return { bookingId, refunded_minor: refundMinor };
}
```

**What's Needed:**
```typescript
async cancel(bookingId: string, askRefundDestination: boolean) {
  // 1. Fetch booking from DB
  const booking = await this.bookingsRepo.findOne({ 
    where: { id: bookingId },
    relations: ['items']
  });
  if (!booking) throw new NotFoundException();
  if (booking.status === 'cancelled') throw new BadRequestException('Already cancelled');
  
  // 2. Calculate refund based on cancellation policy
  const total = booking.items.reduce((sum, item) => sum + item.total, 0);
  const refundPolicy = await this.getRatePlanPolicy(booking.items[0].rate_plan_id);
  const now = new Date();
  const checkIn = new Date(booking.check_in);
  const hoursUntilCheckIn = (checkIn - now) / (1000 * 60 * 60);
  
  let refundPercent = 100;
  if (refundPolicy.refundable === false) {
    refundPercent = 0; // Non-refundable
  } else if (hoursUntilCheckIn < 24) {
    refundPercent = 50; // 50% if within 24 hours
  } else if (hoursUntilCheckIn < 48) {
    refundPercent = 75; // 75% if within 48 hours
  }
  // Or use pricing slabs with tag='refund_penalty'
  
  const refundAmount = (total * refundPercent / 100);
  
  // 3. Release inventory
  for (const item of booking.items) {
    for (let d = new Date(booking.check_in); d < new Date(booking.check_out); d.setDate(d.getDate() + 1)) {
      await this.inventoryRepo.decrement(
        { room_type_id: item.room_type_id, date: d },
        'sold_rooms',
        booking.rooms
      );
    }
  }
  
  // 4. Process refund
  await this.financeClient.refund({
    user_id: booking.user_id,
    amount_minor: Math.round(refundAmount * 100),
    to: askRefundDestination ? 'wallet' : 'source',
    order_like_ref: bookingId
  });
  
  // 5. Update booking status
  booking.status = 'cancelled';
  await this.bookingsRepo.save(booking);
  
  return { 
    bookingId, 
    refunded_minor: Math.round(refundAmount * 100),
    refund_percent: refundPercent 
  };
}
```

### Gap 9: INCOMPLETE COMPLETE() METHOD (Services)
**Impact:** Service finishes but no final settlement

**Current Code:**
```typescript
async complete(jobId: string, additionsMinor: number) {
  // TODO: compute final price and call capture/refund diff if deposit used
  return { jobId, status: 'completed', additions_minor: additionsMinor };
}
```

**What's Needed:**
```typescript
async complete(jobId: string, additionsMinor: number) {
  // 1. Fetch appointment
  const apt = await this.appointmentsRepo.findOne({ where: { id: jobId } });
  if (!apt) throw new NotFoundException();
  
  // 2. Calculate final amount
  const baseAmount = apt.base_amount; // stored during booking
  const visitFee = apt.visit_fee;
  const originalTotal = baseAmount + visitFee;
  const finalTotal = originalTotal + additionsMinor;
  
  // 3. Handle payment based on mode
  if (apt.payment_mode === 'deposit') {
    const depositPaid = apt.deposit_amount;
    const remaining = finalTotal - depositPaid;
    
    if (remaining > 0) {
      // Charge additional amount
      await this.financeClient.capture({
        user_id: apt.user_id,
        amount_minor: remaining,
        reason: 'service_completion_additional'
      });
    } else if (remaining < 0) {
      // Refund excess deposit
      await this.financeClient.refund({
        user_id: apt.user_id,
        amount_minor: Math.abs(remaining),
        to: 'wallet'
      });
    }
  } else if (apt.payment_mode === 'postpaid') {
    // Charge full amount now
    await this.financeClient.capture({
      user_id: apt.user_id,
      amount_minor: finalTotal,
      reason: 'service_postpaid'
    });
  }
  
  // 4. Update appointment
  apt.status = 'completed';
  apt.final_amount = finalTotal;
  apt.completed_at = new Date();
  await this.appointmentsRepo.save(apt);
  
  // 5. Release slot
  if (apt.slot_id) {
    await this.slotRepo.decrement({ id: apt.slot_id }, 'booked', 1);
  }
  
  return { jobId, status: 'completed', final_amount_minor: finalTotal };
}
```

---

## What Users See vs Reality

### User Experience - ROOMS

**UI Shows:**
```
✅ List of room types (Standard ₹2000, Deluxe ₹3500)
✅ Check-in/out date picker
✅ Guest count selector
✅ "Book Now" button
✅ Success message: "Booking confirmed! ID: abc-123"
```

**Reality:**
```
❌ booking_id "abc-123" doesn't exist in database
❌ No confirmation email sent (no email system)
❌ Cannot view booking later (no endpoint)
❌ Cannot modify or cancel (booking doesn't exist)
❌ Room still shows as available for everyone else
❌ If page reloads, booking is lost forever
```

**User Journey Breaks At:**
```
1. User books room → Success!
2. User closes browser
3. User returns tomorrow → "Where's my booking?"
4. User calls support → "No booking found in system"
```

### User Experience - SERVICES

**UI Shows:**
```
✅ Service catalog (AC Repair ₹500, Plumbing ₹300)
✅ Date/time slot selection
✅ Address input (not validated)
✅ "Book Service" button
✅ Success: "Appointment confirmed! Job ID: xyz-789"
```

**Reality:**
```
❌ appointment_id doesn't exist
❌ Technician not assigned (no concept of technicians)
❌ Cannot track status (no status updates)
❌ Slot shows available even after 10 bookings (capacity=1)
❌ No ETA, no real-time updates
❌ No before/after photos
❌ Complete button does nothing meaningful
```

### User Experience - MOVIES

**UI Shows:**
```
✅ Movie catalog (Avengers, Duration: 180 min)
✅ Showtimes list (Screen 1, 3:00 PM)
❌ "Book Tickets" button → DOESN'T EXIST
```

**Reality:**
```
❌ Cannot book at all
❌ No seat selection
❌ No pricing
❌ No ticket generation
❌ Feature is 0% functional for users
```

---

## What Vendors See vs Reality

### Vendor Dashboard - ROOMS

**Can Do:**
```
✅ Add room types (Standard, Deluxe, Suite)
✅ Set inventory (10 rooms on Sept 15)
✅ Set base prices
✅ Configure pricing slabs (weekend +20%)
```

**Cannot Do:**
```
❌ View bookings (table is empty)
❌ See revenue (no bookings = no revenue)
❌ Block dates for maintenance
❌ Modify prices for existing bookings
❌ Export booking reports
❌ Contact guests (no booking data)
```

**Vendor Experience:**
```
1. Vendor sets up 10 rooms for ₹2000/night
2. 50 users "book" rooms via UI
3. Vendor checks dashboard → 0 bookings
4. Vendor: "Is my listing broken?"
```

### Vendor Dashboard - SERVICES

**Can Do:**
```
✅ Add services (AC Repair, Plumbing)
✅ Create time slots (9-10 AM, capacity 3)
✅ Set base price + visit fee
✅ Configure distance-based pricing
```

**Cannot Do:**
```
❌ View appointments (empty table)
❌ Assign technicians (no staff table)
❌ See daily schedule
❌ Track job status
❌ View customer locations on map
❌ Calculate routes between jobs
❌ Generate invoices
```

**Vendor Experience:**
```
1. Vendor creates "AC Repair" service
2. Users book 20 appointments
3. Vendor: "When should I send technician?"
4. System: "No appointments found"
```

### Vendor Dashboard - MOVIES

**Can Do:**
```
✅ Add movies to catalog
✅ Create screens (Screen 1, 100 seats)
✅ Schedule showtimes (3 PM, 6 PM, 9 PM)
✅ Delete showtimes
```

**Cannot Do:**
```
❌ See ticket bookings (doesn't exist)
❌ View occupancy (booked field unused)
❌ Design seat layout
❌ Set seat pricing tiers
❌ Generate revenue reports
❌ Manage food combos
```

---

## Technical Debt Breakdown

### Level 1: Database Entities Missing ⚠️
```typescript
// Need to create these entities:

// apps/rooms/src/typeorm/entities.ts
@Entity({ name: 'room_bookings' })
export class RoomBooking {
  @PrimaryGeneratedColumn('uuid')
  id!: string;
  @Column({ type: 'bigint' }) user_id!: number;
  @Column({ type: 'bigint' }) store_id!: number;
  @Column({ type: 'date' }) check_in!: string;
  @Column({ type: 'date' }) check_out!: string;
  @Column({ type: 'int', default: 1 }) rooms!: number;
  @Column({ type: 'int', default: 1 }) adults!: number;
  @Column({ type: 'int', default: 0 }) children!: number;
  @Column({ type: 'text', default: 'pending' }) status!: string;
  @Column({ type: 'timestamptz', default: () => 'now()' }) created_at!: Date;
  
  @OneToMany(() => RoomBookingItem, item => item.booking)
  items!: RoomBookingItem[];
}

@Entity({ name: 'room_booking_items' })
export class RoomBookingItem {
  @PrimaryGeneratedColumn('increment')
  id!: number;
  @Column({ type: 'uuid' }) booking_id!: string;
  @Column({ type: 'bigint' }) room_type_id!: number;
  @Column({ type: 'bigint' }) rate_plan_id!: number;
  @Column({ type: 'int' }) nights!: number;
  @Column({ type: 'numeric', precision: 12, scale: 2 }) price_per_night!: string;
  @Column({ type: 'numeric', precision: 12, scale: 2, default: 0 }) tax_amount!: string;
  @Column({ type: 'numeric', precision: 12, scale: 2 }) total!: string;
  
  @ManyToOne(() => RoomBooking, booking => booking.items)
  @JoinColumn({ name: 'booking_id' })
  booking!: RoomBooking;
}

// apps/services-api/src/typeorm/entities.ts
@Entity({ name: 'service_appointments' })
export class ServiceAppointment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;
  @Column({ type: 'bigint' }) user_id!: number;
  @Column({ type: 'bigint' }) store_id!: number;
  @Column({ type: 'bigint' }) service_id!: number;
  @Column({ type: 'bigint', nullable: true }) slot_id!: number | null;
  @Column({ type: 'timestamptz' }) scheduled_for!: Date;
  @Column({ type: 'bigint', nullable: true }) address_id!: number | null;
  @Column({ type: 'text', default: 'pending' }) status!: string;
  @Column({ type: 'text', nullable: true }) notes!: string | null;
}
```

### Level 2: Repository Injection ⚠️
```typescript
// Add to module.ts:
@Module({
  imports: [
    TypeOrmModule.forFeature([
      RoomType, 
      RoomInventory,
      RoomBooking,       // ← Add
      RoomBookingItem    // ← Add
    ])
  ],
  // ...
})

// Inject in service:
export class RoomsService {
  constructor(
    @InjectRepository(RoomType) private readonly roomTypes: Repository<RoomType>,
    @InjectRepository(RoomInventory) private readonly inventory: Repository<RoomInventory>,
    @InjectRepository(RoomBooking) private readonly bookings: Repository<RoomBooking>,  // ← Add
    @InjectRepository(RoomBookingItem) private readonly bookingItems: Repository<RoomBookingItem>,  // ← Add
  ) {}
}
```

### Level 3: Implement Persistence 🔴
```typescript
// Replace stub code with actual saves
async book(dto: CreateRoomBookingDto) {
  // Remove this:
  const bookingId = crypto.randomUUID();
  
  // Add this:
  const booking = this.bookings.create({...});
  await this.bookings.save(booking);
  
  for (const item of dto.items) {
    const bookingItem = this.bookingItems.create({...});
    await this.bookingItems.save(bookingItem);
  }
  
  return { bookingId: booking.id, status: booking.status };
}
```

### Level 4: Add Business Logic 🔴
```typescript
// Availability checking
async checkAvailability(...) { /* implement */ }

// Inventory management
async decrementInventory(...) { /* implement */ }

// Slot capacity
async checkSlotCapacity(...) { /* implement */ }

// Status lifecycle
async updateStatus(id, newStatus) { /* implement */ }
```

### Level 5: Add Query Endpoints 🟡
```typescript
// User-facing
@Get('/my-bookings')
async getMyBookings(@User() userId: number) {
  return this.bookings.find({ where: { user_id: userId } });
}

// Vendor-facing
@Get('/vendor/bookings')
async getVendorBookings(@Vendor() storeId: number) {
  return this.bookings.find({ where: { store_id: storeId } });
}
```

### Level 6: Add Modification Logic 🟡
```typescript
@Put('/bookings/:id/dates')
async modifyDates(...) { /* implement */ }

@Put('/bookings/:id/cancel')
async cancelBooking(...) { /* implement full logic */ }
```

---

## Priority Fix List (Core Logic Only)

### 🔴 CRITICAL (Do First)
1. **Create missing entities** (RoomBooking, RoomBookingItem, ServiceAppointment)
2. **Inject repositories** in service constructors
3. **Implement book() persistence** for rooms
4. **Implement book() persistence** for services
5. **Add availability checking** before booking
6. **Decrement inventory/slots** after booking

### 🟡 HIGH (Do Next)
7. **Add getUserBookings()** endpoint
8. **Add getVendorBookings()** endpoint
9. **Implement full cancel() logic** with refund calculation
10. **Implement complete() logic** for services
11. **Add status update methods** (checkIn, checkOut, etc.)

### 🟢 MEDIUM (Polish)
12. Add modification endpoints (change dates, upgrade)
13. Add booking history with filters
14. Add search within bookings
15. Add booking analytics for vendors

### 🔵 LOW (Future)
16. Movies booking system (entire feature)
17. Real-time status tracking
18. Notifications
19. Reviews after completion

---

## Summary - The Honest Truth

### What Works Today:
- ✅ Vendors can set up inventory (rooms, services, slots, movies)
- ✅ Users can browse availability
- ✅ Pricing engine calculates dynamic prices
- ✅ UI shows booking flow
- ✅ Mock payments return success
- ✅ Services communicate via HTTP

### What Doesn't Work:
- ❌ **Bookings are never saved** (biggest issue)
- ❌ Users cannot view their bookings
- ❌ Vendors cannot see any bookings
- ❌ Inventory/slots not decremented (unlimited overbooking)
- ❌ Cancellation is stub (hardcoded refund)
- ❌ Completion is stub (services)
- ❌ Movies have 0% booking functionality
- ❌ No modification capability
- ❌ No status lifecycle
- ❌ No reports/analytics

### What Needs to Happen:
1. **Add 3 missing entity files** (30 lines each)
2. **Inject 3 repositories** (3 lines per service)
3. **Replace 3 stub methods** with real persistence (150 lines total)
4. **Add availability checking** (100 lines)
5. **Add inventory management** (50 lines)
6. **Add query endpoints** (100 lines)

**Total Code Needed:** ~600 lines to make bookings actually work

**Effort Estimate:** 2-3 days for a skilled NestJS developer

---

This is a **prototype with 90% UI and 10% backend logic**. The architecture is solid, but core CRUD operations for the most important tables are missing. Focus on persistence first, everything else builds on that foundation.
