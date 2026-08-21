const express = require('express');
const { authenticate, roleGuard } = require('../middleware/roleGuard');

const router = express.Router();

router.get('/ping', authenticate, roleGuard('admin'), (req, res) => {
  res.json({ message: 'admin access confirmed', userId: req.user.userId });
});

module.exports = router;
