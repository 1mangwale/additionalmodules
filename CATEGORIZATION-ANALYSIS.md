# Business Categorization Analysis

**Date:** January 30, 2026  
**Purpose:** Review current system vs actual business needs

---

## Your Business Model - What You Want to Support

### 1. **ACCOMMODATIONS** 🏨
- Hostel booking (dorm beds, shared rooms)
- Hotel room booking (standard, deluxe, suite)
- Villa booking (entire property)
- Guest houses
- Service apartments
- Farmhouses
- Beach houses

### 2. **SPORTS FACILITIES** 🏏⚽🏸
- Cricket turf booking (by the hour/day)
- Badminton court booking (slot-based)
- Pickleball court booking
- Tennis court
- Football ground
- Swimming pool
- Gym slots
- Yoga studios

### 3. **HOME SERVICES** 🔧🏡
- Gardener (lawn care, landscaping)
- Plumber (pipe repair, installation)
- Electrician
- Carpenter
- Painter
- AC repair/servicing
- Appliance repair
- Pest control
- House cleaning
- Car wash

### 4. **ENTERTAINMENT** 🎬🎭
- **Cinema/Movies** (seat-based booking)
- **Theater** (live performances, plays, concerts)
- Stand-up comedy shows
- Music concerts
- Art exhibitions
- Amusement parks
- Escape rooms
- Gaming zones

---

## Current System - What's Implemented

### ✅ What Works Today:

#### 1. **Rooms Module** (apps/rooms)
```
Current category: 'room' | 'dorm'
Current purpose: Hotel/hostel bookings
```
**✅ Supports:**
- Hotel rooms (standard, deluxe)
- Hostel dorms (with gender_policy)

**❌ DOESN'T Support:**
- Villas (needs different pricing model - entire property vs per room)
- Sports facilities (hourly slots, not overnight stays)
- Venues (cricket turf, badminton courts)

#### 2. **Services Module** (apps/services-api)
```
Current category: Free-text field (plumbing, ac-repair, etc.)
Current purpose: On-demand home services
```
**✅ Supports:**
- Plumber, gardener, AC repair
- At-location services
- Slot-based scheduling

**❌ DOESN'T Support:**
- Fixed-location services (yoga classes at studio)
- Recurring services (weekly gardening)
- Group services (fitness classes)

#### 3. **Movies Module** (apps/movies)
```
Current purpose: Cinema ticket booking
```
**✅ Supports:**
- Movie listings
- Showtimes
- Screens

**❌ DOESN'T Support:**
- Seat selection (no booking logic at all!)
- Theater/live performances
- Events

---

## Major Gaps & Problems

### 🚨 CRITICAL ISSUES:

#### 1. **Sports Facilities Have NO Module**
**Problem:** Cricket turf, badminton courts don't fit anywhere

**Current Options:**
- ❌ `rooms` module? No - these are hourly slots, not overnight
- ❌ `services` module? No - these are facility rentals, not services
- ❌ `movies` module? No - completely different

**What You Need:** 
- New **"Venues"** or **"Facilities"** module
- Hourly/slot-based booking
- Court/field inventory
- Equipment rentals (bats, rackets)

#### 2. **Room Categories Too Limited**
**Problem:** `category: 'room' | 'dorm'` is hardcoded

**Missing:**
- `villa` - Entire property booking (not per room)
- `apartment` - Service apartments
- `farmhouse` - Rural properties
- `beachhouse` - Coastal properties
- `guesthouse` - Small B&Bs
- `treehouse` - Unique stays
- `tent` - Camping/glamping

**Impact:** Cannot differentiate pricing models:
- Hotels: Per room, per night
- Villas: Entire property, may have minimum nights
- Dorms: Per bed, not per room

#### 3. **Services Categories Unstructured**
**Problem:** `category` is free text, no standardization

**Current:**
```sql
INSERT INTO services_catalog (category) VALUES ('plumbing');
INSERT INTO services_catalog (category) VALUES ('plumber');  -- Typo!
INSERT INTO services_catalog (category) VALUES ('Plumbing');  -- Case issue!
```

**What You Need:**
```
home-services/
  ├── plumbing
  ├── electrical
  ├── carpentry
  ├── painting
  └── cleaning
  
wellness/
  ├── salon
  ├── spa
  ├── yoga
  └── massage
  
education/
  ├── tutoring
  ├── music-lessons
  └── language-classes
```

#### 4. **No Event/Entertainment Beyond Movies**
**Problem:** Movies module is ONLY for cinema

