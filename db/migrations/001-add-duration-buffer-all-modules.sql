-- ============================================================================
-- MIGRATION: Add Duration and Buffer Time to All Booking Modules
-- Purpose: Enable smart slot generation and prevent booking conflicts
-- Date: 2026-02-01
-- ============================================================================

-- ============================================================================
-- 1. SERVICES MODULE
-- ============================================================================

-- Add buffer_time_min to services_catalog
-- This represents the gap needed between appointments (travel, cleanup, etc.)
ALTER TABLE services_catalog 
ADD COLUMN IF NOT EXISTS buffer_time_min INTEGER DEFAULT 15;

-- Set sensible defaults based on service category
UPDATE services_catalog 
SET buffer_time_min = 10 
WHERE category IN ('salon', 'barber', 'quick-fix') 
AND buffer_time_min IS NULL;

UPDATE services_catalog 
SET buffer_time_min = 15 
WHERE category IN ('plumbing', 'electrical', 'carpentry', 'massage') 
AND buffer_time_min IS NULL;

UPDATE services_catalog 
SET buffer_time_min = 20 
WHERE category IN ('ac-repair', 'appliance-repair', 'cleaning') 
AND buffer_time_min IS NULL;

UPDATE services_catalog 
SET buffer_time_min = 30 
WHERE category IN ('painting', 'deep-cleaning', 'pest-control') 
AND buffer_time_min IS NULL;

-- Ensure duration_min has values for all services
UPDATE services_catalog 
SET duration_min = 30 
WHERE duration_min IS NULL AND category IN ('salon', 'barber', 'quick-fix');

UPDATE services_catalog 
SET duration_min = 60 
WHERE duration_min IS NULL AND category IN ('plumbing', 'electrical', 'carpentry', 'massage');

UPDATE services_catalog 
SET duration_min = 90 
WHERE duration_min IS NULL AND category IN ('ac-repair', 'appliance-repair', 'cleaning');

UPDATE services_catalog 
SET duration_min = 120 
WHERE duration_min IS NULL AND category IN ('painting', 'deep-cleaning', 'pest-control');

COMMENT ON COLUMN services_catalog.buffer_time_min IS 'Gap time (minutes) needed between appointments for travel, cleanup, or preparation';

-- ============================================================================
-- 2. VENUES MODULE
-- ============================================================================

-- Add session_duration_min to venue_types
-- Represents the standard session length for this venue type
ALTER TABLE venue_types 
ADD COLUMN IF NOT EXISTS session_duration_min INTEGER DEFAULT 60;

-- Add buffer_time_min to venue_types
-- Represents time needed for court/field cleanup and maintenance
ALTER TABLE venue_types 
ADD COLUMN IF NOT EXISTS buffer_time_min INTEGER DEFAULT 15;

-- Set defaults based on venue category
UPDATE venue_types 
SET session_duration_min = 60, buffer_time_min = 15 
WHERE venue_category IN ('badminton_court', 'table_tennis', 'squash_court');

UPDATE venue_types 
SET session_duration_min = 90, buffer_time_min = 20 
WHERE venue_category IN ('tennis_court', 'basketball_court', 'volleyball_court');

UPDATE venue_types 
SET session_duration_min = 90, buffer_time_min = 30 
WHERE venue_category IN ('cricket_turf', 'football_turf', 'hockey_field');

UPDATE venue_types 
SET session_duration_min = 120, buffer_time_min = 20 
WHERE venue_category IN ('conference_room', 'banquet_hall', 'event_space');

UPDATE venue_types 
SET session_duration_min = 45, buffer_time_min = 15 
WHERE venue_category IN ('swimming_pool', 'gym', 'fitness_studio');

-- Add variable pricing support to venue_slots
-- This allows peak/off-peak pricing per slot
ALTER TABLE venue_slots 
ADD COLUMN IF NOT EXISTS price_override_minor BIGINT NULL;

COMMENT ON COLUMN venue_types.session_duration_min IS 'Standard session duration (minutes) for this venue type';
COMMENT ON COLUMN venue_types.buffer_time_min IS 'Cleanup and maintenance time (minutes) needed between sessions';
COMMENT ON COLUMN venue_slots.price_override_minor IS 'Override price for this specific slot (peak/off-peak pricing)';

-- ============================================================================
-- 3. MOVIES MODULE
-- ============================================================================

-- Add buffer_time_min to movies table
-- Represents time needed for theater cleaning and audience changeover
ALTER TABLE movies 
ADD COLUMN IF NOT EXISTS buffer_time_min INTEGER DEFAULT 20;

-- Set defaults based on movie duration (longer movies may need more cleanup)
UPDATE movies 
SET buffer_time_min = 15 
WHERE duration_min <= 90;

UPDATE movies 
SET buffer_time_min = 20 
WHERE duration_min > 90 AND duration_min <= 150;

UPDATE movies 
SET buffer_time_min = 25 
WHERE duration_min > 150 AND duration_min <= 180;

UPDATE movies 
SET buffer_time_min = 30 
WHERE duration_min > 180;

COMMENT ON COLUMN movies.buffer_time_min IS 'Theater cleanup and changeover time (minutes) needed between shows';

-- ============================================================================
-- 4. ROOMS MODULE
-- ============================================================================

