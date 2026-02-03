-- Create restaurants and table booking tables
-- Migration: 004_restaurants_and_tables.sql

-- Drop existing tables if they exist
DROP TABLE IF EXISTS table_bookings CASCADE;
DROP TABLE IF EXISTS table_types CASCADE;
DROP TABLE IF EXISTS restaurants CASCADE;

-- Restaurants table
CREATE TABLE restaurants (
  id BIGSERIAL PRIMARY KEY,
  store_id BIGINT NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  cuisine_type VARCHAR(100), -- Italian, Chinese, Indian, etc.
  total_tables INT DEFAULT 0,
  total_capacity INT DEFAULT 0,
  status VARCHAR(20) DEFAULT 'active', -- active|inactive
  metadata JSONB, -- opening hours, contact info, etc.
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_restaurants_store ON restaurants(store_id);
CREATE INDEX idx_restaurants_cuisine ON restaurants(cuisine_type);
CREATE INDEX idx_restaurants_status ON restaurants(status);

-- Table types table
CREATE TABLE table_types (
  id BIGSERIAL PRIMARY KEY,
  restaurant_id BIGINT NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  table_number VARCHAR(100) NOT NULL, -- T1, T2, VIP-1, etc.
  capacity INT NOT NULL, -- number of seats
  location VARCHAR(50), -- window, patio, indoor, private-room, etc.
  table_type VARCHAR(50) DEFAULT 'standard', -- standard, vip, private
  status VARCHAR(20) DEFAULT 'available', -- available|occupied|reserved|maintenance
  metadata JSONB, -- special features like "has view", "near kitchen", etc.
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_table_types_restaurant ON table_types(restaurant_id);
CREATE INDEX idx_table_types_status ON table_types(status);
CREATE INDEX idx_table_types_capacity ON table_types(capacity);

-- Table bookings table
CREATE TABLE table_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id BIGINT NOT NULL,
  store_id BIGINT NOT NULL,
  restaurant_id BIGINT NOT NULL REFERENCES restaurants(id),
  table_type_id BIGINT NOT NULL REFERENCES table_types(id),
  booking_date DATE NOT NULL,
  booking_time TIME NOT NULL,
  party_size INT NOT NULL, -- number of guests
  duration_minutes INT DEFAULT 120, -- typical dining duration
  customer_name VARCHAR(255),
  customer_phone VARCHAR(20),
  special_requests TEXT, -- birthday, anniversary, dietary restrictions, etc.
  amount_minor BIGINT DEFAULT 0, -- booking fee or deposit in minor units
  status VARCHAR(20) DEFAULT 'pending', -- pending|confirmed|seated|completed|cancelled|no-show
  payment_mode VARCHAR(20), -- prepaid, at-venue
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_table_bookings_user ON table_bookings(user_id);
CREATE INDEX idx_table_bookings_store ON table_bookings(store_id);
CREATE INDEX idx_table_bookings_restaurant ON table_bookings(restaurant_id);
CREATE INDEX idx_table_bookings_table ON table_bookings(table_type_id);
CREATE INDEX idx_table_bookings_date ON table_bookings(booking_date);
CREATE INDEX idx_table_bookings_status ON table_bookings(status);
CREATE INDEX idx_table_bookings_datetime ON table_bookings(booking_date, booking_time);

-- Insert sample restaurant data
INSERT INTO restaurants (store_id, name, description, cuisine_type, total_tables, total_capacity, status) VALUES
(1, 'The Grand Bistro', 'Fine dining experience with international cuisine', 'International', 15, 60, 'active'),
(1, 'Spice Garden', 'Authentic Indian cuisine in a cozy setting', 'Indian', 12, 48, 'active'),
(1, 'Bella Italia', 'Traditional Italian restaurant with wood-fired pizzas', 'Italian', 10, 40, 'active'),
(1, 'Sushi Master', 'Premium Japanese sushi and sashimi', 'Japanese', 8, 32, 'active'),
(1, 'The Dragon Wok', 'Classic Chinese dishes and dim sum', 'Chinese', 14, 56, 'active');

-- Insert sample table data for The Grand Bistro (restaurant_id: 1)
INSERT INTO table_types (restaurant_id, table_number, capacity, location, table_type, status) VALUES
-- Standard tables
(1, 'T1', 2, 'window', 'standard', 'available'),
(1, 'T2', 2, 'window', 'standard', 'available'),
(1, 'T3', 4, 'indoor', 'standard', 'available'),
(1, 'T4', 4, 'indoor', 'standard', 'available'),
(1, 'T5', 4, 'indoor', 'standard', 'available'),
(1, 'T6', 6, 'indoor', 'standard', 'available'),
(1, 'T7', 6, 'indoor', 'standard', 'available'),
-- Patio tables
(1, 'P1', 4, 'patio', 'standard', 'available'),
(1, 'P2', 4, 'patio', 'standard', 'available'),
(1, 'P3', 4, 'patio', 'standard', 'available'),
-- VIP tables
(1, 'VIP1', 8, 'private-room', 'vip', 'available'),
(1, 'VIP2', 10, 'private-room', 'vip', 'available'),
(1, 'VIP3', 12, 'private-room', 'vip', 'available');

-- Insert sample table data for Spice Garden (restaurant_id: 2)
INSERT INTO table_types (restaurant_id, table_number, capacity, location, table_type, status) VALUES
(2, 'T1', 2, 'window', 'standard', 'available'),
(2, 'T2', 2, 'window', 'standard', 'available'),
(2, 'T3', 4, 'indoor', 'standard', 'available'),
(2, 'T4', 4, 'indoor', 'standard', 'available'),
(2, 'T5', 4, 'indoor', 'standard', 'available'),
(2, 'T6', 4, 'indoor', 'standard', 'available'),
(2, 'T7', 6, 'indoor', 'standard', 'available'),
(2, 'T8', 6, 'indoor', 'standard', 'available'),
(2, 'VIP1', 8, 'private-room', 'vip', 'available'),
(2, 'VIP2', 10, 'private-room', 'vip', 'available');

-- Insert sample table data for Bella Italia (restaurant_id: 3)
INSERT INTO table_types (restaurant_id, table_number, capacity, location, table_type, status) VALUES
(3, 'T1', 2, 'window', 'standard', 'available'),
(3, 'T2', 2, 'window', 'standard', 'available'),
(3, 'T3', 4, 'indoor', 'standard', 'available'),
(3, 'T4', 4, 'indoor', 'standard', 'available'),
(3, 'T5', 4, 'indoor', 'standard', 'available'),
(3, 'T6', 6, 'indoor', 'standard', 'available'),
(3, 'VIP1', 8, 'private-room', 'vip', 'available'),
(3, 'VIP2', 8, 'private-room', 'vip', 'available');

-- Comments
COMMENT ON TABLE restaurants IS 'Restaurant listings with cuisine types and capacity';
COMMENT ON TABLE table_types IS 'Individual tables/seating arrangements in restaurants';
COMMENT ON TABLE table_bookings IS 'Table reservations with time slots and party size';

-- Sample booking (for testing)
INSERT INTO table_bookings (user_id, store_id, restaurant_id, table_type_id, booking_date, booking_time, party_size, duration_minutes, customer_name, customer_phone, status, payment_mode)
VALUES (90001, 1, 1, 1, '2026-05-15', '19:00:00', 2, 120, 'John Doe', '+1234567890', 'confirmed', 'at-venue');
