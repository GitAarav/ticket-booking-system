const cron = require('node-cron');
const { pool } = require('../db/pool');
const { attemptSeatTransition } = require('../services/seatService');

async function sweepExpiredHolds() {
  const { rows: expired } = await pool.query(
    `SELECT id FROM show_seats WHERE status = 'held' AND held_until < now()`
  );

  for (const { id } of expired) {
    const client = await pool.connect();
    try {
      await attemptSeatTransition(client, { seatId: id, toStatus: 'available' });
    } finally {
      client.release();
    }
  }

  return expired.length;
}

function startSweepJob() {
  const intervalSeconds = Number(process.env.SWEEP_INTERVAL_SECONDS) || 10;
  const cronExpression = `*/${intervalSeconds} * * * * *`;

  return cron.schedule(cronExpression, async () => {
    try {
      const count = await sweepExpiredHolds();
      if (count > 0) {
        console.log(`[sweep] released ${count} expired hold(s)`);
      }
    } catch (err) {
      console.error('[sweep] error:', err);
    }
  });
}

module.exports = { startSweepJob, sweepExpiredHolds };
