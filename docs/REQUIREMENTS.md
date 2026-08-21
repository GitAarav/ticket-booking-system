# Requirements

## Origin

Take-home assignment for a shortlisting round: build a ticket booking platform for movies/concerts covering seat holds with TTL auto-release, waitlist auto-assignment on cancellation, and QR-code email tickets on confirmed bookings.

## Actors

- **Admin** — creates and manages venues: seat layout, seat categories (Premium/Standard/etc).
- **Organiser** — registers, logs in, creates movie/event listings against a venue with date, time, and per-category pricing. Views booking summary and revenue per event.
- **Customer** — registers, logs in, browses/filters events, views a live seat map, selects seats, checks out, views booking history, can cancel a booking, can join a waitlist when sold out.

## Functional requirements

1. Visual seat map per show, seat status = available / held / booked, live-updating for all viewers.
2. Selecting seats places a hold with a configurable TTL (default 10 min). Held seats are unavailable to other customers.
3. Abandoned checkout ⇒ held seats auto-release with no manual action; seat map reflects this in real time.
4. Two customers must never simultaneously hold or book the same seat — concurrency-safe by construction, not by convention.
5. Successful booking ⇒ confirmation email with a QR code encoding the booking reference.
6. Sold-out category ⇒ customer can join a waitlist for that category.
7. Booking cancellation ⇒ seat offered to the longest-waiting customer on that category's waitlist; they get an email with a time-limited link to complete the booking.
8. Waitlist offer not completed in time ⇒ offer cascades automatically to the next customer in line.
9. Customer can view booking history and cancel a booking.
10. Organiser can view a booking summary and revenue total per event.

## Decisions locked in before design

| Decision | Choice | Why |
|---|---|---|
| Backend | Node.js / Express | Team's chosen stack |
| Database | PostgreSQL (Neon, free tier) | Source of truth; strong transactional/locking guarantees needed for the concurrency requirement |
| Cache/pub-sub | Redis (Upstash, free tier) | Real-time fan-out only — **not** used for correctness (see `SYSTEM_DESIGN.md`) |
| Email | Twilio SendGrid (100/day free tier) | Requested explicitly; distinct product from core Twilio SMS/voice |
| Testing | Test-first, scoped to the seat-hold / TTL / waitlist logic only | Those are the only parts with real concurrency/timing risk; CRUD is verified manually |
| Repo layout | Single repo, `/server` + `/client` | One artifact to submit, one commit history |
| Frontend build tool | Antigravity, built only against a frozen API contract (not backend source) | Contract-first handoff between tools |
| Commit policy | ≥20 commits, author = project owner only, no `Co-Authored-By` trailer | Explicit ask |

## Deliverables (per assignment)

1. Zip of complete source code
2. README: setup guide, `.env.example`, API docs, DB schema, seat-hold/waitlist logic explanation
3. Hosted URL (backend + frontend)
4. System design write-up, ≤800 words, covering seat hold/TTL, concurrency prevention, waitlist auto-assignment, time-limited offer handling
