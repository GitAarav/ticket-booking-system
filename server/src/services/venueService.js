const { pool } = require('../db/pool');

async function createVenue({ adminId, name, address }) {
  const { rows } = await pool.query(
    `INSERT INTO venues (admin_id, name, address) VALUES ($1, $2, $3) RETURNING *`,
    [adminId, name, address]
  );
  return rows[0];
}

async function listVenues(adminId) {
  const { rows } = await pool.query(
    `SELECT * FROM venues WHERE admin_id = $1 ORDER BY created_at DESC`,
    [adminId]
  );
  return rows;
}

async function getVenue(id) {
  const { rows } = await pool.query(`SELECT * FROM venues WHERE id = $1`, [id]);
  return rows[0];
}

async function updateVenue(id, { name, address }) {
  const { rows } = await pool.query(
    `UPDATE venues SET name = COALESCE($2, name), address = COALESCE($3, address)
     WHERE id = $1 RETURNING *`,
    [id, name, address]
  );
  return rows[0];
}

async function deleteVenue(id) {
  await pool.query(`DELETE FROM venues WHERE id = $1`, [id]);
}

async function createCategory(venueId, name) {
  const { rows } = await pool.query(
    `INSERT INTO venue_categories (venue_id, name) VALUES ($1, $2) RETURNING *`,
    [venueId, name]
  );
  return rows[0];
}

async function listCategories(venueId) {
  const { rows } = await pool.query(
    `SELECT * FROM venue_categories WHERE venue_id = $1 ORDER BY name`,
    [venueId]
  );
  return rows;
}

async function bulkCreateSeats(venueId, seats) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const created = [];
    for (const seat of seats) {
      const { rows } = await client.query(
        `INSERT INTO venue_seats (venue_id, category_id, row_label, seat_number, pos_x, pos_y)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [venueId, seat.categoryId, seat.rowLabel, seat.seatNumber, seat.posX || 0, seat.posY || 0]
      );
      created.push(rows[0]);
    }
    await client.query('COMMIT');
    return created;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function getSeatmap(venueId) {
  const { rows } = await pool.query(
    `SELECT vs.id, vs.row_label, vs.seat_number, vs.pos_x, vs.pos_y,
            vc.id AS category_id, vc.name AS category_name
     FROM venue_seats vs
     JOIN venue_categories vc ON vc.id = vs.category_id
     WHERE vs.venue_id = $1
     ORDER BY vs.row_label, vs.seat_number`,
    [venueId]
  );

  const byRow = {};
  for (const seat of rows) {
    if (!byRow[seat.row_label]) byRow[seat.row_label] = [];
    byRow[seat.row_label].push({
      id: seat.id,
      seatNumber: seat.seat_number,
      posX: seat.pos_x,
      posY: seat.pos_y,
      category: { id: seat.category_id, name: seat.category_name },
    });
  }

  return Object.entries(byRow).map(([rowLabel, seats]) => ({ rowLabel, seats }));
}

module.exports = {
  createVenue,
  listVenues,
  getVenue,
  updateVenue,
  deleteVenue,
  createCategory,
  listCategories,
  bulkCreateSeats,
  getSeatmap,
};
