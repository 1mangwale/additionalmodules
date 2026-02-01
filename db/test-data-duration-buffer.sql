-- ============================================================================
-- TEST DATA: Duration & Buffer Time System
-- Comprehensive dummy data for end-to-end testing
-- ============================================================================

-- Clean up existing test data (optional)
-- DELETE FROM service_appointments WHERE store_id = 1;
-- DELETE FROM venue_bookings WHERE store_id = 1;
-- DELETE FROM services_catalog WHERE store_id = 1;
-- DELETE FROM venue_types WHERE store_id = 1;

-- ============================================================================
-- 1. SERVICES TEST DATA
-- ============================================================================

-- Insert test services with various durations and buffers
INSERT INTO services_catalog (store_id, name, category, parent_category, pricing_model, base_price, visit_fee, at_customer_location, status, duration_min, buffer_time_min) VALUES
    (1, 'Haircut & Styling', 'salon', 'wellness', 'flat', 299.00, 0, false, 1, 30, 10),
    (1, 'AC Deep Cleaning', 'ac-repair', 'home-maintenance', 'dynamic', 899.00, 99.00, true, 1, 90, 20),
    (1, 'Plumbing Emergency', 'plumbing', 'home-repair', 'dynamic', 499.00, 149.00, true, 1, 60, 15),
    (1, 'Swedish Massage', 'massage', 'wellness', 'flat', 1299.00, 0, true, 1, 60, 15),
    (1, 'Deep Tissue Massage', 'massage', 'wellness', 'flat', 1599.00, 0, true, 1, 90, 15),
    (1, 'Bathroom Deep Cleaning', 'cleaning', 'home-maintenance', 'flat', 399.00, 0, true, 1, 45, 15),
    (1, 'Kitchen Cleaning', 'cleaning', 'home-maintenance', 'flat', 699.00, 0, true, 1, 90, 20),
    (1, 'Full House Painting', 'painting', 'home-maintenance', 'dynamic', 15000.00, 0, true, 1, 480, 60),
    (1, 'Electrical Wiring Check', 'electrical', 'home-repair', 'dynamic', 599.00, 99.00, true, 1, 90, 15),
    (1, 'Pest Control Service', 'pest-control', 'home-maintenance', 'flat', 1299.00, 0, true, 1, 120, 30)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 2. VENUES TEST DATA
-- ============================================================================

-- Insert test venues with various session durations and buffers
INSERT INTO venue_types (store_id, name, venue_category, hourly_rate_minor, description, facilities, status, session_duration_min, buffer_time_min) VALUES
    (1, 'Badminton Court A', 'badminton_court', 50000, 'Premium wooden floor badminton court', 'Changing rooms, Water cooler, Parking', 1, 60, 15),
    (1, 'Badminton Court B', 'badminton_court', 50000, 'Standard badminton court', 'Changing rooms, Parking', 1, 60, 15),
    (1, 'Football Turf - Full Size', 'football_turf', 120000, 'Full-size 11v11 football turf with floodlights', 'Changing rooms, Floodlights, Parking, Restrooms', 1, 90, 30),
    (1, 'Cricket Practice Net', 'cricket_turf', 40000, '4-lane cricket practice nets', 'Bowling machine, Changing rooms', 1, 60, 15),
    (1, 'Tennis Court Premium', 'tennis_court', 80000, 'Professional tennis court with night lights', 'Equipment rental, Parking', 1, 90, 20),
    (1, 'Basketball Court', 'basketball_court', 60000, 'Indoor basketball court', 'Changing rooms, Water station', 1, 90, 20),
    (1, 'Conference Room A', 'conference_room', 100000, 'Large conference room with projector', 'WiFi, Projector, Whiteboard, AC', 1, 120, 20),
    (1, 'Banquet Hall', 'banquet_hall', 500000, 'Large banquet hall for events', 'Kitchen, Tables, Chairs, AC, Stage', 1, 240, 60),
    (1, 'Swimming Pool Lanes', 'swimming_pool', 30000, '4 swimming lanes available', 'Changing rooms, Lockers, Showers', 1, 45, 15),
    (1, 'Gym Private Session', 'gym', 35000, 'Private gym session with trainer', 'All equipment, Trainer, Water', 1, 60, 15)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 3. CREATE SOME PRE-EXISTING APPOINTMENTS (for conflict testing)
-- ============================================================================

-- Services: Create appointment for tomorrow at 10:00 AM
INSERT INTO service_appointments (
    user_id, store_id, service_id, scheduled_for, 
    status, base_amount, visit_fee, tax_amount, final_amount, payment_mode
)
SELECT 
    90002,
    1,
    id,
    (CURRENT_DATE + INTERVAL '1 day' + TIME '10:00:00')::timestamptz,
    'confirmed',
    base_price,
    visit_fee,
    (base_price + visit_fee) * 0.05,
    (base_price + visit_fee) * 1.05,
    'prepaid'
FROM services_catalog
WHERE name = 'AC Deep Cleaning' AND store_id = 1
LIMIT 1;

-- Services: Create another appointment for tomorrow at 2:00 PM
INSERT INTO service_appointments (
    user_id, store_id, service_id, scheduled_for,
    status, base_amount, visit_fee, tax_amount, final_amount, payment_mode
)
SELECT 
    90002,
    1,
    id,
    (CURRENT_DATE + INTERVAL '1 day' + TIME '14:00:00')::timestamptz,
    'confirmed',
    base_price,
    visit_fee,
    (base_price + visit_fee) * 0.05,
    (base_price + visit_fee) * 1.05,
    'prepaid'
