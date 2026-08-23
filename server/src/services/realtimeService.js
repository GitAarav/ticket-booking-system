const { publish, subscribe, seatChannel } = require('../realtime/pubsub');

// Deliberately a lightweight "something changed" ping, not the seatmap
// itself — the SSE handler always re-fetches fresh via getShowSeatmap()
// on receiving this, so there's no risk of a subscriber ever holding a
// stale embedded payload if two changes land close together.
async function notifySeatmapChanged(showId) {
  await publish(seatChannel(showId), { changedAt: Date.now() });
}

function onSeatmapChanged(showId, callback) {
  return subscribe(seatChannel(showId), callback);
}

module.exports = { notifySeatmapChanged, onSeatmapChanged };
