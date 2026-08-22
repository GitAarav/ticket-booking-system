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

## Not yet built

The customer-facing seat hold → confirm → TTL sweep → waitlist → QR/email flow (Checkpoints 4–9) doesn't exist in code yet. Once it does, this file gets a new section tracing `attemptSeatTransition()` — the single function every seat-status change must go through (see `CONSTRAINTS.md`).
