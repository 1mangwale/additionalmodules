-- Venues module schema for sports facilities
CREATE TABLE IF NOT EXISTS venue_types (
  id SERIAL PRIMARY KEY,
  store_id BIGINT NOT NULL,
  name TEXT NOT NULL,
  venue_category VARCHAR(50) NOT NULL, -- cricket_turf, badminton_court, tennis_court, etc
  hourly_rate_minor BIGINT NOT NULL,
  description TEXT,
  facilities TEXT,
  status SMALLINT NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS venue_slots (
  id SERIAL PRIMARY KEY,
  venue_type_id INT NOT NULL REFERENCES venue_types(id) ON DELETE CASCADE,
  store_id BIGINT NOT NULL,
  date DATE NOT NULL,
  hour_start INT NOT NULL, -- 0-23
  hour_end INT NOT NULL, -- 1-24
  capacity INT NOT NULL DEFAULT 1,
  booked INT NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'open'
);

CREATE TABLE IF NOT EXISTS venue_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id BIGINT NOT NULL,
  store_id BIGINT NOT NULL,
  venue_type_id INT NOT NULL REFERENCES venue_types(id) ON DELETE CASCADE,
  slot_id INT NOT NULL REFERENCES venue_slots(id) ON DELETE CASCADE,
  booking_date DATE NOT NULL,
  hours INT NOT NULL,
  amount_minor BIGINT NOT NULL,
  status VARCHAR(20) DEFAULT 'confirmed',
  payment_mode VARCHAR(20),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_venue_slots_date ON venue_slots(date, venue_type_id);
CREATE INDEX IF NOT EXISTS idx_venue_bookings_user ON venue_bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_venue_bookings_store ON venue_bookings(store_id);
CREATE INDEX IF NOT EXISTS idx_venue_bookings_status ON venue_bookings(status);
