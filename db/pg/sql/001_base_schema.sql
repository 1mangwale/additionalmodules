-- Postgres base schema for Rooms & Services + Pricing Slabs

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ROOMS
CREATE TABLE IF NOT EXISTS room_types(
  id BIGSERIAL PRIMARY KEY,
  store_id BIGINT NOT NULL,
  name TEXT NOT NULL,
  occupancy_adults INT NOT NULL DEFAULT 2,
  occupancy_children INT NOT NULL DEFAULT 0,
  amenities JSONB,
  status SMALLINT NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS room_rate_plans(
  id BIGSERIAL PRIMARY KEY,
  room_type_id BIGINT NOT NULL,
  name TEXT NOT NULL,
  refundable BOOLEAN NOT NULL DEFAULT TRUE,
  refund_policy JSONB,
  pricing_mode TEXT NOT NULL DEFAULT 'flat'
);

CREATE TABLE IF NOT EXISTS room_inventory(
  id BIGSERIAL PRIMARY KEY,
  room_type_id BIGINT NOT NULL,
  "date" DATE NOT NULL,
  total_rooms INT NOT NULL,
  sold_rooms INT NOT NULL DEFAULT 0,
  cutoff_time TIME,
  price_override NUMERIC(12,2),
  status TEXT NOT NULL DEFAULT 'open',
  UNIQUE(room_type_id,"date")
);

CREATE TABLE IF NOT EXISTS room_bookings(
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id BIGINT NOT NULL,
  store_id BIGINT NOT NULL,
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  rooms INT NOT NULL DEFAULT 1,
  adults INT NOT NULL DEFAULT 1,
  children INT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS room_booking_items(
  id BIGSERIAL PRIMARY KEY,
  booking_id UUID NOT NULL,
  room_type_id BIGINT NOT NULL,
  rate_plan_id BIGINT NOT NULL,
  nights INT NOT NULL,
  price_per_night NUMERIC(12,2) NOT NULL,
  tax_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  total NUMERIC(12,2) NOT NULL
);

-- SERVICES
CREATE TABLE IF NOT EXISTS services_catalog(
  id BIGSERIAL PRIMARY KEY,
  store_id BIGINT NOT NULL,
  name TEXT NOT NULL,
  category TEXT,
  pricing_model TEXT NOT NULL DEFAULT 'dynamic',
  base_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  visit_fee NUMERIC(12,2) NOT NULL DEFAULT 0,
  at_customer_location BOOLEAN NOT NULL DEFAULT TRUE,
  status SMALLINT NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS service_slots(
  id BIGSERIAL PRIMARY KEY,
  store_id BIGINT NOT NULL,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  capacity INT NOT NULL DEFAULT 1,
  booked INT NOT NULL DEFAULT 0,
  UNIQUE(store_id,date,start_time,end_time)
);

CREATE TABLE IF NOT EXISTS service_appointments(
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id BIGINT NOT NULL,
  store_id BIGINT NOT NULL,
  service_id BIGINT NOT NULL,
  slot_id BIGINT,
  scheduled_for TIMESTAMPTZ NOT NULL,
  address_id BIGINT,
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT
);

-- PRICING SLABS
CREATE TABLE IF NOT EXISTS vendor_pricing_slabs(
  id BIGSERIAL PRIMARY KEY,
  vendor_id BIGINT NOT NULL,
  store_id BIGINT,
  zone_id BIGINT,
  module TEXT NOT NULL,    -- room|service
  name TEXT NOT NULL,
  basis TEXT NOT NULL,     -- date_range|weekday|hour|lead_time|distance_km|occupancy
  method TEXT NOT NULL,    -- flat|percent|per_unit
  range_start NUMERIC(12,3),
  range_end NUMERIC(12,3),
  value NUMERIC(12,3),
  weekdays INT[],
  date_from DATE,
  date_to DATE,
  priority INT NOT NULL DEFAULT 100,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  tag TEXT NOT NULL DEFAULT 'price' -- price|visit_fee|refund_penalty|commission
);

-- Additional columns for hostel/dorm features on room_types
ALTER TABLE room_types
  ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'room',
  ADD COLUMN IF NOT EXISTS gender_policy TEXT DEFAULT 'mixed',
  ADD COLUMN IF NOT EXISTS beds_per_room INT,
  ADD COLUMN IF NOT EXISTS checkin_time TIME,
  ADD COLUMN IF NOT EXISTS checkout_time TIME;

-- Additional column for service duration
ALTER TABLE services_catalog
  ADD COLUMN IF NOT EXISTS duration_min INT;

-- Vendor stores (location and service radius for visit fee calc)
CREATE TABLE IF NOT EXISTS vendor_stores (
  id BIGSERIAL PRIMARY KEY,
  vendor_id BIGINT NOT NULL,
  store_id BIGINT NOT NULL,
  name TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  service_radius_km NUMERIC(8,2) DEFAULT 15.0,
  UNIQUE(store_id)
);

-- MOVIES (BookMyShow-like)
CREATE TABLE IF NOT EXISTS movies (
  id BIGSERIAL PRIMARY KEY,
  store_id BIGINT NOT NULL,
  title TEXT NOT NULL,
  genre TEXT,
  duration_min INT NOT NULL DEFAULT 120,
  status SMALLINT NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS screens (
  id BIGSERIAL PRIMARY KEY,
  store_id BIGINT NOT NULL,
  name TEXT NOT NULL,
  seat_count INT NOT NULL DEFAULT 100
);

CREATE TABLE IF NOT EXISTS showtimes (
  id BIGSERIAL PRIMARY KEY,
  store_id BIGINT NOT NULL,
  movie_id BIGINT NOT NULL,
  screen_id BIGINT NOT NULL,
  starts_at TIMESTAMP NOT NULL,
  booked INT NOT NULL DEFAULT 0,
  base_price NUMERIC(12,2) NOT NULL DEFAULT 0
);
