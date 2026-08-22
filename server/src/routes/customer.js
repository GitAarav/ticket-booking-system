const express = require('express');
const { authenticate, roleGuard } = require('../middleware/roleGuard');
const { asyncHandler } = require('../middleware/asyncHandler');
const eventService = require('../services/eventService');

const router = express.Router();

router.use(authenticate, roleGuard('customer'));

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

module.exports = router;