**Missing:**
- Theater performances (plays, musicals)
- Concerts (music events)
- Stand-up comedy
- Sporting events (IPL, tournaments)
- Conferences/workshops
- Art exhibitions

#### 5. **No Venue Booking for Fixed Locations**
**Problem:** Some services need venue booking, not home visits

**Examples:**
- Yoga classes at studio
- Gym memberships
- Swimming lessons at pool
- Cooking classes at institute
- Photography studio rental

---

## Recommended Categorization Structure

### Option A: **Expand Existing Modules** (Quick Fix)

#### 1. Update `room_types.category`:
```typescript
// From:
category: 'room' | 'dorm'

// To:
category: 'hotel-room' | 'hostel-dorm' | 'villa' | 'apartment' | 
          'farmhouse' | 'guesthouse' | 'beachhouse' | 'tent' | 'treehouse'

// Or better - add a separate field:
accommodation_type: 'hotel' | 'hostel' | 'villa' | 'apartment' | 'farmhouse'
room_type: 'standard' | 'deluxe' | 'suite' | 'dorm-bed' | 'entire-property'
```

#### 2. Standardize `services_catalog.category`:
```sql
-- Add CHECK constraint:
ALTER TABLE services_catalog 
ADD CONSTRAINT category_check 
CHECK (category IN (
  'plumbing', 'electrical', 'carpentry', 'painting', 'cleaning',
  'ac-repair', 'appliance-repair', 'pest-control', 
  'gardening', 'car-wash', 'laundry',
  'salon', 'spa', 'massage', 'yoga', 'fitness',
  'tutoring', 'music-lessons', 'language-classes'
));

-- Or use ENUM:
CREATE TYPE service_category AS ENUM (
  'plumbing', 'electrical', 'carpentry', ...
);
```

#### 3. Expand Movies → Entertainment:
```typescript
// Rename module: movies → entertainment
// Add type field:
type: 'cinema' | 'theater' | 'concert' | 'comedy-show' | 'sporting-event'
```

---

### Option B: **Create New Modules** (Proper Architecture)

#### New Module: **Venues/Facilities**
```
Purpose: Fixed-location, time-slot bookings
Examples: Sports courts, conference rooms, studios

Tables:
- venue_types (cricket-turf, badminton-court, conference-room)
- venue_inventory (specific courts/rooms at location)
- venue_slots (date + time slots)
- venue_bookings (user bookings)

Pricing:
- Hourly rates
- Peak/off-peak pricing
- Equipment add-ons
```

#### New Module: **Events**
```
Purpose: Ticketed events (concerts, theater, sports)
Examples: Theater plays, concerts, comedy shows

Tables:
- event_categories (theater, concert, sports, comedy)
- events (specific event details)
- event_schedules (when & where)
- event_tickets (pricing tiers)
- event_bookings (ticket purchases)
```

---

## Detailed Category Taxonomy

### 🏨 ACCOMMODATIONS (Rooms Module)

```
accommodation_categories:
  hotels:
    - standard-room
    - deluxe-room
    - suite
    - presidential-suite
  
  hostels:
    - dorm-bed-mixed
    - dorm-bed-male
    - dorm-bed-female
    - private-room
  
  villas:
    - entire-villa
    - villa-with-pool
    - beachfront-villa
  
  alternative:
    - farmhouse
    - guesthouse
    - service-apartment
    - beachhouse
    - treehouse
    - tent/glamping
    - houseboat
```

**Booking Model:**
- Hotels/Hostels: Per room/bed, per night
- Villas: Entire property, minimum nights
- All: Check-in/out dates, guest counts

---

### 🏟️ VENUES/FACILITIES (New Module Needed)

```
venue_categories:
  sports-outdoor:
    - cricket-turf
    - football-ground
    - tennis-court
    - basketball-court
  
  sports-indoor:
    - badminton-court
    - pickleball-court
    - squash-court
    - table-tennis
    - gym
    - swimming-pool
  
  studios:
    - yoga-studio
    - dance-studio
    - photography-studio
    - music-practice-room
    - art-studio
  
  business:
    - conference-room
    - meeting-room
    - coworking-desk
    - event-hall
    - banquet-hall
  
  entertainment:
    - gaming-zone
    - bowling-alley
    - escape-room
    - party-hall
```

**Booking Model:**
- Slot-based (1 hour, 2 hours, 4 hours)
- Date + time range
- Capacity tracking
- Equipment add-ons
- Recurring bookings (weekly badminton)

---

