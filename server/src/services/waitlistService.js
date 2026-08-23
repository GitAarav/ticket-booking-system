const { pool } = require('../db/pool');
const { attemptSeatTransition } = require('./seatService');

const OFFER_TTL_MINUTES = process.env.WAITLIST_OFFER_TTL_MINUTES || 15;

async function isSoldOut(showId, categoryId) {
  const { rows } = await pool.query(
    `SELECT COUNT(*)::int AS count FROM show_seats
     WHERE show_id = $1 AND category_id = $2 AND status = 'available'`,
    [showId, categoryId]
  );
  return rows[0].count === 0;
}

async function hasActiveEntry({ showId, categoryId, customerId }) {
  const { rows } = await pool.query(
    `SELECT id FROM waitlist_entries
     WHERE show_id = $1 AND category_id = $2 AND customer_id = $3
       AND status IN ('waiting', 'offered')`,
    [showId, categoryId, customerId]
  );
  return rows.length > 0;
}

async function joinWaitlist({ showId, categoryId, customerId }) {
  const { rows } = await pool.query(
    `INSERT INTO waitlist_entries (show_id, category_id, customer_id)
     VALUES ($1, $2, $3) RETURNING *`,
    [showId, categoryId, customerId]
  );
  return rows[0];
}

// The single place that decides who gets a freed seat next. Called both by
// cancellation (a seat just freed up) and by the sweep's offer-expiry
// cascade (an offer expired, try the next person for the same seat).
async function offerNextInWaitlist(client, { showId, categoryId, seatId }) {
  const { rows } = await client.query(
    `SELECT id, customer_id FROM waitlist_entries
     WHERE show_id = $1 AND category_id = $2 AND status = 'waiting'
     ORDER BY created_at ASC
     LIMIT 1
     FOR UPDATE SKIP LOCKED`,
    [showId, categoryId]
  );
  const entry = rows[0];
  if (!entry) return null;

  const seat = await attemptSeatTransition(client, {
    seatId,
    toStatus: 'held',
    customerId: entry.customer_id,
    holdMinutes: OFFER_TTL_MINUTES,
  });
  if (!seat) return null;

  await client.query(
    `UPDATE waitlist_entries
     SET status = 'offered',
         offer_expires_at = now() + ($2 || ' minutes')::interval,
         offered_seat_id = $3
     WHERE id = $1`,
    [entry.id, OFFER_TTL_MINUTES, seatId]
  );

  return { waitlistEntryId: entry.id, customerId: entry.customer_id, seatId };
}

async function sweepExpiredOffers() {
  const { rows: staleOffers } = await pool.query(
    `SELECT id, show_id, category_id, offered_seat_id FROM waitlist_entries
     WHERE status = 'offered' AND offer_expires_at < now()`
  );

  let cascaded = 0;
  for (const offer of staleOffers) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const { rowCount } = await client.query(
        `UPDATE waitlist_entries SET status = 'expired' WHERE id = $1 AND status = 'offered'`,
        [offer.id]
      );

      if (rowCount > 0) {
        const result = await offerNextInWaitlist(client, {
          showId: offer.show_id,
          categoryId: offer.category_id,
          seatId: offer.offered_seat_id,
        });
        if (result) cascaded += 1;
      }

      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  return { expired: staleOffers.length, cascaded };
}

module.exports = { isSoldOut, hasActiveEntry, joinWaitlist, offerNextInWaitlist, sweepExpiredOffers };
