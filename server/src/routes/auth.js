const express = require('express');
const bcrypt = require('bcrypt');
const { createUser, findUserByEmail, issueToken, toSafeUser } = require('../services/authService');
const { authenticate } = require('../middleware/roleGuard');
const { asyncHandler } = require('../middleware/asyncHandler');
const { authLimiter } = require('../middleware/rateLimit');

const router = express.Router();

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SELF_REGISTERABLE_ROLES = ['customer', 'organiser'];
// A hash of a value nobody will ever type, used to keep the login timing
// path identical whether or not the email exists — otherwise a nonexistent
// email returns instantly while a wrong password takes as long as a bcrypt
// compare, letting an attacker infer which emails are registered.
const DUMMY_HASH = '$2b$10$E.2LZc8Wa1.dTqSuDXHYcO/WHajrOv5TVlPt1cpMg6WC1SeE9e.46';

router.post('/register', authLimiter, asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: 'name, email, password, and role are required' });
  }
  if (!EMAIL_REGEX.test(email)) {
    return res.status(400).json({ error: 'email is not a valid email address' });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'password must be at least 8 characters' });
  }
  if (!SELF_REGISTERABLE_ROLES.includes(role)) {
    return res.status(400).json({ error: 'role must be customer or organiser' });
  }

  const existing = await findUserByEmail(email);
  if (existing) {
    return res.status(409).json({ error: 'email already registered' });
  }

  const user = await createUser({ name, email, password, role });
  const token = issueToken(user);
  res.status(201).json({ user, token });
}));

router.post('/login', authLimiter, asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required' });
  }

  const user = await findUserByEmail(email);
  // Always run a real bcrypt compare, even for a nonexistent email, against
  // a fixed dummy hash — otherwise a missing user returns instantly while a
  // wrong password takes as long as bcrypt does, leaking which emails exist.
  const validPassword = await bcrypt.compare(password, user ? user.password_hash : DUMMY_HASH);
  if (!user || !validPassword) {
    return res.status(401).json({ error: 'invalid email or password' });
  }

  const token = issueToken(user);
  res.json({ user: toSafeUser(user), token });
}));

router.get('/me', authenticate, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
