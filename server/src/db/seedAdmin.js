require('dotenv').config();
const { createUser, findUserByEmail } = require('../services/authService');
const { pool } = require('./pool');

async function run() {
  const name = process.env.SEED_ADMIN_NAME || 'Admin';
  const email = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;

  if (!email || !password) {
    console.error('Set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD, then re-run: npm run seed:admin');
    process.exit(1);
  }

  const existing = await findUserByEmail(email);
  if (existing) {
    console.log(`Admin already exists: ${email}`);
    await pool.end();
    return;
  }

  const admin = await createUser({ name, email, password, role: 'admin' });
  console.log(`Admin created: ${admin.email} (${admin.id})`);
  await pool.end();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
