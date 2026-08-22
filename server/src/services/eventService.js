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

async function searchEvents({ type, search }) {
  const { rows } = await pool.query(
    `SELECT DISTINCT e.*
     FROM events e
     JOIN shows s ON s.event_id = e.id
     WHERE ($1::text IS NULL OR e.type = $1)
       AND ($2::text IS NULL OR e.title ILIKE '%' || $2 || '%')
     ORDER BY e.created_at DESC`,
    [type || null, search || null]
  );
  return rows;
}

async function listShowsForEvent(eventId) {
  const { rows } = await pool.query(
    `SELECT s.*, v.name AS venue_name, v.address AS venue_address
     FROM shows s
     JOIN venues v ON v.id = s.venue_id
     WHERE s.event_id = $1
     ORDER BY s.show_date, s.show_time`,
    [eventId]
  );
  return rows;
}

async function getShowDetail(showId) {
  const { rows } = await pool.query(
    `SELECT s.id, s.show_date, s.show_time,
            e.title, e.type, e.description,
            v.id AS venue_id, v.name AS venue_name, v.address AS venue_address
     FROM shows s
     JOIN events e ON e.id = s.event_id
     JOIN venues v ON v.id = s.venue_id
     WHERE s.id = $1`,
    [showId]
  );
  const show = rows[0];
  if (!show) return null;

  const { rows: pricing } = await pool.query(
    `SELECT vc.id AS category_id, vc.name AS category_name, sp.price
     FROM show_pricing sp
     JOIN venue_categories vc ON vc.id = sp.category_id
     WHERE sp.show_id = $1`,
    [showId]
  );

  return { ...show, pricing };
}

async function getShowSeatmap(showId) {
  const { rows } = await pool.query(
    `SELECT ss.id, ss.status, vs.row_label, vs.seat_number, vs.pos_x, vs.pos_y,
            vc.id AS category_id, vc.name AS category_name
     FROM show_seats ss
     JOIN venue_seats vs ON vs.id = ss.venue_seat_id
     JOIN venue_categories vc ON vc.id = ss.category_id
     WHERE ss.show_id = $1
     ORDER BY vs.row_label, vs.seat_number`,
    [showId]
  );

  const byRow = {};
  for (const seat of rows) {
    if (!byRow[seat.row_label]) byRow[seat.row_label] = [];
    byRow[seat.row_label].push({
      id: seat.id,
      seatNumber: seat.seat_number,
      posX: seat.pos_x,
      posY: seat.pos_y,
      status: seat.status,
      category: { id: seat.category_id, name: seat.category_name },
    });
  }

  return Object.entries(byRow).map(([rowLabel, seats]) => ({ rowLabel, seats }));
}

module.exports = {
  createEvent,
  listEvents,
  getEvent,
  createShow,
  listShows,
  getShow,
  searchEvents,
  listShowsForEvent,
  getShowDetail,
  getShowSeatmap,
};