FROM services_catalog
WHERE name = 'Plumbing Emergency' AND store_id = 1
LIMIT 1;

-- ============================================================================
-- 4. CREATE VENUE SLOTS (for testing)
-- ============================================================================

-- Create slots for tomorrow for badminton court
INSERT INTO venue_slots (venue_type_id, store_id, date, hour_start, hour_end, capacity, booked, status, price_override_minor)
SELECT 
    id,
    1,
    CURRENT_DATE + INTERVAL '1 day',
    generate_series,
    generate_series + 1,
    1,
    0,
    'open',
    CASE 
        WHEN generate_series BETWEEN 6 AND 8 THEN 75000  -- Morning peak
        WHEN generate_series BETWEEN 17 AND 21 THEN 75000  -- Evening peak
        ELSE 50000  -- Off-peak
    END
FROM venue_types,
     generate_series(6, 21) AS generate_series
WHERE name = 'Badminton Court A' AND store_id = 1
LIMIT 16;

-- Create one booking for tomorrow at 7:00 AM (peak hour)
INSERT INTO venue_bookings (user_id, store_id, venue_type_id, slot_id, booking_date, hours, amount_minor, status, payment_mode)
SELECT 
    90002,
    1,
    vt.id,
    vs.id,
    CURRENT_DATE + INTERVAL '1 day',
    1,
    75000,
    'confirmed',
    'prepaid'
FROM venue_types vt
JOIN venue_slots vs ON vs.venue_type_id = vt.id
WHERE vt.name = 'Badminton Court A' 
  AND vt.store_id = 1
  AND vs.date = CURRENT_DATE + INTERVAL '1 day'
  AND vs.hour_start = 7
LIMIT 1;

-- Update the slot to mark it as booked
UPDATE venue_slots
SET booked = 1
WHERE venue_type_id IN (SELECT id FROM venue_types WHERE name = 'Badminton Court A' AND store_id = 1)
  AND date = CURRENT_DATE + INTERVAL '1 day'
  AND hour_start = 7;

-- ============================================================================
-- 5. VERIFICATION QUERIES
-- ============================================================================

-- Show inserted services with duration and buffer
SELECT 
    id, 
    name, 
    category,
    duration_min || ' min' as duration,
    buffer_time_min || ' min' as buffer,
    (duration_min + buffer_time_min) || ' min' as total_block_time,
    base_price::money as price
FROM services_catalog
WHERE store_id = 1
ORDER BY duration_min;

-- Show inserted venues with session duration and buffer
SELECT 
    id,
    name,
    venue_category,
    session_duration_min || ' min' as session_duration,
    buffer_time_min || ' min' as buffer,
    (session_duration_min + buffer_time_min) || ' min' as total_block_time,
    (hourly_rate_minor / 100.0)::money as hourly_rate
FROM venue_types
WHERE store_id = 1
ORDER BY session_duration_min;

-- Show existing appointments (for conflict testing)
SELECT 
    sa.id,
    sc.name as service_name,
    sc.duration_min,
    sc.buffer_time_min,
    sa.scheduled_for::timestamp as appointment_time,
    sa.status
FROM service_appointments sa
JOIN services_catalog sc ON sc.id = sa.service_id
WHERE sa.store_id = 1
  AND sa.scheduled_for::date >= CURRENT_DATE
ORDER BY sa.scheduled_for;

-- Show existing venue bookings
SELECT 
    vb.id,
    vt.name as venue_name,
    vt.session_duration_min,
    vt.buffer_time_min,
    vb.booking_date,
    vs.hour_start || ':00 - ' || vs.hour_end || ':00' as time_slot,
    vb.status
FROM venue_bookings vb
JOIN venue_types vt ON vt.id = vb.venue_type_id
JOIN venue_slots vs ON vs.id = vb.slot_id
WHERE vb.store_id = 1
  AND vb.booking_date >= CURRENT_DATE
ORDER BY vb.booking_date, vs.hour_start;

-- Show booking configuration
SELECT 
    module_name,
    default_duration_min || ' min' as default_duration,
    default_buffer_min || ' min' as default_buffer,
    min_duration_min || ' min' as min_duration,
    max_duration_min || ' min' as max_duration,
    duration_increment_min || ' min' as increment
FROM booking_config
ORDER BY module_name;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '═════════════════════════════════════════════════════════════';
    RAISE NOTICE '✅ TEST DATA INSERTED SUCCESSFULLY!';
    RAISE NOTICE '═════════════════════════════════════════════════════════════';
    RAISE NOTICE '';
    RAISE NOTICE '📊 SERVICES: 10 services with varying durations (30-480 min)';
    RAISE NOTICE '📊 VENUES: 10 venues with varying sessions (45-240 min)';
    RAISE NOTICE '📊 APPOINTMENTS: 2 service appointments for conflict testing';
    RAISE NOTICE '📊 BOOKINGS: 1 venue booking for conflict testing';
    RAISE NOTICE '📊 SLOTS: 16 venue slots with peak pricing';
    RAISE NOTICE '';
    RAISE NOTICE '🧪 READY FOR TESTING!';
    RAISE NOTICE '';
    RAISE NOTICE '🔗 Test URLs:';
    RAISE NOTICE '   Services: http://localhost:4002/docs';
    RAISE NOTICE '   Venues: http://localhost:4007/docs';
    RAISE NOTICE '';
    RAISE NOTICE '📝 Next: Run API tests with the data above';
    RAISE NOTICE '═════════════════════════════════════════════════════════════';
END $$;
