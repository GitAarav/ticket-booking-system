const express = require('express');
const { authenticate, roleGuard } = require('../middleware/roleGuard');
const { asyncHandler } = require('../middleware/asyncHandler');
const eventService = require('../services/eventService');
const seatService = require('../services/seatService');

const router = express.Router();
const MAX_SEATS_PER_REQUEST = 10;

router.use(authenticate, roleGuard('customer'));

function validateSeatIds(req, res) {
  const { seatIds } = req.body;
  if (!Array.isArray(seatIds) || seatIds.length === 0) {
    res.status(400).json({ error: 'seatIds must be a non-empty array' });
    return null;
  }
  if (seatIds.length > MAX_SEATS_PER_REQUEST) {
    res.status(400).json({ error: `cannot select more than ${MAX_SEATS_PER_REQUEST} seats at once` });
    return null;
  }
  return seatIds;
}

router.get('/events', asyncHandler(async (req, res) => {
  const { type, search } = req.query;
  const events = await eventService.searchEvents({ type, search });
  res.json({ events });
}));

router.get('/events/:eventId/shows', asyncHandler(async (req, res) => {
  const event = await eventService.getEvent(req.params.eventId);
  if (!event) return res.status(404).json({ error: 'event not found' });
  const shows = await eventService.listShowsForEvent(req.params.eventId);
  res.json({ shows });
}));

router.get('/shows/:showId', asyncHandler(async (req, res) => {
  const show = await eventService.getShowDetail(req.params.showId);
  if (!show) return res.status(404).json({ error: 'show not found' });
  res.json({ show });
}));

router.get('/shows/:showId/seatmap', asyncHandler(async (req, res) => {
  const show = await eventService.getShow(req.params.showId);
  if (!show) return res.status(404).json({ error: 'show not found' });
  const seatmap = await eventService.getShowSeatmap(req.params.showId);
  res.json({ seatmap });
}));

router.post('/shows/:showId/hold', asyncHandler(async (req, res) => {
  const show = await eventService.getShow(req.params.showId);
  if (!show) return res.status(404).json({ error: 'show not found' });

  const seatIds = validateSeatIds(req, res);
  if (!seatIds) return;

  const result = await seatService.holdSeats({
    showId: req.params.showId,
    seatIds,
    customerId: req.user.userId,
  });

  if (!result.ok) {
    return res.status(409).json({ error: `seat ${result.conflictSeatId} is no longer available` });
  }
  res.status(201).json({ seats: result.seats });
}));

router.post('/shows/:showId/confirm', asyncHandler(async (req, res) => {
  const show = await eventService.getShow(req.params.showId);
  if (!show) return res.status(404).json({ error: 'show not found' });

  const seatIds = validateSeatIds(req, res);
  if (!seatIds) return;

  const result = await seatService.confirmBooking({
    showId: req.params.showId,
    seatIds,
    customerId: req.user.userId,
  });

  if (!result.ok) {
    return res.status(409).json({ error: `seat ${result.conflictSeatId} is not held by you (hold may have expired)` });
  }
  res.status(201).json({ booking: result.booking, seats: result.seats });
}));

module.exports = router;
