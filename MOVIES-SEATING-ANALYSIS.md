# 🎭 MOVIES MODULE - SEATING LAYOUT ANALYSIS

## ❌ Current Implementation Gaps

### What's Missing:
1. **No Seating Layout Schema** - Just a simple `seat_count` field
2. **No Section/Row Configuration** - Can't define A-J rows with different pricing
3. **No Visual Layout** - No way to represent gaps, aisles, VIP sections
4. **No Seat-Level Pricing** - Only base_price per showtime, not per seat/section
5. **No Seat Blocking** - Can't mark specific seats as unavailable
6. **No Real-time Availability** - Just a counter, no actual seat map

### Current Schema Problems:

```sql
-- Current (TOO SIMPLE):
CREATE TABLE screens (
  id BIGSERIAL PRIMARY KEY,
  name TEXT,
  seat_count INT DEFAULT 100  -- ❌ Just a number!
);

-- Booking just stores seat numbers as array:
seat_numbers JSONB  -- ['A1', 'A2'] but no validation!
```

## ✅ What Real Theaters Need

### 1. Seating Layout Template System

**Screen Layout Structure:**
```json
{
  "screen_id": 1,
  "layout_name": "Standard Multiplex",
  "sections": [
    {
      "section_id": "regular",
      "name": "Regular Seats",
      "price_multiplier": 1.0,
      "rows": [
        {"row": "A", "seats": 10, "start_number": 1},
        {"row": "B", "seats": 12, "start_number": 1},
        {"row": "C", "seats": 12, "start_number": 1}
      ]
    },
    {
      "section_id": "aisle",
      "type": "gap",
      "height": 2  // 2 rows of space
    },
    {
      "section_id": "premium",
      "name": "Premium Seats",
      "price_multiplier": 1.5,
      "rows": [
        {"row": "D", "seats": 14, "start_number": 1},
        {"row": "E", "seats": 14, "start_number": 1}
      ]
    },
    {
      "section_id": "vip",
      "name": "VIP Recliners",
      "price_multiplier": 2.0,
      "rows": [
        {"row": "F", "seats": 8, "start_number": 1, "seat_type": "recliner"}
      ]
    }
  ],
  "blocked_seats": ["A1", "A10"],  // wheelchair, technical issues
  "metadata": {
    "total_seats": 70,
    "screen_size": "large",
    "has_3d": true
  }
}
```

### 2. Enhanced Database Schema

```sql
-- Enhanced screens table with layout
CREATE TABLE screens (
  id BIGSERIAL PRIMARY KEY,
  store_id BIGINT NOT NULL,
  name TEXT NOT NULL,
  seat_count INT NOT NULL DEFAULT 0,
  layout_config JSONB NOT NULL,  -- ✅ Full layout template
  metadata JSONB DEFAULT '{}'
);

-- Seat sections for pricing
CREATE TABLE screen_sections (
  id BIGSERIAL PRIMARY KEY,
  screen_id BIGINT NOT NULL,
  section_id TEXT NOT NULL,
  name TEXT NOT NULL,
  price_multiplier NUMERIC(5,2) DEFAULT 1.0,
  row_start TEXT,  -- 'A'
  row_end TEXT,    -- 'C'
  CONSTRAINT fk_sections_screen FOREIGN KEY (screen_id) 
    REFERENCES screens (id) ON DELETE CASCADE
);

-- Individual seat tracking (for real-time availability)
CREATE TABLE screen_seats (
  id BIGSERIAL PRIMARY KEY,
  screen_id BIGINT NOT NULL,
  section_id TEXT NOT NULL,
  row_label TEXT NOT NULL,  -- 'A', 'B', 'C'
  seat_number INT NOT NULL,
  seat_label TEXT NOT NULL,  -- 'A1', 'A2'
  seat_type TEXT DEFAULT 'standard',  -- 'standard', 'recliner', 'wheelchair'
  is_blocked BOOLEAN DEFAULT FALSE,
  UNIQUE(screen_id, seat_label),
  CONSTRAINT fk_seats_screen FOREIGN KEY (screen_id) 
    REFERENCES screens (id) ON DELETE CASCADE
);

-- Seat availability per showtime
CREATE TABLE showtime_seats (
  id BIGSERIAL PRIMARY KEY,
  showtime_id BIGINT NOT NULL,
  seat_id BIGINT NOT NULL,
  status VARCHAR(20) DEFAULT 'available',  -- 'available', 'booked', 'reserved', 'blocked'
  booking_id UUID,
  reserved_at TIMESTAMPTZ,
  reserved_until TIMESTAMPTZ,  -- Temporary 10-min hold
  CONSTRAINT fk_showtime_seats_showtime FOREIGN KEY (showtime_id) 
    REFERENCES showtimes (id) ON DELETE CASCADE,
  CONSTRAINT fk_showtime_seats_seat FOREIGN KEY (seat_id) 
    REFERENCES screen_seats (id) ON DELETE CASCADE,
  UNIQUE(showtime_id, seat_id)
);

-- Enhanced showtimes with section pricing
CREATE TABLE showtime_pricing (
  id BIGSERIAL PRIMARY KEY,
  showtime_id BIGINT NOT NULL,
  section_id TEXT NOT NULL,
  price_minor BIGINT NOT NULL,  -- Per seat in this section
  CONSTRAINT fk_pricing_showtime FOREIGN KEY (showtime_id) 
    REFERENCES showtimes (id) ON DELETE CASCADE
);
```

