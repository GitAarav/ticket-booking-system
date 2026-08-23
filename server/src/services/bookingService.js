const { pool } = require('../db/pool');
const { attemptSeatTransition } = require('./seatService');
const { offerNextInWaitlist } = require('./waitlistService');
const { notifySeatmapChanged } = require('./realtimeService');

async function listBookingsForCustomer(customerId) {
  const { rows } = await pool.query(
    `SELECT b.*, e.title, e.type, s.show_date, s.show_time
     FROM bookings b
     JOIN shows s ON s.id = b.show_id
     JOIN events e ON e.id = s.event_id
     WHERE b.customer_id = $1
     ORDER BY b.created_at DESC`,
    [customerId]
  );
  return rows;
}

async function cancelBooking({ bookingId, customerId }) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows: bookingRows } = await client.query(
      `SELECT * FROM bookings WHERE id = $1 FOR UPDATE`,
      [bookingId]
    );
    const booking = bookingRows[0];

    if (!booking) {
      await client.query('ROLLBACK');
      return { ok: false, reason: 'not_found' };
    }
    if (booking.customer_id !== customerId) {
      await client.query('ROLLBACK');
      return { ok: false, reason: 'forbidden' };
    }
    if (booking.status !== 'confirmed') {
      await client.query('ROLLBACK');
      return { ok: false, reason: 'already_cancelled' };
    }

    await client.query(`UPDATE bookings SET status = 'cancelled' WHERE id = $1`, [bookingId]);

    const { rows: seats } = await client.query(
      `SELECT ss.id, ss.category_id
       FROM booking_seats bs
       JOIN show_seats ss ON ss.id = bs.show_seat_id
       WHERE bs.booking_id = $1`,
      [bookingId]
    );

    for (const seat of seats) {
      await attemptSeatTransition(client, { seatId: seat.id, toStatus: 'available' });
      await offerNextInWaitlist(client, {
        showId: booking.show_id,
        categoryId: seat.category_id,
        seatId: seat.id,
      });
    }

    await client.query('COMMIT');
    await notifySeatmapChanged(booking.show_id);
    return { ok: true };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { listBookingsForCustomer, cancelBooking };
