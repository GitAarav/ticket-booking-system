# Decisions Log

`REQUIREMENTS.md` captures decisions locked in *before* any code was written. This file captures decisions made *during* the build — the ones that only came up once real code existed to react to. Newest at the bottom, grouped by checkpoint.

## Checkpoint 0 — Scaffold

**Local Postgres instead of Neon for development.** The target deploy database is Neon (per `SYSTEM_DESIGN.md`), but signing up for a Neon account mid-build would have blocked progress on something outside the code. The machine already had Postgres 18 and pgAdmin installed locally via Homebrew. A `ticket_booking` database was created locally instead; `server/.env` points at it. Real Neon/Upstash/SendGrid credentials are only needed at Checkpoint 12 (deploy) and Checkpoint 9 (email) — there's no reason to provision them earlier.

## Checkpoint 1 — Auth

**Sign-in-with-Google/Firebase considered and rejected in favor of bcrypt + JWT built by hand.** OAuth doesn't remove the need for a role-guard system — the app still has to issue its own session and track customer/organiser/admin, since Google has no concept of those roles. It also adds a fourth external account (on top of Neon/Upstash/SendGrid) plus OAuth consent screen and redirect-URI configuration. Plain bcrypt+JWT is a smaller total surface area and stays inside code the project already owns — it also directly demonstrates backend/API design skill, which is part of what this assignment is evaluated on.

## Checkpoint 2 — Admin venues/seats, and the follow-up audit

**Async route errors handled via one shared `asyncHandler` wrapper, not try/catch per route.** Express 4 does not forward a rejected promise inside an `async` route handler to the error middleware automatically — an unhandled rejection there just hangs the request. Wrapping every route once avoids repeating that boilerplate everywhere, and was retrofitted into Checkpoint 1's auth routes and the `/health` route too, once the gap was found during the Checkpoint 2 self-audit.

**Admin self-registration closed off.** The original `/auth/register` trusted whatever `role` the caller sent — anyone could register as `"admin"` and get full admin powers, a complete authorization bypass. Fixed by restricting public registration to `customer`/`organiser` only. Since that removes the only path to ever create an admin account, `npm run seed:admin` (`server/src/db/seedAdmin.js`) was added as the out-of-band way to create one, driven by env vars rather than an open HTTP route.

**Bulk seat creation capped at 500 seats per request, with category-ownership validation.** Without a limit, one request could insert an unbounded number of rows and tie up a database connection. Without the ownership check, a `categoryId` from a *different* venue could be attached to a seat, corrupting the data model. Both are cheap checks done in the route before the write.

**`deleteVenue` checks for dependent shows before deleting, returning a clean `409`.** `shows.venue_id` has no `ON DELETE CASCADE` (deliberately — deleting a venue should never silently delete real bookings' shows), so an unguarded delete would surface a raw Postgres foreign-key error as an opaque `500`. A pre-check with a specific error message is clearer for both a human caller and for debugging.

**`password_hash` exposure prevented with one shared `toSafeUser()` helper.** `findUserByEmail` does `SELECT *`, so it returns the hash. Originally only the login route remembered to strip it out via manual destructuring — fragile as more routes get added. Centralizing it in `authService.toSafeUser()` makes "safe" the only path, not something every future caller has to remember.

## Checkpoint 3 — Organiser events/shows

**Shows can be created against any admin's venue, not just venues "owned" by that organiser.** Nothing in `REQUIREMENTS.md` ties an organiser to a specific admin or venue — an admin manages venues as a shared physical resource, and any organiser schedules a show at any existing venue, the way a real cinema chain's booking platform works (the venue owner and the event scheduler are different roles with no 1:1 relationship). `POST /organiser/events/:id/shows` therefore only checks that the venue and every referenced category exist — it does not check who created the venue.

**Show creation is one database transaction: the show row, all `show_pricing` rows, and the full `venue_seats → show_seats` copy happen together.** If any part fails (e.g. a bad category), nothing is left half-created — this was verified by attempting a show with incomplete pricing and confirming zero `shows` rows were left behind.
