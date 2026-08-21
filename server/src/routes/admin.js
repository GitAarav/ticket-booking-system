const express = require('express');
const { authenticate, roleGuard } = require('../middleware/roleGuard');
const { asyncHandler } = require('../middleware/asyncHandler');
const venueService = require('../services/venueService');

const router = express.Router();
const MAX_BULK_SEATS = 500;

router.use(authenticate, roleGuard('admin'));

router.get('/ping', (req, res) => {
  res.json({ message: 'admin access confirmed', userId: req.user.userId });
});

const loadOwnedVenue = asyncHandler(async (req, res, next) => {
  const venue = await venueService.getVenue(req.params.venueId);
  if (!venue) return res.status(404).json({ error: 'venue not found' });
  if (venue.admin_id !== req.user.userId) {
    return res.status(403).json({ error: 'not your venue' });
  }
  req.venue = venue;
  next();
});

router.post('/venues', asyncHandler(async (req, res) => {
  const { name, address } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });
  const venue = await venueService.createVenue({ adminId: req.user.userId, name, address });
  res.status(201).json({ venue });
}));

router.get('/venues', asyncHandler(async (req, res) => {
  const venues = await venueService.listVenues(req.user.userId);
  res.json({ venues });
}));

router.get('/venues/:venueId', loadOwnedVenue, (req, res) => {
  res.json({ venue: req.venue });
});

router.patch('/venues/:venueId', loadOwnedVenue, asyncHandler(async (req, res) => {
  const { name, address } = req.body;
  const venue = await venueService.updateVenue(req.params.venueId, { name, address });
  res.json({ venue });
}));

router.delete('/venues/:venueId', loadOwnedVenue, asyncHandler(async (req, res) => {
  const showCount = await venueService.countShowsForVenue(req.params.venueId);
  if (showCount > 0) {
    return res.status(409).json({ error: `venue has ${showCount} show(s) scheduled; cancel or reassign them first` });
  }
  await venueService.deleteVenue(req.params.venueId);
  res.status(204).send();
}));

router.post('/venues/:venueId/categories', loadOwnedVenue, asyncHandler(async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });
  const category = await venueService.createCategory(req.params.venueId, name);
  res.status(201).json({ category });
}));

router.get('/venues/:venueId/categories', loadOwnedVenue, asyncHandler(async (req, res) => {
  const categories = await venueService.listCategories(req.params.venueId);
  res.json({ categories });
}));

router.post('/venues/:venueId/seats/bulk', loadOwnedVenue, asyncHandler(async (req, res) => {
  const { seats } = req.body;
  if (!Array.isArray(seats) || seats.length === 0) {
    return res.status(400).json({ error: 'seats must be a non-empty array' });
  }
  if (seats.length > MAX_BULK_SEATS) {
    return res.status(400).json({ error: `cannot create more than ${MAX_BULK_SEATS} seats in one request` });
  }

  const categories = await venueService.listCategories(req.params.venueId);
  const validCategoryIds = new Set(categories.map((c) => c.id));

  for (const [index, seat] of seats.entries()) {
    if (!validCategoryIds.has(seat.categoryId)) {
      return res.status(400).json({ error: `seat[${index}]: categoryId does not belong to this venue` });
    }
    if (typeof seat.rowLabel !== 'string' || seat.rowLabel.trim() === '') {
      return res.status(400).json({ error: `seat[${index}]: rowLabel must be a non-empty string` });
    }
    if (!Number.isInteger(seat.seatNumber) || seat.seatNumber < 1) {
      return res.status(400).json({ error: `seat[${index}]: seatNumber must be a positive integer` });
    }
  }

  const created = await venueService.bulkCreateSeats(req.params.venueId, seats);
  res.status(201).json({ seats: created });
}));

router.get('/venues/:venueId/seatmap', loadOwnedVenue, asyncHandler(async (req, res) => {
  const seatmap = await venueService.getSeatmap(req.params.venueId);
  res.json({ seatmap });
}));

module.exports = router;
