const { pool } = require('../db/pool');
const { notifySeatmapChanged } = require('./realtimeService');

const HOLD_TTL_MINUTES = process.env.SEAT_HOLD_TTL_MINUTES || 10;

async function attemptSeatTransition(client, { seatId, toStatus, customerId, holdMinutes }) {
  if (toStatus === 'held') {
    const { rows } = await client.query(
      `UPDATE show_seats
       SET status = 'held', held_by_customer_id = $2,
           held_until = now() + ($3 || ' minutes')::interval, updated_at = now()
       WHERE id = $1
         AND (status = 'available' OR (status = 'held' AND held_until < now()))
       RETURNING *`,
      [seatId, customerId, holdMinutes || HOLD_TTL_MINUTES]
    );
    return rows[0] || null;
  }

  if (toStatus === 'booked') {
    const { rows } = await client.query(
      `UPDATE show_seats
       SET status = 'booked', held_by_customer_id = NULL, held_until = NULL, updated_at = now()
       WHERE id = $1
         AND status = 'held' AND held_by_customer_id = $2 AND held_until >= now()
       RETURNING *`,
      [seatId, customerId]
    );
    return rows[0] || null;
  }

  if (toStatus === 'available') {
    const { rows } = await client.query(
      `UPDATE show_seats
       SET status = 'available', held_by_customer_id = NULL, held_until = NULL, updated_at = now()
       WHERE id = $1 AND status IN ('held', 'booked')
       RETURNING *`,
      [seatId]
    );
    return rows[0] || null;
  }

  throw new Error(`unsupported seat transition: ${toStatus}`);
}

async function holdSeats({ showId, seatIds, customerId }) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const held = [];
    for (const seatId of seatIds) {
      const seat = await attemptSeatTransition(client, { seatId, toStatus: 'held', customerId });
      if (!seat || seat.show_id !== showId) {
        await client.query('ROLLBACK');
        return { ok: false, conflictSeatId: seatId };
      }
      held.push(seat);
    }

    await client.query('COMMIT');
    await notifySeatmapChanged(showId);
    return { ok: true, seats: held };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function confirmBooking({ showId, seatIds, customerId }) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const booked = [];
    for (const seatId of seatIds) {
      const seat = await attemptSeatTransition(client, { seatId, toStatus: 'booked', customerId });
      if (!seat || seat.show_id !== showId) {
        await client.query('ROLLBACK');
        return { ok: false, conflictSeatId: seatId };
      }
      booked.push(seat);
    }

    const { rows: pricingRows } = await client.query(
      `SELECT category_id, price FROM show_pricing WHERE show_id = $1`,
      [showId]
    );
    const priceByCategory = new Map(pricingRows.map((p) => [p.category_id, Number(p.price)]));
    const totalAmount = booked.reduce((sum, seat) => sum + (priceByCategory.get(seat.category_id) || 0), 0);

    const bookingReference = `BK-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

    const { rows: bookingRows } = await client.query(
      `INSERT INTO bookings (booking_reference, customer_id, show_id, total_amount, status)
       VALUES ($1, $2, $3, $4, 'confirmed') RETURNING *`,
      [bookingReference, customerId, showId, totalAmount]
    );
    const booking = bookingRows[0];

    for (const seat of booked) {
      await client.query(
        `INSERT INTO booking_seats (booking_id, show_seat_id) VALUES ($1, $2)`,
        [booking.id, seat.id]
      );
    }

    await client.query(
      `INSERT INTO email_outbox (booking_id, type, status) VALUES ($1, 'booking_confirmation', 'pending')`,
      [booking.id]
    );

    await client.query('COMMIT');
    await notifySeatmapChanged(showId);
    return { ok: true, booking, seats: booked };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { attemptSeatTransition, holdSeats, confirmBooking };
