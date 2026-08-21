const express = require('express');
const { createUser, findUserByEmail, verifyPassword, issueToken, toSafeUser } = require('../services/authService');
const { authenticate } = require('../middleware/roleGuard');
const { asyncHandler } = require('../middleware/asyncHandler');

const router = express.Router();

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SELF_REGISTERABLE_ROLES = ['customer', 'organiser'];

router.post('/register', asyncHandler(async (req, res) => {
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

router.post('/login', asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required' });
  }

  const user = await findUserByEmail(email);
  if (!user || !(await verifyPassword(user, password))) {
    return res.status(401).json({ error: 'invalid email or password' });
  }

  const token = issueToken(user);
  res.json({ user: toSafeUser(user), token });
}));

router.get('/me', authenticate, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