-- Add buffer_hours to room_types
-- Represents turnaround time for cleaning between guest checkouts and checkins
ALTER TABLE room_types 
ADD COLUMN IF NOT EXISTS buffer_hours INTEGER DEFAULT 3;

-- Set defaults based on accommodation type
UPDATE room_types 
SET buffer_hours = 2 
WHERE accommodation_type = 'hostel';

UPDATE room_types 
SET buffer_hours = 3 
WHERE accommodation_type IN ('hotel', 'guesthouse');

UPDATE room_types 
SET buffer_hours = 4 
WHERE accommodation_type IN ('villa', 'farmhouse', 'entire-property');

UPDATE room_types 
SET buffer_hours = 6 
WHERE accommodation_type IN ('luxury-villa', 'resort', 'palace');

-- Ensure checkin and checkout times are set
UPDATE room_types 
SET checkin_time = '14:00:00' 
WHERE checkin_time IS NULL;

UPDATE room_types 
SET checkout_time = '11:00:00' 
WHERE checkout_time IS NULL;

COMMENT ON COLUMN room_types.buffer_hours IS 'Turnaround time (hours) needed for deep cleaning between guest stays';

-- ============================================================================
-- 5. CREATE CONFIGURATION TABLE (Optional but recommended)
-- ============================================================================

-- Global configuration for timing defaults
CREATE TABLE IF NOT EXISTS booking_config (
    id SERIAL PRIMARY KEY,
    module_name VARCHAR(50) NOT NULL UNIQUE, -- 'services', 'venues', 'movies', 'rooms'
    default_duration_min INTEGER,
    default_buffer_min INTEGER,
    min_duration_min INTEGER,
    max_duration_min INTEGER,
    duration_increment_min INTEGER, -- e.g., 15, 30, 60 for slot granularity
    config_json JSONB, -- Additional flexible configuration
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Insert defaults
INSERT INTO booking_config (module_name, default_duration_min, default_buffer_min, min_duration_min, max_duration_min, duration_increment_min) VALUES
    ('services', 60, 15, 15, 480, 15),
    ('venues', 60, 15, 30, 480, 30),
    ('movies', 120, 20, 60, 240, 5),
    ('rooms', 1440, 180, 1440, 43200, 1440) -- 24 hours duration, 3 hours buffer
ON CONFLICT (module_name) DO NOTHING;

COMMENT ON TABLE booking_config IS 'Global configuration for booking durations and buffer times across all modules';

-- ============================================================================
-- 6. ADD INDEXES FOR PERFORMANCE
-- ============================================================================

-- Services
CREATE INDEX IF NOT EXISTS idx_services_catalog_duration_buffer 
ON services_catalog(duration_min, buffer_time_min) WHERE status = 1;

-- Venues
CREATE INDEX IF NOT EXISTS idx_venue_types_duration_buffer 
ON venue_types(session_duration_min, buffer_time_min) WHERE status = 1;

CREATE INDEX IF NOT EXISTS idx_venue_slots_datetime 
ON venue_slots(date, hour_start, hour_end) WHERE status = 'open';

-- Movies
CREATE INDEX IF NOT EXISTS idx_movies_duration_buffer 
ON movies(duration_min, buffer_time_min) WHERE status = 1;

-- Rooms
CREATE INDEX IF NOT EXISTS idx_room_types_checkin_checkout 
ON room_types(checkin_time, checkout_time, buffer_hours) WHERE status = 1;

-- ============================================================================
-- 7. DATA VALIDATION CONSTRAINTS
-- ============================================================================

-- Ensure durations and buffers are positive
ALTER TABLE services_catalog 
ADD CONSTRAINT chk_services_duration_positive 
CHECK (duration_min IS NULL OR duration_min > 0);

ALTER TABLE services_catalog 
ADD CONSTRAINT chk_services_buffer_positive 
CHECK (buffer_time_min >= 0);

ALTER TABLE venue_types 
ADD CONSTRAINT chk_venue_duration_positive 
CHECK (session_duration_min > 0);

ALTER TABLE venue_types 
ADD CONSTRAINT chk_venue_buffer_positive 
CHECK (buffer_time_min >= 0);

ALTER TABLE movies 
ADD CONSTRAINT chk_movie_duration_positive 
CHECK (duration_min > 0);

ALTER TABLE movies 
ADD CONSTRAINT chk_movie_buffer_positive 
CHECK (buffer_time_min >= 0);

ALTER TABLE room_types 
ADD CONSTRAINT chk_room_buffer_positive 
CHECK (buffer_hours >= 0);

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Verify the changes
DO $$
BEGIN
    RAISE NOTICE '✅ Migration Complete: Duration and Buffer fields added to all modules';
    RAISE NOTICE '📊 Services: duration_min, buffer_time_min';
    RAISE NOTICE '📊 Venues: session_duration_min, buffer_time_min, price_override_minor';
    RAISE NOTICE '📊 Movies: buffer_time_min (duration_min already existed)';
    RAISE NOTICE '📊 Rooms: buffer_hours';
    RAISE NOTICE '📊 Config: booking_config table created for global defaults';
    RAISE NOTICE '⚡ Indexes created for performance optimization';
    RAISE NOTICE '✓ Constraints added for data validation';
END $$;