### 🔧 SERVICES (Existing Module - Needs Categories)

```
service_categories:
  home-repair:
    - plumbing
    - electrical
    - carpentry
    - painting
    - roofing
    - masonry
  
  home-maintenance:
    - cleaning (regular/deep)
    - pest-control
    - ac-repair
    - appliance-repair
    - gardening
    - lawn-care
  
  vehicle:
    - car-wash
    - car-repair
    - bike-service
    - vehicle-detailing
  
  wellness:
    - salon-at-home
    - spa-at-home
    - massage
    - yoga-trainer
    - fitness-trainer
    - physiotherapy
  
  education:
    - home-tutoring
    - music-lessons
    - language-classes
    - cooking-classes
    - art-classes
  
  technology:
    - laptop-repair
    - mobile-repair
    - tv-installation
    - smart-home-setup
  
  professional:
    - photography
    - videography
    - event-planning
    - catering
    - decoration
```

**Booking Model:**
- Appointment-based
- At-location or at-customer-location
- Single or recurring
- Time slots

---

### 🎬 ENTERTAINMENT (Movies + New Categories)

```
entertainment_categories:
  cinema:
    - movies-2d
    - movies-3d
    - movies-imax
    - movies-4dx
  
  theater:
    - plays
    - musicals
    - opera
    - ballet
    - stand-up-comedy
  
  music:
    - concerts
    - festivals
    - live-music-shows
  
  sports:
    - cricket-match
    - football-match
    - kabaddi-match
    - tennis-match
  
  attractions:
    - amusement-park
    - water-park
    - zoo
    - aquarium
    - museum
    - exhibition
```

**Booking Model:**
- Ticketed events
- Seat selection (for cinema/theater)
- General admission (for concerts)
- Date + time specific
- Tiered pricing (regular, premium, VIP)

---

## What You're Missing - Comprehensive List

### ❌ Currently NOT Supported:

1. **Recurring Bookings**
   - Weekly badminton court
   - Monthly housekeeping
   - Daily gym slot

2. **Group Bookings**
   - Fitness classes (1 instructor, 20 people)
   - Workshops
   - Tours

3. **Package Deals**
   - Villa + chef service
   - Spa day package
   - Event venue + catering

4. **Equipment Rentals**
   - Cricket bats with turf booking
   - Snorkeling gear with beach trip
   - Camera with photography studio

5. **Membership/Subscriptions**
   - Gym membership (30 days)
   - Coworking space (monthly)
   - Unlimited movie pass

6. **Multi-Day Events**
   - Music festivals (3 days)
   - Conferences (2 days)
   - Workshops (weekend)

7. **Waitlists**
   - When venue fully booked
   - Automatic notification on cancellation

8. **Partial Bookings**
   - Share cricket turf with another team
   - Split badminton court cost

9. **Seasonal/Holiday Pricing**
   - Diwali surge pricing
   - Monsoon off-season discounts
   - Weekend vs weekday rates (exists in pricing engine, needs better integration)

10. **Location-Based Search**
    - Find nearest badminton court
    - Services within 5km radius
    - Exists partially (vendor_stores has lat/lng) but not utilized

---

## Recommended Database Changes

### 1. Add Venue/Facility Module

```sql
-- New tables needed:
CREATE TABLE venue_categories (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  parent_category TEXT,  -- sports|studio|business|entertainment
  description TEXT
);

CREATE TABLE venues (
  id BIGSERIAL PRIMARY KEY,
  store_id BIGINT NOT NULL,
  category_id BIGINT NOT NULL,
  name TEXT NOT NULL,
  capacity INT NOT NULL DEFAULT 1,
  pricing_mode TEXT DEFAULT 'hourly',  -- hourly|fixed
  base_price_per_hour NUMERIC(12,2),
  equipment_available JSONB,  -- ["bats", "balls", "nets"]
  amenities JSONB,  -- ["parking", "changing-room", "shower"]
  status SMALLINT DEFAULT 1
);

CREATE TABLE venue_slots (
  id BIGSERIAL PRIMARY KEY,
  venue_id BIGINT NOT NULL,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status TEXT DEFAULT 'available',  -- available|booked|blocked
  UNIQUE(venue_id, date, start_time)
);

CREATE TABLE venue_bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id BIGINT NOT NULL,
  venue_id BIGINT NOT NULL,
  booking_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  hours NUMERIC(4,2) NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### 2. Update Room Categories

```sql
-- Add proper categorization:
ALTER TABLE room_types 
  ADD COLUMN accommodation_type TEXT CHECK (
    accommodation_type IN ('hotel', 'hostel', 'villa', 'apartment', 
                          'farmhouse', 'guesthouse', 'beachhouse', 'other')
  );

