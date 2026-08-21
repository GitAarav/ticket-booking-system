-- Checkpoint 0: initial schema. See docs/SYSTEM_DESIGN.md for the reasoning
-- behind each table, especially show_seats (per-show status) and the
-- held_until / offer_expires_at columns (TTL correctness lives here, not in Redis).

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('customer', 'organiser', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE venues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES users(id),
  name TEXT NOT NULL,
  address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE venue_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  name TEXT NOT NULL
);

CREATE TABLE venue_seats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES venue_categories(id),
  row_label TEXT NOT NULL,
  seat_number INTEGER NOT NULL,
  pos_x INTEGER NOT NULL DEFAULT 0,
  pos_y INTEGER NOT NULL DEFAULT 0,
  UNIQUE (venue_id, row_label, seat_number)
);

CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organiser_id UUID NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('movie', 'concert')),
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE shows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  venue_id UUID NOT NULL REFERENCES venues(id),
  show_date DATE NOT NULL,
  show_time TIME NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE show_pricing (
  show_id UUID NOT NULL REFERENCES shows(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES venue_categories(id),
  price NUMERIC(10, 2) NOT NULL,
  PRIMARY KEY (show_id, category_id)
);

-- Live per-seat status, per show. This is the table the concurrency
-- guard (attemptSeatTransition) operates on.
CREATE TABLE show_seats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  show_id UUID NOT NULL REFERENCES shows(id) ON DELETE CASCADE,
  venue_seat_id UUID NOT NULL REFERENCES venue_seats(id),
  category_id UUID NOT NULL REFERENCES venue_categories(id),
  status TEXT NOT NULL DEFAULT 'available'
    CHECK (status IN ('available', 'held', 'booked')),
  held_by_customer_id UUID REFERENCES users(id),
  held_until TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (show_id, venue_seat_id)
);
CREATE INDEX idx_show_seats_show_id ON show_seats(show_id);
CREATE INDEX idx_show_seats_sweep ON show_seats(status, held_until)
  WHERE status = 'held';

CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_reference TEXT UNIQUE NOT NULL,
  customer_id UUID NOT NULL REFERENCES users(id),
  show_id UUID NOT NULL REFERENCES shows(id),
  total_amount NUMERIC(10, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'confirmed'
    CHECK (status IN ('confirmed', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE booking_seats (
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  show_seat_id UUID NOT NULL REFERENCES show_seats(id),
  PRIMARY KEY (booking_id, show_seat_id)
);

-- FIFO queue per show+category. Oldest created_at with status='waiting'
-- is next in line. See docs/SYSTEM_DESIGN.md "Waitlist auto-assignment".
CREATE TABLE waitlist_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  show_id UUID NOT NULL REFERENCES shows(id),
  category_id UUID NOT NULL REFERENCES venue_categories(id),
  customer_id UUID NOT NULL REFERENCES users(id),
  status TEXT NOT NULL DEFAULT 'waiting'
    CHECK (status IN ('waiting', 'offered', 'expired', 'booked')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  offer_expires_at TIMESTAMPTZ
);
CREATE INDEX idx_waitlist_next_in_line
  ON waitlist_entries(show_id, category_id, created_at)
  WHERE status = 'waiting';
CREATE INDEX idx_waitlist_offer_sweep
  ON waitlist_entries(status, offer_expires_at)
  WHERE status = 'offered';

-- Transactional outbox: inserted in the same transaction as a booking
-- confirmation, sent later by the sweep worker. A failed send never
-- rolls back the booking. See docs/SYSTEM_DESIGN.md "QR code + email".
CREATE TABLE email_outbox (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id),
  waitlist_entry_id UUID REFERENCES waitlist_entries(id),
  type TEXT NOT NULL CHECK (type IN ('booking_confirmation', 'waitlist_offer')),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'sent', 'failed')),
  attempts INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_email_outbox_pending ON email_outbox(status)
  WHERE status = 'pending';
