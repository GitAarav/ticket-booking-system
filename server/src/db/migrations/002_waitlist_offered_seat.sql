-- Checkpoint 7: track exactly which show_seat was offered to a waitlist
-- entry. Needed so an expired offer can be re-offered to the next person in
-- line even after the TTL sweep has already released the seat back to
-- 'available' — without this, there'd be no way to know which seat an
-- expired offer was ever pointing at.
ALTER TABLE waitlist_entries ADD COLUMN offered_seat_id UUID REFERENCES show_seats(id);
