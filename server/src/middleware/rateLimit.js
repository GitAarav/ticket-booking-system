const rateLimit = require('express-rate-limit');

// Brute-force / credential-stuffing guard on login and registration only —
// deliberately not applied to every route, since most of the API is already
// gated behind a valid JWT.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'too many attempts, please try again later' },
});

module.exports = { authLimiter };
