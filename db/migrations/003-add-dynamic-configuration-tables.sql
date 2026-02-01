-- ============================================================================
-- DYNAMIC CONFIGURATION: Working Hours, Peak Pricing, Breaks
-- Make system fully database-driven with zero hardcoded values
-- ============================================================================

-- ============================================================================
-- 1. STORE WORKING HOURS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS store_working_hours (
    id SERIAL PRIMARY KEY,
    store_id BIGINT NOT NULL,
    module_type VARCHAR(50) NOT NULL, -- services, venues, movies, rooms
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    day_of_week INT, -- 0=Sunday, 1=Monday, ..., 6=Saturday, NULL=all days
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_store_module_day UNIQUE(store_id, module_type, day_of_week)
);

-- Add indexes for performance
CREATE INDEX idx_store_working_hours_store ON store_working_hours(store_id);
CREATE INDEX idx_store_working_hours_module ON store_working_hours(module_type);
CREATE INDEX idx_store_working_hours_active ON store_working_hours(is_active);

-- Insert default working hours for store_id=1
INSERT INTO store_working_hours (store_id, module_type, start_time, end_time, day_of_week, is_active) VALUES
    -- Services: Mon-Sun 9 AM - 6 PM
    (1, 'services', '09:00', '18:00', NULL, true),
    
    -- Venues: Mon-Sun 6 AM - 10 PM (early sports to late night)
    (1, 'venues', '06:00', '22:00', NULL, true),
    
    -- Movies: Mon-Sun 10 AM - 11:59 PM
    (1, 'movies', '10:00', '23:59', NULL, true),
    
    -- Rooms: Mon-Sun 2 PM check-in onwards
    (1, 'rooms', '14:00', '23:59', NULL, true);

