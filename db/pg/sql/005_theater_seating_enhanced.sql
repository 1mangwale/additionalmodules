-- Enhanced Movie Theater Seating System
-- Migration: 005_theater_seating_enhanced.sql

-- 1. Add layout configuration to screens
ALTER TABLE screens 
  ADD COLUMN layout_config JSONB DEFAULT '{"sections": [], "metadata": {}}',
  ADD COLUMN total_capacity INT DEFAULT 0,
  ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();

COMMENT ON COLUMN screens.layout_config IS 'Complete seating layout template with sections, rows, gaps, and pricing multipliers';

-- 2. Screen sections for pricing zones
CREATE TABLE screen_sections (
  id BIGSERIAL PRIMARY KEY,
  screen_id BIGINT NOT NULL,
  section_id VARCHAR(50) NOT NULL,
  name TEXT NOT NULL,
  price_multiplier NUMERIC(5,2) DEFAULT 1.0,
  row_start VARCHAR(5),
  row_end VARCHAR(5),
  seat_type VARCHAR(20) DEFAULT 'standard',
  color VARCHAR(7) DEFAULT '#90EE90',
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT fk_sections_screen FOREIGN KEY (screen_id) 
    REFERENCES screens (id) ON DELETE CASCADE,
  UNIQUE(screen_id, section_id)
);

CREATE INDEX idx_screen_sections_screen ON screen_sections(screen_id);

-- 3. Individual seats with position and type
CREATE TABLE screen_seats (
  id BIGSERIAL PRIMARY KEY,
  screen_id BIGINT NOT NULL,
  section_id VARCHAR(50) NOT NULL,
  row_label VARCHAR(5) NOT NULL,
  seat_number INT NOT NULL,
  seat_label VARCHAR(10) NOT NULL,
  seat_type VARCHAR(20) DEFAULT 'standard',
  is_blocked BOOLEAN DEFAULT FALSE,
  block_reason TEXT,
  position_x INT DEFAULT 0,
  position_y INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT fk_seats_screen FOREIGN KEY (screen_id) 
    REFERENCES screens (id) ON DELETE CASCADE,
  UNIQUE(screen_id, seat_label)
);

CREATE INDEX idx_screen_seats_screen ON screen_seats(screen_id);
CREATE INDEX idx_screen_seats_section ON screen_seats(screen_id, section_id);
CREATE INDEX idx_screen_seats_available ON screen_seats(screen_id, is_blocked);

-- 4. Per-showtime seat availability
CREATE TABLE showtime_seats (
  id BIGSERIAL PRIMARY KEY,
  showtime_id BIGINT NOT NULL,
  seat_id BIGINT NOT NULL,
  status VARCHAR(20) DEFAULT 'available',
  booking_id UUID,
  reserved_by BIGINT,
  reserved_at TIMESTAMPTZ,
  reserved_until TIMESTAMPTZ,
  booked_at TIMESTAMPTZ,
  CONSTRAINT fk_showtime_seats_showtime FOREIGN KEY (showtime_id) 
    REFERENCES showtimes (id) ON DELETE CASCADE,
  CONSTRAINT fk_showtime_seats_seat FOREIGN KEY (seat_id) 
    REFERENCES screen_seats (id) ON DELETE CASCADE,
  UNIQUE(showtime_id, seat_id)
);

CREATE INDEX idx_showtime_seats_showtime ON showtime_seats(showtime_id);
CREATE INDEX idx_showtime_seats_status ON showtime_seats(showtime_id, status);
CREATE INDEX idx_showtime_seats_reservation ON showtime_seats(reserved_until) WHERE status = 'reserved';

-- 5. Section-based pricing per showtime
CREATE TABLE showtime_pricing (
  id BIGSERIAL PRIMARY KEY,
  showtime_id BIGINT NOT NULL,
  section_id VARCHAR(50) NOT NULL,
  price_minor BIGINT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT fk_pricing_showtime FOREIGN KEY (showtime_id) 
    REFERENCES showtimes (id) ON DELETE CASCADE,
  UNIQUE(showtime_id, section_id)
);

CREATE INDEX idx_showtime_pricing_showtime ON showtime_pricing(showtime_id);

-- 6. Function to auto-generate showtime seats when showtime is created
CREATE OR REPLACE FUNCTION generate_showtime_seats()
RETURNS TRIGGER AS $$
BEGIN
  -- Copy all non-blocked seats from screen_seats to showtime_seats
  INSERT INTO showtime_seats (showtime_id, seat_id, status)
  SELECT NEW.id, ss.id, 'available'
  FROM screen_seats ss
  WHERE ss.screen_id = NEW.screen_id
    AND ss.is_blocked = FALSE;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_generate_showtime_seats
  AFTER INSERT ON showtimes
  FOR EACH ROW
  EXECUTE FUNCTION generate_showtime_seats();

-- 7. Function to auto-expire seat reservations
CREATE OR REPLACE FUNCTION expire_seat_reservations()
RETURNS void AS $$
BEGIN
  UPDATE showtime_seats
  SET status = 'available',
      reserved_by = NULL,
      reserved_at = NULL,
      reserved_until = NULL
  WHERE status = 'reserved'
    AND reserved_until < NOW();
END;
$$ LANGUAGE plpgsql;

-- 8. Sample layout for testing
INSERT INTO screens (store_id, name, seat_count, layout_config, total_capacity)
VALUES (
  1,
  'PVR Demo Screen 1',
  110,
  '{
    "sections": [
      {
        "section_id": "regular_back",
        "name": "Regular (Back)",
        "rows": ["A", "B", "C"],
        "seats_per_row": 16,
        "price_multiplier": 1.0,
        "color": "#90EE90"
      },
      {
        "type": "gap",
        "height": "1.5m"
      },
      {
        "section_id": "regular_front",
        "name": "Regular (Front)",
        "rows": ["D", "E", "F"],
        "seats_per_row": 18,
        "price_multiplier": 1.0,
        "color": "#90EE90"
      },
      {
        "type": "gap",
        "height": "2m"
      },
      {
        "section_id": "premium",
        "name": "Premium",
        "rows": ["G", "H"],
        "seats_per_row": 14,
        "price_multiplier": 1.5,
        "color": "#FFD700"
      },
      {
        "type": "gap",
        "height": "2.5m"
      },
      {
        "section_id": "gold",
        "name": "Gold Recliners",
        "rows": ["J"],
        "seats_per_row": 10,
        "price_multiplier": 2.0,
        "seat_type": "recliner",
        "color": "#FF6B6B"
      }
    ],
    "metadata": {
      "screen_type": "Standard",
      "has_3d": true,
      "sound_system": "Dolby Atmos"
    }
  }',
  110
) ON CONFLICT DO NOTHING;

COMMENT ON TABLE screen_sections IS 'Pricing zones/sections in a theater screen';
COMMENT ON TABLE screen_seats IS 'Individual seat inventory with position and type';
COMMENT ON TABLE showtime_seats IS 'Real-time seat availability per showtime';
COMMENT ON TABLE showtime_pricing IS 'Section-based pricing per showtime';
