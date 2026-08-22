# Test Checklist

What's been verified, how, and the actual result — not a vibe check. Updated as each checkpoint lands. All checks so far were run manually against a local Postgres database with real HTTP requests (`curl`), not an automated test suite (automated tests are scoped to concurrency logic only — see `CONSTRAINTS.md`).

## Checkpoint 0 — Scaffold + schema

- [x] `npm run migrate` applies `001_init.sql` cleanly against a fresh database
- [x] `psql -d ticket_booking -c "\dt"` lists all 13 expected tables
- [x] Server boots (`node src/index.js`) and `GET /health` returns `{"status":"ok"}`, proving the DB connection pool works

## Checkpoint 1 — Auth & roles

- [x] Register one user per self-registerable role (customer, organiser) — each returns a `201` with a user object and a JWT
- [x] `POST /auth/login` with the correct password → `200`, fresh JWT
- [x] `POST /auth/login` with the wrong password → `401 "invalid email or password"`
- [x] `GET /admin/ping` (an admin-only test route) with a customer's token → `403 "insufficient role"`
- [x] `GET /admin/ping` with an admin's token → `200 "admin access confirmed"`

## Checkpoint 2 — Admin venues, categories, seats

- [x] Create a venue → `201`, returned with the correct `admin_id`
- [x] Create 2 categories (Premium, Standard) on that venue → both `201`
- [x] Bulk-create 40 seats (4 rows × 10, split across the 2 categories) → all 40 created in one request
- [x] `GET .../seatmap` → returns exactly 4 rows, 40 total seats, each correctly tagged with its category name

### Audit fixes (post-Checkpoint 2)

- [x] `POST /auth/register` with `"role": "admin"` → `400`, rejected (previously a full auth bypass)
- [x] Register with a 1-character password → `400 "password must be at least 8 characters"`
- [x] Register with `"not-an-email"` → `400 "email is not a valid email address"`
- [x] Legitimate customer registration still succeeds → `201` (no regression)
- [x] `npm run seed:admin` creates an admin account directly, bypassing the now-closed public registration path
- [x] Bulk seat create with a `categoryId` from a different venue → `400`, rejected
- [x] Bulk seat create with a non-integer `seatNumber` → `400`, rejected
- [x] `DELETE` a venue that has a dependent show (inserted directly via SQL to simulate Checkpoint 3 not existing yet) → `409` with a clear message, not a raw DB error
- [x] Login response confirmed to never include `password_hash` after the `toSafeUser()` refactor

## Checkpoint 3 — Organiser events & shows

- [x] Create an event as an organiser → `201`
- [x] Create a show against the Checkpoint 2 venue, with pricing for both categories → `201`
- [x] `show_seats` row count for that show == 40 (matches `venue_seats` count), all `status = 'available'`
- [x] `show_pricing` correctly shows Premium ₹500 / Standard ₹300
- [x] Creating a show with pricing missing for one category → `400`, rejected, and confirmed **zero** stray `shows` rows were left behind (transaction correctness)

## Checkpoint 4 — Customer browse & seat map read

- [x] `GET /customer/events?type=movie` → returns Inception; `?type=concert` → returns empty array (no false positives)
- [x] `GET /customer/events?search=incep` → matches "Inception" via partial, case-insensitive search
- [x] `GET /customer/events/:eventId/shows` → returns the show with venue name/address joined in
- [x] `GET /customer/shows/:showId` → returns event info + venue info + both category prices, correctly combined
- [x] `GET /customer/shows/:showId/seatmap` → 40 seats, all `status: "available"`, grouped by row, each seat tagged with its category — reads live `show_seats`, not the static `venue_seats` blueprint

## Not yet reached

Checkpoints 5–12 (concurrency hold/confirm, TTL sweep, waitlist, QR/email, real-time, API contract freeze, deploy) — see `ORCHESTRATION.md` for what each will need to verify.
