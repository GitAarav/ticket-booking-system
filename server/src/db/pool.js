const { Pool } = require('pg');

// Any hosted Postgres (Neon, Supabase, Render, Railway, ...) requires SSL and
// won't necessarily spell "sslmode=require" in the connection string it hands
// you — only a local dev database (on localhost) genuinely has no SSL.
const isLocal = /^postgres(ql)?:\/\/[^@]*@(localhost|127\.0\.0\.1)[:/]/.test(
  process.env.DATABASE_URL || ''
);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isLocal ? false : { rejectUnauthorized: false },
});

module.exports = { pool };
