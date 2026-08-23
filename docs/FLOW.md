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

## Background: releasing abandoned holds (Checkpoint 6)

There are two separate mechanisms here, not one — worth keeping distinct when explaining this system.

```
Mechanism 1 — lazy expiry (already existed since Checkpoint 5, just now demonstrated):
  attemptSeatTransition(..., toStatus: 'held') 's WHERE clause already reads:
    status = 'available' OR (status = 'held' AND held_until < now())
  → an expired-but-not-yet-swept hold is treated as available the instant
    anyone tries to hold it — no background job involved at all

Mechanism 2 — the proactive sweep (new in Checkpoint 6):
  server/src/jobs/sweepJob.js, started from index.js (NOT app.js — deliberately
  kept out of the test-facing app so `npm test` never has a cron job running
  in the background)
    → every SWEEP_INTERVAL_SECONDS (10s), runs:
         SELECT id FROM show_seats WHERE status='held' AND held_until < now()
    → for each one found, calls the SAME attemptSeatTransition(..., toStatus:
      'available') used everywhere else — the sweep is not a special case,
      it goes through the one choke point like hold/confirm do
```

Why both exist: mechanism 1 guarantees correctness (an expired hold can never block a real customer, even if the sweep is late or briefly down). Mechanism 2 exists purely so the seat map *visibly* updates for everyone browsing, not just for the next person who happens to click that exact seat — without it, a stale seat would look "held" on-screen to onlookers even though it's actually re-holdable underneath.

**Verified as two separate proofs, since they're two separate code paths:** an expired-but-unswept seat was grabbed by a different customer with zero wait (proving mechanism 1 alone); a separate expired seat was left completely untouched for ~12 seconds and confirmed to flip to `available` on its own via direct SQL, no request involved (proving mechanism 2 alone). See `TEST_CHECKLIST.md`.

## Cancellation and waitlist auto-assignment (Checkpoint 7)

```
Client (customer token)
  → POST /customer/shows/:showId/waitlist   { categoryId }
       → waitlistService.isSoldOut()      -- rejects if seats are still available
       → waitlistService.hasActiveEntry() -- rejects a duplicate join
       → waitlistService.joinWaitlist()   -- INSERT, status='waiting'

  → POST /customer/bookings/:bookingId/cancel
       → bookingService.cancelBooking()
            opens ONE transaction:
              SELECT * FROM bookings ... FOR UPDATE   -- locks the booking row
              (ownership + already-cancelled checks)
              UPDATE bookings SET status='cancelled'
              for each seat in the booking:
                → attemptSeatTransition(client, { toStatus: 'available' })
                → waitlistService.offerNextInWaitlist(client, { showId, categoryId, seatId })
                     SELECT ... WHERE status='waiting' ORDER BY created_at LIMIT 1
                       FOR UPDATE SKIP LOCKED   -- see DECISIONS.md for why
                     if someone's waiting:
                       → attemptSeatTransition(client, { toStatus: 'held', holdMinutes: 15 })
                       → UPDATE waitlist_entries SET status='offered',
                            offer_expires_at, offered_seat_id
                     if nobody's waiting: seat just stays 'available', no-op
```

**The expiry cascade — this is the sweep job (Checkpoint 6) extended, not a new mechanism:**
```
sweepJob.js, every 10s, now runs TWO sweeps in sequence:
  1. sweepExpiredHolds()          -- unchanged from Checkpoint 6
  2. waitlistService.sweepExpiredOffers()
       SELECT * FROM waitlist_entries WHERE status='offered' AND offer_expires_at < now()
       for each stale offer, in its own transaction:
         UPDATE waitlist_entries SET status='expired'
         → offerNextInWaitlist(client, { showId, categoryId, seatId: offer.offered_seat_id })
              -- the SAME function cancellation calls; re-offers the SAME seat
              -- to whoever's now oldest in line, or no-ops if nobody's left
```

`offerNextInWaitlist()` is the one place this decision gets made, called identically by both cancellation and the expiry cascade — exactly the "one function per invariant" principle from `ORCHESTRATION.md`.

**Bug found while verifying this (see `DECISIONS.md`):** `attemptSeatTransition`'s `'available'` transition originally only accepted seats coming from `status='held'` — correct for Checkpoint 6's use case (releasing an expired hold) but wrong for cancellation, where the seat is `'booked'`. Fixed to accept both.

