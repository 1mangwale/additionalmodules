# ⚠️ HARDCODED VALUES & DUPLICATES ANALYSIS

## Issues Found

### 1. 🔴 DUPLICATE DATABASE RECORDS

**Services**:
- "Wellness Therapy 2026" appears **2 times** (IDs: 8, 9)

**Venues**:
- "Badminton Court A" appears **2 times** (IDs: 2, 10)

### 2. 🔴 HARDCODED VALUES IN CODE

#### A. Working Hours (packages/shared/src/slot-generator.ts)
```typescript
// HARDCODED - Should be in database
case 'services':
  return { start: '09:00', end: '18:00', breaks: [{ start: '12:00', end: '13:00' }] };

case 'venues':
  return { start: '06:00', end: '22:00', breaks: [] };
```

**Problem**: Every store might have different working hours!

#### B. Peak Hour Pricing (apps/venues/src/svc.venues.ts)
```typescript
// HARDCODED - Should be in database
const pricingRules = {
    peak_hours: [
        { start: '06:00', end: '09:00', multiplier: 1.5 },  // Morning peak
        { start: '17:00', end: '22:00', multiplier: 1.5 },  // Evening peak
    ]
};
```

**Problem**: Different venues/stores may have different peak hours!

#### C. Peak Multiplier (apps/venues/src/svc.venues.ts)
```typescript
// HARDCODED multiplier
peak_price: basePrice * 1.5,
peak_hours: '6-9 AM, 5-10 PM'
```

**Problem**: Fixed 1.5x multiplier, should be configurable per venue!

---

## Recommended Solutions

### Solution 1: Remove Duplicates

```sql
-- Delete duplicate services
DELETE FROM services_catalog WHERE id IN (8, 9);

-- Delete duplicate venues (keep ID 2, delete 10)
DELETE FROM venue_types WHERE id = 10;
```

### Solution 2: Create Working Hours Table

```sql
CREATE TABLE IF NOT EXISTS store_working_hours (
    id SERIAL PRIMARY KEY,
    store_id BIGINT NOT NULL,
    module_type VARCHAR(50) NOT NULL, -- services, venues, movies, rooms
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    day_of_week INT, -- 0=Sunday, 6=Saturday, NULL=all days
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(store_id, module_type, day_of_week)
);

-- Default working hours for store_id=1
INSERT INTO store_working_hours (store_id, module_type, start_time, end_time, day_of_week) VALUES
    (1, 'services', '09:00', '18:00', NULL),
    (1, 'venues', '06:00', '22:00', NULL),
    (1, 'movies', '10:00', '23:59', NULL),
    (1, 'rooms', '14:00', '23:59', NULL);
```

### Solution 3: Create Peak Pricing Table

```sql
CREATE TABLE IF NOT EXISTS venue_peak_pricing (
    id SERIAL PRIMARY KEY,
    venue_type_id BIGINT REFERENCES venue_types(id) ON DELETE CASCADE,
    store_id BIGINT NOT NULL,
    peak_start_time TIME NOT NULL,
    peak_end_time TIME NOT NULL,
    price_multiplier NUMERIC(5,2) NOT NULL DEFAULT 1.5,
    day_of_week INT, -- NULL = all days, 0=Sunday, 6=Saturday
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes
CREATE INDEX idx_venue_peak_pricing_venue_type ON venue_peak_pricing(venue_type_id);
CREATE INDEX idx_venue_peak_pricing_store ON venue_peak_pricing(store_id);

-- Default peak hours for venue_type_id=2 (Badminton Court A)
INSERT INTO venue_peak_pricing (venue_type_id, store_id, peak_start_time, peak_end_time, price_multiplier, day_of_week) VALUES
    (2, 1, '06:00', '09:00', 1.5, NULL),  -- Morning peak
    (2, 1, '17:00', '22:00', 1.5, NULL);  -- Evening peak
```

### Solution 4: Create Store Breaks Table

```sql
CREATE TABLE IF NOT EXISTS store_breaks (
    id SERIAL PRIMARY KEY,
    store_id BIGINT NOT NULL,
    module_type VARCHAR(50) NOT NULL,
    break_start_time TIME NOT NULL,
    break_end_time TIME NOT NULL,
    break_name VARCHAR(100), -- 'Lunch', 'Maintenance', etc.
    is_active BOOLEAN DEFAULT true
);

-- Lunch break for services
INSERT INTO store_breaks (store_id, module_type, break_start_time, break_end_time, break_name) VALUES
    (1, 'services', '12:00', '13:00', 'Lunch Break');
```

---

## Impact Analysis

### Current Hardcoded Values:

| Component | Hardcoded Value | Impact |
|-----------|----------------|---------|
| Working Hours | 9 AM - 6 PM (services) | All stores forced to same schedule |
| Venue Hours | 6 AM - 10 PM | Cannot customize per location |
| Peak Pricing | 6-9 AM, 5-10 PM | Same for all venues |
| Peak Multiplier | 1.5x | Fixed across all venues |
| Lunch Break | 12-1 PM | All stores same break time |

### After Database-Driven:

| Component | Storage | Benefit |
|-----------|---------|---------|
| Working Hours | store_working_hours table | Per-store customization |
| Peak Pricing | venue_peak_pricing table | Per-venue custom hours |
| Peak Multiplier | price_multiplier column | Flexible pricing (1.2x, 1.5x, 2x) |
| Breaks | store_breaks table | Multiple breaks, custom times |

---

## Priority

### 🔴 CRITICAL (Fix Immediately)
1. Remove duplicate records
2. Add working hours to database

### 🟡 HIGH (Next Phase)
3. Add peak pricing to database
4. Add breaks configuration

### 🟢 MEDIUM (Future)
5. Day-of-week specific hours
6. Holiday pricing rules
7. Dynamic pricing based on demand

---

## Migration Script Needed

Would you like me to create:

1. **cleanup-duplicates.sql** - Remove duplicate records
2. **002-add-working-hours-tables.sql** - Create working hours tables
3. **003-add-peak-pricing-table.sql** - Create peak pricing configuration
4. Updated service code to read from database instead of hardcoded values