-- category field becomes room_type:
-- 'standard', 'deluxe', 'suite', 'dorm-bed', 'entire-property'
```

### 3. Standardize Service Categories

```sql
-- Create category enum:
CREATE TYPE service_category_type AS ENUM (
  'plumbing', 'electrical', 'carpentry', 'painting', 'cleaning',
  'ac-repair', 'appliance-repair', 'pest-control', 'gardening',
  'salon', 'spa', 'massage', 'fitness', 'tutoring', 'photography'
);

ALTER TABLE services_catalog 
  ALTER COLUMN category TYPE service_category_type USING category::service_category_type;

-- Add parent category:
ALTER TABLE services_catalog 
  ADD COLUMN parent_category TEXT CHECK (
    parent_category IN ('home-repair', 'home-maintenance', 'wellness', 
                       'education', 'professional', 'vehicle')
  );
```

### 4. Expand Movies → Events

```sql
-- Rename tables or create new:
CREATE TABLE events (
  id BIGSERIAL PRIMARY KEY,
  store_id BIGINT NOT NULL,
  title TEXT NOT NULL,
  event_type TEXT CHECK (
    event_type IN ('cinema', 'theater', 'concert', 'comedy', 'sports-event')
  ),
  genre TEXT,
  duration_min INT,
  description TEXT,
  status SMALLINT DEFAULT 1
);

-- Keep existing movies table for cinema
-- Use events table for theater/concerts/etc
```

---

## Implementation Priority

### Phase 1: **Fix Existing Modules** (1 week)
1. ✅ Add proper categories to `room_types` (accommodation_type + room_type)
2. ✅ Standardize `services_catalog.category` with ENUM or CHECK constraint
3. ✅ Add `parent_category` for better filtering
4. ✅ Update TypeORM entities

### Phase 2: **Add Venue/Facility Module** (2 weeks)
1. ✅ Create database schema (venues, venue_bookings)
2. ✅ Create NestJS service
3. ✅ Add booking logic with slot management
4. ✅ Add to gateway routing
5. ✅ Build vendor dashboard for venue management
6. ✅ Build user booking flow

### Phase 3: **Expand Entertainment** (1 week)
1. ✅ Add event_type to movies or create events table
2. ✅ Support theater/concert bookings
3. ✅ Add proper ticketing system

### Phase 4: **Advanced Features** (Ongoing)
1. Recurring bookings
2. Package deals
3. Equipment rentals
4. Memberships
5. Waitlists

---

## Summary - What You Need to Do

### Immediate Actions:

1. **Decide on Architecture:**
   - Option A: Expand rooms/services for sports (quick but messy)
   - Option B: Create new venues module (proper but more work)
   - **Recommendation:** Option B - sports facilities are fundamentally different

2. **Fix Category Fields:**
   - `room_types.category`: Change to structured types
   - `services_catalog.category`: Add constraints/enum
   - Add `parent_category` everywhere for grouping

3. **Add Missing Modules:**
   - ✅ Venues/Facilities (HIGH PRIORITY - currently nothing for sports)
   - ✅ Events/Theater (MEDIUM - expand movies module)
   - ✅ Equipment Rentals (LOW - can be JSONB add-on)

4. **Missing Categories to Support:**
   - Villas (entire property booking)
   - Sports facilities (hourly slots)
   - Theater/live events
   - Studios (yoga, dance, photography)
   - Conference/meeting rooms

### Your Business Model Needs:

| Category | Current Support | Missing | Priority |
|----------|----------------|---------|----------|
| Hotels | ✅ 80% | Proper types | Medium |
| Hostels | ✅ 90% | Gender dorms work | Low |
| Villas | ❌ 0% | Entire property model | High |
| Cricket Turf | ❌ 0% | Entire module | **CRITICAL** |
| Badminton | ❌ 0% | Entire module | **CRITICAL** |
| Plumber/Gardener | ✅ 80% | Category cleanup | Medium |
| Movies | ⚠️ 40% | No booking logic! | High |
| Theater | ❌ 0% | New module needed | Medium |

**Bottom Line:** You're missing an entire vertical (sports facilities) and need better categorization across the board.

---

**Next Steps:** Should I:
1. Create the Venues/Facilities module for sports?
2. Fix the category fields in existing modules?
3. Both?