## The signed offer link (Checkpoint 8)

```
When an offer is created (inside offerNextInWaitlist, cancellation or cascade path):
  expiresAt = now + 15 minutes (same value used for the DB's offer_expires_at)
  token = waitlistService.issueOfferToken(waitlistEntryId, expiresAt)
       jwt.sign({ waitlistEntryId, purpose: 'waitlist_offer' }, JWT_SECRET,
                 { expiresIn: secondsUntil(expiresAt) })
  -- logged for now (console.log); this exact string is what Checkpoint 9's
  -- email body will embed as the clickable link

Client clicks the link (no login, no Authorization header)
  → POST /offers/:token/confirm         -- routes/offers.js, NOT under
                                            authenticate/roleGuard('customer')
       → waitlistService.verifyOfferToken(token)
            jwt.verify(...) + checks the `purpose` claim specifically,
            so a normal login JWT (signed with the same secret) can't
            accidentally be reused here
       → waitlistService.getWaitlistEntry(decoded.waitlistEntryId)
            reject if status != 'offered', or if offer_expires_at has passed
            (checked against the DB, not just trusting the JWT's own exp —
            SYSTEM_DESIGN.md's explicit instruction)
       → seatService.confirmBooking(...)     -- THE SAME function Checkpoint 5 built
            the seat is already held, pre-assigned to this customer, by the
            offer — so "confirming an offer" and "confirming a normal hold"
            are mechanically identical, just entered via a different door
       → waitlistService.markWaitlistEntryBooked(entry.id)
```

**Replay protection needed zero new code:** once `confirmBooking` succeeds, the seat is `'booked'`, not `'held'` anymore — so trying the same token again fails inside `confirmBooking`'s own existing guard, the same way any other stale hold attempt does. Verified directly: reused the same real token twice, second attempt got a clean `409`.

## QR + email, fault-isolated (Checkpoint 9)

```
Two places QUEUE an email — inside their OWN existing transaction, not after it:

  seatService.confirmBooking()          -- Checkpoint 5, extended
       ... existing booking + booking_seats inserts ...
       → INSERT INTO email_outbox (booking_id, type='booking_confirmation', status='pending')
       → COMMIT   -- "booking confirmed" and "email queued" happen together, or not at all

  waitlistService.offerNextInWaitlist() -- Checkpoint 7, extended
       ... existing waitlist_entries UPDATE ...
       → INSERT INTO email_outbox (waitlist_entry_id, type='waitlist_offer', status='pending')
       → (caller COMMITs — cancelBooking or the sweep's cascade)

One place SENDS them, entirely separate, on the sweep's schedule:

  sweepJob.js, every 10s, now runs a THIRD pass after the existing two:
    emailService.sendPendingEmails()
       SELECT * FROM email_outbox WHERE status='pending' LIMIT 20
       for each row:
         build content (differs by type):
           'booking_confirmation' → join bookings+users+shows+events,
                QRCode.toDataURL(booking_reference) generated fresh, embedded inline
           'waitlist_offer'       → join waitlist_entries+users+shows+events,
                re-check the entry's CURRENT status is still 'offered' (it may
                have been confirmed/expired since queuing — send nothing if so),
                issueOfferToken() regenerated fresh from the live offer_expires_at
         attempt sgMail.send(...)
           success → status='sent'
           failure → attempts += 1; status = 'failed' if attempts >= 5, else
                      stays 'pending' for the next tick; last_error recorded
```

**The critical-path/side-effect split this whole checkpoint is about:** confirming a booking or creating an offer NEVER calls SendGrid directly — it only ever writes a `pending` row to a table. Whether that email ever successfully sends is completely decoupled from whether the booking succeeded. Verified directly, not assumed: a real booking was confirmed with no SendGrid key configured at all, succeeded immediately, and its outbox row was watched through all 5 retries to `failed` while the booking's own `status` stayed `confirmed` the entire time. See `TEST_CHECKLIST.md` and `DECISIONS.md`.

## Not yet built

Real-time seat map updates (SSE + Redis pub/sub, Checkpoint 10) don't exist in code yet.
