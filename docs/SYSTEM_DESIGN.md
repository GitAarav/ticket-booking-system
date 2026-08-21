# System Design

This is the working design doc, written before any application code. It's the source for the final ≤800-word write-up deliverable (trimmed later, in the polish phase) and for the README's "seat hold / waitlist logic" section.

## Data model

```
users            (id, name, email, password_hash, role[customer|organiser|admin], created_at)

venues           (id, admin_id, name, address)
venue_categories (id, venue_id, name)                 -- e.g. Premium, Standard
venue_seats      (id, venue_id, category_id, row_label, seat_number, pos_x, pos_y)
                                                        -- physical layout, reusable across shows

events           (id, organiser_id, title, type[movie|concert], description)
shows            (id, event_id, venue_id, date, time)
show_pricing     (show_id, category_id, price)

show_seats       (id, show_id, venue_seat_id, category_id,
                   status[available|held|booked],
                   held_by_customer_id, held_until, updated_at)
                                                        -- seat map lives PER SHOW, not per venue

bookings         (id, booking_reference, customer_id, show_id, total_amount,
                   status[confirmed|cancelled], created_at)
booking_seats    (booking_id, show_seat_id)

waitlist_entries (id, show_id, category_id, customer_id,
                   status[waiting|offered|expired|booked],
                   created_at, offer_expires_at)        -- FIFO via created_at

email_outbox     (id, booking_id, waitlist_entry_id, type, status[pending|sent|failed],
                   attempts, last_error, created_at)
```

`show_seats` (not `venue_seats`) is what carries live status, because the same physical seat is an independent booking decision per show.

## Concurrency: preventing double-holds/double-bookings

**The bug this avoids:** reading seat status in application code, checking "is it available," then writing a hold — two concurrent requests can both pass the check before either writes (check-then-act race).

**The fix:** a single atomic conditional UPDATE — the WHERE clause *is* the lock, because Postgres serializes concurrent writers to the same row via row-level locking on UPDATE:

```sql
UPDATE show_seats
SET status = 'held', held_by_customer_id = $customerId, held_until = now() + interval '10 minutes'
WHERE id = $seatId
  AND (status = 'available' OR (status = 'held' AND held_until < now()))
RETURNING *;
```

0 rows returned ⇒ seat unavailable, reject. There is no window between "check" and "write" — they're the same statement. This one function (`attemptSeatTransition()`) is the *only* code path allowed to change `show_seats.status`; hold, confirm, offer-confirm, release, and the TTL sweep all call it instead of writing their own UPDATE.

Multi-seat holds wrap every seat's UPDATE in one DB transaction — any seat failing the WHERE condition rolls back the whole request (no partial holds).

## Seat hold TTL — three options considered

| Option | Mechanism | Verdict |
|---|---|---|
| Redis TTL + keyspace notification | `SETEX` on the hold key, subscriber releases on expiry event | Rejected — free-tier/serverless Redis doesn't reliably support `notify-keyspace-events`; a dropped event leaves a seat stuck held forever, and correctness would depend on Redis instead of Postgres |
| BullMQ delayed job per hold | Queue schedules a release job at TTL | Rejected — needs a persistent worker + Redis features that are flaky on free tiers; extra infra for no correctness gain over option 3 |
| **Postgres `expires_at` + lazy check + periodic sweep** | `held_until` column; a seat is bookable-by-anyone the instant `held_until < now()`, checked *inside* the same atomic UPDATE above; a `node-cron` sweep every ~10s just flips stale rows to `available` for UI tidiness | **Chosen.** Correctness never depends on an event being delivered. Even if the sweep is late, the WHERE-clause check makes an expired hold immediately re-holdable. Zero extra infra beyond Postgres, which is already required. |

TTL precision only needs to be "within a sweep interval" — irrelevant for a multi-minute hold. Redis is kept in the stack, but for what it's actually good at: real-time fan-out (below), and an optional `SET NX PX` fast-fail lock to cut DB contention under a hot-seat stampede — never the source of truth for whether a hold succeeded.

## Real-time seat map

**Chosen: Server-Sent Events (SSE)**, not WebSockets, not polling.

- Polling (2–4s) technically works but is the weakest answer to an explicit "real-time" requirement.
- WebSockets are bidirectional, but the client only ever *receives* seat-status pushes (booking actions go through normal REST POST) — full duplex is unneeded complexity, and a persistent WS is fragile against a free-tier host that sleeps on inactivity.
- SSE (`EventSource`) gives real push updates, auto-reconnects with zero client code, and is a one-line Express handler (`text/event-stream`).

Architecture: `attemptSeatTransition()` (and the sweep job) publish to an in-process event emitter behind a small interface; a Redis pub/sub channel (`show:{id}:seats`) sits behind the same interface so the design survives moving to multiple backend instances without changing the SSE handler. Both the SSE push payload and the REST `GET seatmap` response are produced by the same `seatMapSerializer()`, so they can never drift out of sync.

## Waitlist auto-assignment & time-limited offers

State machine per `waitlist_entries` row: `waiting → offered → booked`, or `waiting → offered → expired → (next entry offered)`.

Two trigger points, both calling the same `offerNextInWaitlist(showId, categoryId)`:

1. **Booking cancellation** — a `booked` seat in a category with a waitlist frees the seat, then offers it to the oldest `waiting` entry.
2. **Offer expiry cascade** — the same sweep job that releases stale holds also finds `waitlist_entries` where `status='offered' AND offer_expires_at < now()`, marks them `expired`, releases the seat, and calls `offerNextInWaitlist` again.

```sql
UPDATE show_seats SET status='held', held_by_customer_id=$nextCustomerId,
  held_until = now() + interval '15 minutes'   -- offer TTL, longer than a normal hold
WHERE id = $seatId AND status = 'available'
RETURNING *;
```

On success: waitlist entry → `offered`, `offer_expires_at` set, email sent with a signed time-limited link (`/offers/:token`, token encodes `waitlist_entry_id` + expiry, verified server-side against `offer_expires_at`). The link completes the booking through the **exact same** hold→confirm code path as a normal booking — a waitlist offer is just a hold pre-assigned to one customer, not a separate booking mechanism.

## QR code + email delivery (fault-isolated)

QR generated server-side (`qrcode` npm package) encoding only the opaque `booking_reference` — never raw seat/customer data.

**Principle: a side effect must never break the critical path.** Booking confirmation = seat status transition + booking rows, committed in one transaction — that's the critical path. Email is a separate step: inserting an `email_outbox` row happens in the *same transaction* as the booking (so "confirmed" and "email queued" can never disagree), but *sending* it is a distinct step processed by the sweep worker via SendGrid, wrapped in its own try/catch with retry via `attempts`/`status`. If SendGrid is down, the booking still succeeds; the outbox row just stays `pending`/`failed` and retries later. This is verified explicitly (see `ORCHESTRATION.md` checkpoint 9), not assumed.

## Auth & roles

JWT-based auth, `role` claim ∈ `{customer, organiser, admin}`, `roleGuard(role)` middleware factory guards routes.

## Deployment architecture

Postgres → Neon · Redis → Upstash · Backend → Render (free web service, runs the Express API + the `node-cron` sweep in-process) · Frontend → Vercel · Email → Twilio SendGrid.
