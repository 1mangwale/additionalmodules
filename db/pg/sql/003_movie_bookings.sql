-- Movie bookings table
CREATE TABLE IF NOT EXISTS movie_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id BIGINT NOT NULL,
  store_id BIGINT NOT NULL,
  showtime_id BIGINT NOT NULL REFERENCES showtimes(id) ON DELETE CASCADE,
  seats INT NOT NULL,
  seat_numbers JSONB DEFAULT '[]'::jsonb,
  amount_minor BIGINT NOT NULL,
  status VARCHAR(20) DEFAULT 'confirmed',
  booked_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_movie_bookings_user ON movie_bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_movie_bookings_store ON movie_bookings(store_id);
CREATE INDEX IF NOT EXISTS idx_movie_bookings_showtime ON movie_bookings(showtime_id);
CREATE INDEX IF NOT EXISTS idx_movie_bookings_status ON movie_bookings(status);
