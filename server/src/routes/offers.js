const express = require('express');
const { asyncHandler } = require('../middleware/asyncHandler');
const waitlistService = require('../services/waitlistService');
const seatService = require('../services/seatService');

const router = express.Router();

router.post('/:token/confirm', asyncHandler(async (req, res) => {
  let decoded;
  try {
    decoded = waitlistService.verifyOfferToken(req.params.token);
  } catch (err) {
    return res.status(400).json({ error: 'invalid or expired offer link' });
  }

  const entry = await waitlistService.getWaitlistEntry(decoded.waitlistEntryId);
  if (!entry || entry.status !== 'offered') {
    return res.status(409).json({ error: 'this offer is no longer valid' });
  }
  if (new Date(entry.offer_expires_at) < new Date()) {
    return res.status(409).json({ error: 'this offer has expired' });
  }

  const result = await seatService.confirmBooking({
    showId: entry.show_id,
    seatIds: [entry.offered_seat_id],
    customerId: entry.customer_id,
  });

  if (!result.ok) {
    return res.status(409).json({ error: 'seat is no longer held for you (offer may have expired)' });
  }

  await waitlistService.markWaitlistEntryBooked(entry.id);

  res.status(201).json({ booking: result.booking, seats: result.seats });
}));

module.exports = router;
