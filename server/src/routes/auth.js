const express = require('express');
const { createUser, findUserByEmail, verifyPassword, issueToken } = require('../services/authService');
const { authenticate } = require('../middleware/roleGuard');

const router = express.Router();

router.post('/register', async (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: 'name, email, password, and role are required' });
  }
  if (!['customer', 'organiser', 'admin'].includes(role)) {
    return res.status(400).json({ error: 'role must be customer, organiser, or admin' });
  }

  const existing = await findUserByEmail(email);
  if (existing) {
    return res.status(409).json({ error: 'email already registered' });
  }

  const user = await createUser({ name, email, password, role });
  const token = issueToken(user);
  res.status(201).json({ user, token });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required' });
  }

  const user = await findUserByEmail(email);
  if (!user || !(await verifyPassword(user, password))) {
    return res.status(401).json({ error: 'invalid email or password' });
  }

  const token = issueToken(user);
  const { password_hash, ...safeUser } = user;
  res.json({ user: safeUser, token });
});

router.get('/me', authenticate, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
