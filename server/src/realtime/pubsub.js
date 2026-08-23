const { EventEmitter } = require('events');

// Same-instance fan-out. Every SSE connection subscribes here — regardless
// of whether Redis is configured, this is the only thing an SSE handler
// ever listens to directly.
const localBus = new EventEmitter();
localBus.setMaxListeners(0);

let redisPub = null;
let redisSub = null;
let redisReady = false;

async function ensureRedis() {
  if (redisReady) return;
  const { createClient } = require('redis');
  redisPub = createClient({ url: process.env.REDIS_URL });
  redisSub = redisPub.duplicate();
  await redisPub.connect();
  await redisSub.connect();
  // One shared pattern subscription re-emits into localBus for ANY publish
  // (including our own) — this is the only path to local delivery when
  // Redis is active, so a message can never be delivered twice locally.
  await redisSub.pSubscribe('show:*:seats', (message, channel) => {
    localBus.emit(channel, JSON.parse(message));
  });
  redisReady = true;
}

async function publish(channel, payload) {
  if (process.env.REDIS_URL) {
    await ensureRedis();
    await redisPub.publish(channel, JSON.stringify(payload));
  } else {
    localBus.emit(channel, payload);
  }
}

function subscribe(channel, onMessage) {
  localBus.on(channel, onMessage);
  return () => localBus.off(channel, onMessage);
}

function seatChannel(showId) {
  return `show:${showId}:seats`;
}

module.exports = { publish, subscribe, seatChannel };
