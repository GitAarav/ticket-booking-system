require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { pool } = require('./db/pool');
const { asyncHandler } = require('./middleware/asyncHandler');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const organiserRoutes = require('./routes/organiser');
const customerRoutes = require('./routes/customer');
const offersRoutes = require('./routes/offers');

const app = express();
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL }));
app.use(express.json({ limit: '100kb' }));

app.get('/health', asyncHandler(async (req, res) => {
  await pool.query('SELECT 1');
  res.json({ status: 'ok' });
}));

app.use('/auth', authRoutes);
app.use('/admin', adminRoutes);
app.use('/organiser', organiserRoutes);
app.use('/customer', customerRoutes);
app.use('/offers', offersRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'internal server error' });
});

module.exports = app;
