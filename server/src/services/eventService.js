const { pool } = require('../db/pool');

async function createEvent({ organiserId, title, type, description }) {
  const { rows } = await pool.query(
    `INSERT INTO events (organiser_id, title, type, description)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [organiserId, title, type, description]
  );
  return rows[0];
}

async function listEvents(organiserId) {
  const { rows } = await pool.query(
    `SELECT * FROM events WHERE organiser_id = $1 ORDER BY created_at DESC`,
    [organiserId]
  );
  return rows;
}

async function getEvent(id) {
  const { rows } = await pool.query(`SELECT * FROM events WHERE id = $1`, [id]);
  return rows[0];
}

async function createShow({ eventId, venueId, showDate, showTime, pricing }) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const showResult = await client.query(
      `INSERT INTO shows (event_id, venue_id, show_date, show_time)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [eventId, venueId, showDate, showTime]
    );
    const show = showResult.rows[0];

    for (const { categoryId, price } of pricing) {
      await client.query(
        `INSERT INTO show_pricing (show_id, category_id, price) VALUES ($1, $2, $3)`,
        [show.id, categoryId, price]
      );
    }

    const venueSeats = await client.query(
      `SELECT id, category_id FROM venue_seats WHERE venue_id = $1`,
      [venueId]
    );

    for (const seat of venueSeats.rows) {
      await client.query(
        `INSERT INTO show_seats (show_id, venue_seat_id, category_id, status)
         VALUES ($1, $2, $3, 'available')`,
        [show.id, seat.id, seat.category_id]
      );
    }

    await client.query('COMMIT');
    return show;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function listShows(eventId) {
  const { rows } = await pool.query(
    `SELECT * FROM shows WHERE event_id = $1 ORDER BY show_date, show_time`,
    [eventId]
  );
  return rows;
}

async function getShow(id) {
  const { rows } = await pool.query(`SELECT * FROM shows WHERE id = $1`, [id]);
  return rows[0];
}

module.exports = { createEvent, listEvents, getEvent, createShow, listShows, getShow };
