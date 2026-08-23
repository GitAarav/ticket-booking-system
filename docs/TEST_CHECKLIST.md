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

## Checkpoint 5 — Concurrency: hold & confirm (test-first)

This is the one checkpoint with an automated test, run via `npm test` (`server/tests/concurrency.test.js`). Everything else below was checked manually.

- [x] **Red first:** test written and run *before* the hold endpoint existed — failed with 0/5 successes (all requests 404'd), confirming the test fails for the right reason
- [x] **Green after building `attemptSeatTransition()` + the hold/confirm endpoints:** `npm test` → 5 simultaneous `POST /hold` requests for the *same seat*, exactly 1 returns `201`, the other 4 return `409`
- [x] Manual 2-seat hold on the Inception show → both seats `held`, `held_until` ~10 minutes out
- [x] Manual confirm of those 2 held seats → `201`, `total_amount` correctly computed as ₹1000 (2 × Premium ₹500), both seats now `booked`
- [x] `booking_seats` rows in the database correctly link the booking to both `show_seat` ids
- [x] **No-partial-holds check:** requested 1 fresh seat + 1 already-booked seat together → `409`, and confirmed via direct SQL that the fresh seat was left `available` (the whole transaction rolled back, not just the failed seat)

## Checkpoint 6 — TTL sweep & auto-release

Both expiry mechanisms verified separately, since they're genuinely different code paths.

- [x] **Lazy expiry (no sweep involved):** a held seat was forced into an expired state via direct SQL, and a *different* customer's hold request on that exact seat succeeded immediately (`201`) in the same instant — proving the `attemptSeatTransition()` `WHERE` clause treats an expired hold as available on its own, with zero dependency on the background job
- [x] **Sweep auto-release:** a different seat was forced into the same expired state, confirmed still `status = 'held'` via direct SQL with no request touching it, then — after waiting ~12 seconds with the server running and **no API calls made at all** — confirmed via direct SQL that the seat had flipped to `status = 'available'`, `held_by_customer_id = NULL`, `held_until = NULL` entirely on its own

## Checkpoint 7 — Cancellation & waitlist

Verified end to end against a real sold-out category (Standard, 20/20 booked on the Inception show), with real accounts, not synthetic unit tests.

- [x] Joining the waitlist while seats are still available → `400`, rejected
- [x] Two different customers join the waitlist for the same sold-out category, in order → both `201`
- [x] Cancelling a confirmed booking on that category → `{"message":"booking cancelled"}`, booking's `status` flips to `cancelled` in the database
- [x] **Oldest-first offer:** after cancellation, the *first* customer to join (not the second) has their waitlist entry flip to `status = offered`, with `offered_seat_id` set to the freed seat and `offer_expires_at` ~15 minutes out — the second customer's entry stays `waiting`
- [x] **Bug caught and fixed here:** the first attempt at this test found the seat stuck as `booked` forever after cancellation, with no offer ever created — root cause was `attemptSeatTransition`'s `'available'` transition only accepting seats coming from `'held'`, not `'booked'`. Fixed (`WHERE status IN ('held', 'booked')`), re-verified, confirmed working. See `DECISIONS.md`.
- [x] **Offer-expiry cascade:** forcing the first customer's offer to expire (both `waitlist_entries.offer_expires_at` and the seat's own `held_until`, which must be forced together — see the two failed attempts logged in this session before getting it right) → after one sweep cycle, the first entry flips to `expired`, and the *second* customer's entry automatically flips to `offered`, on the exact same seat — confirmed via `show_seats` that the seat is now `held` by the second customer with a fresh ~15-minute window

## Checkpoint 8 — Time-limited offer confirm link

Verified end to end against a fresh sold-out Premium scenario, using the actual token logged by the server (a real signed JWT, not a hand-crafted stand-in).

- [x] Two customers join the Premium waitlist in order; the booking gets cancelled; server log confirms the offer (and its token) went to the *first* joiner, matching Checkpoint 7's FIFO guarantee
- [x] `POST /offers/:token/confirm` with the real, valid, unexpired token — **and no `Authorization` header at all** — → `201`, real booking created, correct `total_amount`, seat flips to `booked`; the waitlist entry itself flips to `status = booked`
- [x] **Replay protection:** reusing the exact same (already-used) token a second time → `409 "this offer is no longer valid"` — caught by `confirmBooking()`'s own guard (seat is no longer `held`), no extra code needed for this
- [x] **Expired token rejected:** a token manually signed with a negative expiry (same real secret) → `400 "invalid or expired offer link"`, `jwt.verify()`'s own expiry check firing correctly

## Checkpoint 9 — QR + email (SendGrid), fault-isolated

Run with `SENDGRID_API_KEY` genuinely unset — not a simulated failure, the actual current state of `.env`. That made the fault-isolation test and the "no key configured" case the same test.

- [x] `QRCode.toDataURL()` sanity-checked in isolation → produces a valid `data:image/png;base64,...` string
- [x] Confirming a real booking with no SendGrid key configured → succeeds immediately (`201`, `status: confirmed`) — email sending never sits on the critical path
- [x] `email_outbox` row created in the same transaction: correct `booking_id`, `type = 'booking_confirmation'`, `status = 'pending'`
- [x] **Fault isolation, full retry cycle:** watched the outbox row across 5 sweep ticks — `attempts` climbed 1→5, `last_error` correctly showed `"SENDGRID_API_KEY not configured"` each time, final `status = 'failed'` — and the booking's own `status` was re-checked at that point: still `confirmed`, completely unaffected throughout
- [x] `waitlist_offer` email type also verified: cancelling a booking with an active waiter queued an outbox row with `type = 'waitlist_offer'`, correctly joined to the waitlist entry, same fault-isolated retry behavior
- [ ] **Real email delivery (an actual message in an actual inbox) — not yet verified, needs a real SendGrid API key.** Everything up to the actual `sgMail.send()` call is proven working (content builds correctly for both email types, QR generates correctly); only the real send itself needs credentials only the project owner can provide (see `DECISIONS.md`).

## Not yet reached

Checkpoints 10–12 (real-time seat map, API contract freeze, backend deploy) — see `ORCHESTRATION.md` for what each will need to verify.