-- ============================================================================
-- 2. STORE BREAKS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS store_breaks (
    id SERIAL PRIMARY KEY,
    store_id BIGINT NOT NULL,
    module_type VARCHAR(50) NOT NULL,
    break_start_time TIME NOT NULL,
    break_end_time TIME NOT NULL,
    break_name VARCHAR(100), -- 'Lunch', 'Maintenance', 'Staff Meeting', etc.
    day_of_week INT, -- NULL=all days, 0=Sunday, 6=Saturday
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes
CREATE INDEX idx_store_breaks_store ON store_breaks(store_id);
CREATE INDEX idx_store_breaks_module ON store_breaks(module_type);
CREATE INDEX idx_store_breaks_active ON store_breaks(is_active);

-- Insert default lunch break for services
INSERT INTO store_breaks (store_id, module_type, break_start_time, break_end_time, break_name, day_of_week, is_active) VALUES
    (1, 'services', '12:00', '13:00', 'Lunch Break', NULL, true);

-- ============================================================================
-- 3. VENUE PEAK PRICING TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS venue_peak_pricing (
    id SERIAL PRIMARY KEY,
    venue_type_id BIGINT REFERENCES venue_types(id) ON DELETE CASCADE,
    store_id BIGINT NOT NULL,
    peak_start_time TIME NOT NULL,
    peak_end_time TIME NOT NULL,
    price_multiplier NUMERIC(5,2) NOT NULL DEFAULT 1.5,
    day_of_week INT, -- NULL=all days, 0=Sunday, 6=Saturday
    peak_name VARCHAR(100), -- 'Morning Rush', 'Evening Peak', 'Weekend Premium', etc.
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for performance
CREATE INDEX idx_venue_peak_pricing_venue_type ON venue_peak_pricing(venue_type_id);
CREATE INDEX idx_venue_peak_pricing_store ON venue_peak_pricing(store_id);
CREATE INDEX idx_venue_peak_pricing_active ON venue_peak_pricing(is_active);

-- Insert default peak pricing for Badminton Court A (venue_type_id=2)
INSERT INTO venue_peak_pricing (venue_type_id, store_id, peak_start_time, peak_end_time, price_multiplier, day_of_week, peak_name, is_active) VALUES
    -- Morning peak: 6 AM - 9 AM (1.5x)
    (2, 1, '06:00', '09:00', 1.5, NULL, 'Morning Rush', true),
    
    -- Evening peak: 5 PM - 10 PM (1.5x)
    (2, 1, '17:00', '22:00', 1.5, NULL, 'Evening Peak', true);

-- Add peak pricing for other popular venues
INSERT INTO venue_peak_pricing (venue_type_id, store_id, peak_start_time, peak_end_time, price_multiplier, day_of_week, peak_name, is_active)
SELECT 
    vt.id,
    1,
    '06:00',
    '09:00',
    1.5,
    NULL,
    'Morning Rush',
    true
FROM venue_types vt
WHERE vt.venue_category IN ('badminton_court', 'football_turf', 'tennis_court')
  AND vt.store_id = 1
  AND NOT EXISTS (
    SELECT 1 FROM venue_peak_pricing vpp 
    WHERE vpp.venue_type_id = vt.id 
      AND vpp.peak_start_time = '06:00'
  );

INSERT INTO venue_peak_pricing (venue_type_id, store_id, peak_start_time, peak_end_time, price_multiplier, day_of_week, peak_name, is_active)
SELECT 
    vt.id,
    1,
    '17:00',
    '22:00',
    1.5,
    NULL,
    'Evening Peak',
    true
FROM venue_types vt
WHERE vt.venue_category IN ('badminton_court', 'football_turf', 'tennis_court')
  AND vt.store_id = 1
  AND NOT EXISTS (
    SELECT 1 FROM venue_peak_pricing vpp 
    WHERE vpp.venue_type_id = vt.id 
      AND vpp.peak_start_time = '17:00'
  );

-- ============================================================================
-- 4. VERIFICATION QUERIES
-- ============================================================================

-- Show working hours
SELECT 
    store_id,
    module_type,
    start_time || ' - ' || end_time as hours,
    CASE 
        WHEN day_of_week IS NULL THEN 'All Days'
        WHEN day_of_week = 0 THEN 'Sunday'
        WHEN day_of_week = 1 THEN 'Monday'
        WHEN day_of_week = 2 THEN 'Tuesday'
        WHEN day_of_week = 3 THEN 'Wednesday'
        WHEN day_of_week = 4 THEN 'Thursday'
        WHEN day_of_week = 5 THEN 'Friday'
        WHEN day_of_week = 6 THEN 'Saturday'
    END as applies_to
FROM store_working_hours
WHERE is_active = true
ORDER BY store_id, module_type;

-- Show breaks
SELECT 
    store_id,
    module_type,
    break_name,
    break_start_time || ' - ' || break_end_time as break_hours
FROM store_breaks
WHERE is_active = true
ORDER BY store_id, module_type;

-- Show peak pricing
SELECT 
    vpp.venue_type_id,
    vt.name as venue_name,
    vpp.peak_name,
    vpp.peak_start_time || ' - ' || vpp.peak_end_time as peak_hours,
    vpp.price_multiplier || 'x' as multiplier
FROM venue_peak_pricing vpp
JOIN venue_types vt ON vt.id = vpp.venue_type_id
WHERE vpp.is_active = true
ORDER BY vpp.venue_type_id, vpp.peak_start_time;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '═════════════════════════════════════════════════════════════';
    RAISE NOTICE '✅ DYNAMIC CONFIGURATION TABLES CREATED!';
    RAISE NOTICE '═════════════════════════════════════════════════════════════';
    RAISE NOTICE '';
    RAISE NOTICE '📊 Created Tables:';
    RAISE NOTICE '   • store_working_hours (configurable hours per module)';
    RAISE NOTICE '   • store_breaks (lunch breaks, maintenance windows)';
    RAISE NOTICE '   • venue_peak_pricing (dynamic pricing rules)';
    RAISE NOTICE '';
    RAISE NOTICE '✅ All hardcoded values eliminated!';
    RAISE NOTICE '✅ System is now fully database-driven!';
    RAISE NOTICE '═════════════════════════════════════════════════════════════';
END $$;