### 3. API Endpoints Needed

```typescript
// Vendor APIs
POST /vendor/movies/screens/:id/layout
  - Upload seating layout template
  - Validate and generate seat map

GET /vendor/movies/screens/:id/preview
  - Visual preview of layout

POST /vendor/movies/screens/:id/sections
  - Define pricing sections

POST /vendor/movies/screens/:id/seats/block
  - Block specific seats (maintenance, wheelchair)

// User APIs
GET /movies/showtimes/:id/seats
  - Get full seat map with availability
  - Response: Layout with real-time status

POST /movies/seats/reserve
  - Temporarily reserve seats (10 min)
  - Prevent double-booking

POST /movies/book
  - Book reserved seats
  - Calculate price based on section
```

## 📋 Enhanced Implementation Plan

### Phase 1: Database Schema (High Priority)
1. ✅ Create migration `003_movie_seating_enhanced.sql`
2. Add `layout_config` JSONB to screens
3. Create `screen_sections` table
4. Create `screen_seats` table  
5. Create `showtime_seats` table
6. Create `showtime_pricing` table

### Phase 2: Layout Builder Service
1. `LayoutBuilderService` - Parse and validate templates
2. Auto-generate seats from template
3. Calculate section pricing
4. Visual layout renderer (JSON → UI coordinates)

### Phase 3: Booking Logic Updates
1. Real-time seat availability check
2. Seat reservation (10-min hold)
3. Section-based pricing
4. Seat validation against layout

### Phase 4: Vendor Tools
1. Visual layout editor UI
2. Drag-and-drop seat designer
3. Section pricing configuration
4. Bulk seat operations

## 🎯 Example: Real Theater Layout

```typescript
const pvr_screen_1 = {
  screen_id: 1,
  name: "PVR Screen 1",
  layout: {
    sections: [
      // Regular seats - Back rows
      {
        section_id: "regular_back",
        name: "Regular (Back)",
        rows: ["A", "B", "C"],
        seats_per_row: 18,
        price_multiplier: 1.0,
        color: "#90EE90"
      },
      // Aisle gap
      {
        type: "gap",
        height: "1.5m"
      },
      // Regular seats - Front rows
      {
        section_id: "regular_front",
        name: "Regular (Front)",
        rows: ["D", "E", "F"],
        seats_per_row: 20,
        price_multiplier: 1.0,
        color: "#90EE90"
      },
      // Aisle gap
      {
        type: "gap",
        height: "2m"
      },
      // Premium seats
      {
        section_id: "premium",
        name: "Premium",
        rows: ["G", "H"],
        seats_per_row: 16,
        price_multiplier: 1.5,
        color: "#FFD700"
      },
      // Aisle gap
      {
        type: "gap",
        height: "3m"
      },
      // Gold recliners
      {
        section_id: "gold",
        name: "Gold Recliners",
        rows: ["J"],
        seats_per_row: 12,
        price_multiplier: 2.5,
        seat_type: "recliner",
        color: "#FF6B6B"
      }
    ],
    total_seats: 130,
    blocked_seats: ["A1", "A18"],  // Wheelchair accessible
    metadata: {
      screen_type: "IMAX",
      sound_system: "Dolby Atmos",
      has_3d: true
    }
  }
};

// Pricing for a showtime:
const pricing = {
  showtime_id: 101,
  base_price: 200,  // ₹200
  sections: [
    { section: "regular_back", price: 200 },
    { section: "regular_front", price: 200 },
    { section: "premium", price: 300 },
    { section: "gold", price: 500 }
  ]
};
```

## 🚨 Current vs Required

| Feature | Current | Required |
|---------|---------|----------|
| Seat Layout | ❌ Just count | ✅ JSONB template |
| Row Config | ❌ None | ✅ A-Z with gaps |
| Section Pricing | ❌ Only base | ✅ Per section |
| Real-time Availability | ❌ Just counter | ✅ Per-seat status |
| Seat Blocking | ❌ No | ✅ Yes |
| Visual Preview | ❌ No | ✅ Yes |
| Temporary Reservation | ❌ No | ✅ 10-min hold |

## 💡 Recommendation

**Current implementation is MVP-level.** For production theater management, you need:

1. **Immediate**: Add `layout_config` JSONB to screens table
2. **Short-term**: Implement seat-level tracking with `screen_seats` and `showtime_seats`
3. **Medium-term**: Build visual layout editor for vendors
4. **Long-term**: Real-time seat map with WebSocket updates

**Should we implement the enhanced theater seating system?**

This will require:
- New database migration (6 tables)
- Enhanced MoviesService with layout logic
- New vendor APIs for layout management
- Frontend seat map component
- ~2-3 days of development

Let me know if you want me to proceed with the full implementation!
