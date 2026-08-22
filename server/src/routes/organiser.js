const express = require('express');
const { authenticate, roleGuard } = require('../middleware/roleGuard');
const { asyncHandler } = require('../middleware/asyncHandler');
const eventService = require('../services/eventService');
const venueService = require('../services/venueService');

const router = express.Router();

router.use(authenticate, roleGuard('organiser'));

const loadOwnedEvent = asyncHandler(async (req, res, next) => {
  const event = await eventService.getEvent(req.params.eventId);
  if (!event) return res.status(404).json({ error: 'event not found' });
  if (event.organiser_id !== req.user.userId) {
    return res.status(403).json({ error: 'not your event' });
  }
  req.event = event;
  next();
});

router.post('/events', asyncHandler(async (req, res) => {
  const { title, type, description } = req.body;
  if (!title) return res.status(400).json({ error: 'title is required' });
  if (!['movie', 'concert'].includes(type)) {
    return res.status(400).json({ error: 'type must be movie or concert' });
  }
  const event = await eventService.createEvent({ organiserId: req.user.userId, title, type, description });
  res.status(201).json({ event });
}));

router.get('/events', asyncHandler(async (req, res) => {
  const events = await eventService.listEvents(req.user.userId);
  res.json({ events });
}));

router.get('/events/:eventId', loadOwnedEvent, (req, res) => {
  res.json({ event: req.event });
});

router.post('/events/:eventId/shows', loadOwnedEvent, asyncHandler(async (req, res) => {
  const { venueId, showDate, showTime, pricing } = req.body;
  if (!venueId || !showDate || !showTime) {
    return res.status(400).json({ error: 'venueId, showDate, and showTime are required' });
  }
  if (!Array.isArray(pricing) || pricing.length === 0) {
    return res.status(400).json({ error: 'pricing must be a non-empty array' });
  }

  const venue = await venueService.getVenue(venueId);
  if (!venue) return res.status(404).json({ error: 'venue not found' });

  const categories = await venueService.listCategories(venueId);
  const categoryIds = new Set(categories.map((c) => c.id));
  const pricedCategoryIds = new Set(pricing.map((p) => p.categoryId));

  for (const catId of categoryIds) {
    if (!pricedCategoryIds.has(catId)) {
      return res.status(400).json({ error: `missing price for category ${catId}` });
    }
  }
  for (const { categoryId, price } of pricing) {
    if (!categoryIds.has(categoryId)) {
      return res.status(400).json({ error: `categoryId ${categoryId} does not belong to this venue` });
    }
    if (typeof price !== 'number' || price <= 0) {
      return res.status(400).json({ error: `price for category ${categoryId} must be a positive number` });
    }
  }

  const show = await eventService.createShow({
    eventId: req.params.eventId,
    venueId,
    showDate,
    showTime,
    pricing,
  });
  res.status(201).json({ show });
}));

router.get('/events/:eventId/shows', loadOwnedEvent, asyncHandler(async (req, res) => {
  const shows = await eventService.listShows(req.params.eventId);
  res.json({ shows });
}));

module.exports = router;
