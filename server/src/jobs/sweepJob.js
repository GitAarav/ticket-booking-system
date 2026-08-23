const cron = require('node-cron');
const { pool } = require('../db/pool');
const { attemptSeatTransition } = require('../services/seatService');
const { sweepExpiredOffers } = require('../services/waitlistService');
const { sendPendingEmails } = require('../services/emailService');
const { notifySeatmapChanged } = require('../services/realtimeService');

async function sweepExpiredHolds() {
  const { rows: expired } = await pool.query(
    `SELECT id, show_id FROM show_seats WHERE status = 'held' AND held_until < now()`
  );

  for (const { id, show_id } of expired) {
    const released = await attemptSeatTransition(pool, { seatId: id, toStatus: 'available' });
    if (released) await notifySeatmapChanged(show_id);
  }

  return expired.length;
}

function startSweepJob() {
  const intervalSeconds = Number(process.env.SWEEP_INTERVAL_SECONDS) || 10;
  const cronExpression = `*/${intervalSeconds} * * * * *`;

  return cron.schedule(cronExpression, async () => {
    try {
      const releasedCount = await sweepExpiredHolds();
      if (releasedCount > 0) {
        console.log(`[sweep] released ${releasedCount} expired hold(s)`);
      }

      const { expired: expiredOffers, cascaded } = await sweepExpiredOffers();
      if (expiredOffers > 0) {
        console.log(`[sweep] expired ${expiredOffers} waitlist offer(s), cascaded ${cascaded} to next in line`);
      }

      const { sent, failed } = await sendPendingEmails();
      if (sent > 0 || failed > 0) {
        console.log(`[sweep] emails: ${sent} sent, ${failed} failed`);
      }
    } catch (err) {
      console.error('[sweep] error:', err);
    }
  });
}

module.exports = { startSweepJob, sweepExpiredHolds };
