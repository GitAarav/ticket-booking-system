const jwt = require('jsonwebtoken');
const { pool } = require('../db/pool');
const { attemptSeatTransition } = require('./seatService');
const { notifySeatmapChanged } = require('./realtimeService');

const OFFER_TTL_MINUTES = Number(process.env.WAITLIST_OFFER_TTL_MINUTES) || 15;

async function categoryExistsForShow(showId, categoryId) {
  const { rows } = await pool.query(
    `SELECT 1 FROM show_seats WHERE show_id = $1 AND category_id = $2 LIMIT 1`,
    [showId, categoryId]
  );
  return rows.length > 0;
}

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

async function getWaitlistEntry(id) {
  const { rows } = await pool.query(`SELECT * FROM waitlist_entries WHERE id = $1`, [id]);
  return rows[0];
}

async function markWaitlistEntryBooked(id) {
  await pool.query(
    `UPDATE waitlist_entries SET status = 'booked' WHERE id = $1 AND status = 'offered'`,
    [id]
  );
}

// The token IS the credential for /offers/:token — no login required, same
// idea as a password-reset link. expiresAt is passed in explicitly (rather
// than always "now + 15 minutes") so a token can be regenerated later
// (e.g. at actual email-send time) and still expire at the exact same
// real-world moment as the offer itself, per offer_expires_at.
function issueOfferToken(waitlistEntryId, expiresAt) {
  const secondsRemaining = Math.max(1, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
  return jwt.sign(
    { waitlistEntryId, purpose: 'waitlist_offer' },
    process.env.JWT_SECRET,
    { expiresIn: secondsRemaining }
  );
}

function verifyOfferToken(token) {
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  if (decoded.purpose !== 'waitlist_offer') {
    throw new Error('not an offer token');
  }
  return decoded;
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

  const expiresAt = new Date(Date.now() + OFFER_TTL_MINUTES * 60 * 1000);

  await client.query(
    `UPDATE waitlist_entries
     SET status = 'offered', offer_expires_at = $2, offered_seat_id = $3
     WHERE id = $1`,
    [entry.id, expiresAt, seatId]
  );

  await client.query(
    `INSERT INTO email_outbox (waitlist_entry_id, type, status) VALUES ($1, 'waitlist_offer', 'pending')`,
    [entry.id]
  );

  const token = issueOfferToken(entry.id, expiresAt);
  console.log(`[waitlist] offered seat ${seatId} to customer ${entry.customer_id}, confirm token: ${token}`);

  return { waitlistEntryId: entry.id, customerId: entry.customer_id, seatId, token, expiresAt };
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
      if (rowCount > 0) await notifySeatmapChanged(offer.show_id);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  return { expired: staleOffers.length, cascaded };
}

module.exports = {
  categoryExistsForShow,
  isSoldOut,
  hasActiveEntry,
  joinWaitlist,
  getWaitlistEntry,
  markWaitlistEntryBooked,
  issueOfferToken,
  verifyOfferToken,
  offerNextInWaitlist,
  sweepExpiredOffers,
};
