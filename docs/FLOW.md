# Execution Flow

How a request actually travels through the code, file by file. Written to make the system explainable without re-reading every route — useful for onboarding, debugging, and walking someone else through the design. Grows as each checkpoint adds a new path.

## Registering & logging in

```
Client
  → POST /auth/register or /auth/login
  → server/src/index.js          (app.use('/auth', authRoutes))
  → server/src/routes/auth.js    (validates input, calls authService)
  → server/src/services/authService.js
       createUser()   → bcrypt.hash() → INSERT INTO users
       findUserByEmail() + verifyPassword() → bcrypt.compare()
       issueToken()   → jwt.sign() using JWT_SECRET
  → response: { user: toSafeUser(user), token }
```

`toSafeUser()` strips `password_hash` before the user object ever leaves `authService.js` — no route has to remember to do this itself.

## Every authenticated / role-guarded request after that

```
Client
  → sends "Authorization: Bearer <token>" on every request
  → server/src/middleware/roleGuard.js
       authenticate()   → jwt.verify() using JWT_SECRET → attaches req.user = { userId, role }
       roleGuard(...roles) → checks req.user.role is in the allowed list, else 403
  → only if both pass, the actual route handler runs
```

`authenticate` and `roleGuard` are composed per-router (e.g. `router.use(authenticate, roleGuard('admin'))` in `admin.js`), so every route under that router is protected without repeating the check in each handler.

## Admin: building a venue (Checkpoint 2)

```
Client (admin token)
  → POST /admin/venues                          → venueService.createVenue()
  → POST /admin/venues/:id/categories            → venueService.createCategory()
  → POST /admin/venues/:id/seats/bulk            → admin.js validates (max 500, category
                                                     belongs to this venue, row/seat shape)
                                                   → venueService.bulkCreateSeats()
                                                     (one DB transaction — all seats or none)
  → GET /admin/venues/:id/seatmap                → venueService.getSeatmap()
                                                     (joins venue_seats + venue_categories,
                                                      groups by row_label for the frontend grid)
```

`loadOwnedVenue` middleware (in `admin.js`) runs before any `:venueId` route — it 404s if the venue doesn't exist and 403s if it belongs to a different admin, so every route below it can assume `req.venue` is valid and owned by the caller.

## Organiser: scheduling a show (Checkpoint 3)

```
Client (organiser token)
  → POST /organiser/events                       → eventService.createEvent()
  → POST /organiser/events/:eventId/shows
       organiser.js validates:
         - venue exists (venueService.getVenue)
         - every category in that venue has a price (venueService.listCategories)
       → eventService.createShow()   — one DB transaction:
            1. INSERT INTO shows
            2. INSERT INTO show_pricing  (one row per category)
            3. SELECT * FROM venue_seats WHERE venue_id = ...
            4. INSERT INTO show_seats for every venue_seat found,
               status = 'available'  (this is the "static blueprint
               becomes a live bookable map" step — see SYSTEM_DESIGN.md)
       → if any step fails, the whole transaction rolls back —
         verified by submitting incomplete pricing and confirming
         zero shows rows were created
```

`loadOwnedEvent` middleware works the same way as `loadOwnedVenue` — 404/403 before the route body runs, so handlers don't re-check ownership themselves.

## Customer: browsing & the live seat map (Checkpoint 4)

```
Client (customer token)
  → GET /customer/events?type=...&search=...
       → eventService.searchEvents()
            (JOINs events → shows, so only events with at least one
             scheduled show are returned — nothing unbookable shows up)
  → GET /customer/events/:eventId/shows
       → eventService.listShowsForEvent()   (joins in venue name/address)
  → GET /customer/shows/:showId
       → eventService.getShowDetail()       (show + event + venue + pricing,
                                               combined into one response)
  → GET /customer/shows/:showId/seatmap
       → eventService.getShowSeatmap()
            reads show_seats (NOT venue_seats — this is the live,
            per-show copy created back in Checkpoint 3's createShow()),
            joined with venue_seats for row/position and
            venue_categories for the category name, grouped by row
```

This is the first response in the system that includes a live `status` field per seat (`available` / `held` / `booked`). Right now everything reads `available` because nothing writes any other status yet — that starts at Checkpoint 5.

## Customer: holding and booking seats (Checkpoint 5)

```
Client (customer token)
  → POST /customer/shows/:showId/hold   { seatIds: [...] }
       routes/customer.js validates seatIds shape (max 10, non-empty)
       → seatService.holdSeats()
            opens ONE db transaction, then for each seatId in order:
              → attemptSeatTransition(client, { seatId, toStatus: 'held', customerId })
                   UPDATE show_seats SET status='held', held_until=now()+10min
                   WHERE id = seatId
                     AND (status='available' OR (status='held' AND held_until < now()))
                   -- the WHERE clause IS the concurrency guard: check-and-write
                   -- happen as one atomic statement, so two simultaneous
                   -- requests for the same seat can never both succeed
              → if a seat's UPDATE affects 0 rows (already taken), the WHOLE
                transaction is rolled back immediately — no partial holds,
                verified in TEST_CHECKLIST.md
       → 201 with all held seats, or 409 naming the seat that blocked it

  → POST /customer/shows/:showId/confirm   { seatIds: [...] }
       → seatService.confirmBooking()
            same one-transaction pattern, but the guard is different:
              → attemptSeatTransition(client, { seatId, toStatus: 'booked', customerId })
                   UPDATE ... WHERE status='held' AND held_by_customer_id=customerId
                     AND held_until >= now()
                   -- only the person currently holding it, before it expires,
                   -- can convert a hold into a real booking
            once every seat transitions successfully:
              → INSERT INTO bookings   (total_amount computed from show_pricing)
              → INSERT INTO booking_seats, one row per seat
       → 201 with the booking + seats, or 409 if a hold expired/was stolen
```

`attemptSeatTransition()` (`server/src/services/seatService.js`) is the single function both of these call — and per `CONSTRAINTS.md`, it must stay the only code path that ever writes `show_seats.status`, including the TTL sweep and waitlist logic still to come.

**How this was actually verified, not just written:** an automated test (`server/tests/concurrency.test.js`) fires 5 simultaneous hold requests at the *same* seat from 5 different customers and asserts exactly 1 succeeds. It was run once before this logic existed (failed — "red", 0/5 succeeded since the route 404'd) and again after (passed — "green", 1/5 succeeded, 4/5 got `409`). See `TEST_CHECKLIST.md`.

## Not yet built

TTL sweep (auto-release of abandoned holds), waitlist auto-assignment, and QR/email delivery (Checkpoints 6–9) don't exist in code yet.
