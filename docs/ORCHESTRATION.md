# Orchestration & Build Roadmap

How `REQUIREMENTS.md` and `SYSTEM_DESIGN.md` get turned into working software: build order, tool handoffs, verification per checkpoint, and commit mapping.

## Tool handoff

**Phase A — backend + infra (Claude, this repo) → Phase B — frontend (Antigravity, built only against the frozen API contract from checkpoint 11, never against backend source) → Phase C — integration + deploy (Claude, back in this repo).**

Why contract-first: a frontend built against a stable, documented contract can be built by a different tool/session without ever reading the server implementation. This is what an API-first team does when frontend and backend work in parallel — the contract is the interface, not the code.

## How the build is sequenced (and why)

1. **Find the hard invariants first.** From the requirements: two customers never both hold the same seat; an expired hold must not stay unbookable; a cancelled seat goes to the longest-waiting person, not a race of page refreshes. Everything else (venues, pricing, browsing) is CRUD around these three.
2. **Data model follows the invariants**, not the screens — see `SYSTEM_DESIGN.md`.
3. **API contract frozen before the UI exists** (checkpoint 11).
4. **Build in risk order, not alphabetical order:** boring CRUD (auth, venues, events) first and fast; the hold/TTL/waitlist logic gets built deliberately, with a test proving the invariant, not left for "polish."
5. **Test only where the risk lives** — concurrency/TTL/waitlist get a test written first; CRUD is verified manually.
6. **Deploy early** (checkpoint 12, before the frontend exists) to surface env/config issues while the surface area is small.
7. **Document as each piece is built**, not reconstructed from memory at the end.

## Two principles applied at every checkpoint

**Fault isolation** — every action has one critical-path write (must succeed) and zero-or-more side effects (email, QR, SSE broadcast) that must never be able to fail or roll back the critical write. See checkpoint 9's explicit "kill the SendGrid key, booking must still succeed" verification.

**Reusability** — one function per invariant, called everywhere that invariant applies, never reimplemented:
- `attemptSeatTransition()` — the only code that ever changes `show_seats.status`; used by hold, confirm, offer-confirm, release, sweep.
- `offerNextInWaitlist()` — used identically by cancellation and by offer-expiry cascade.
- `emailService.enqueue()` — used identically by booking-confirm and waitlist-offer.
- `seatMapSerializer()` — produces both the REST GET response and the SSE push payload, so they can't drift apart.

## Checkpoint roadmap

Commit message style: `type: short description`, one logical change per commit, **no co-author trailer** — every commit is authored solely by the repo owner.

### Phase A — Backend & Infra

**Checkpoint 0 — Docs + scaffold + schema — ✅ done**
- `1` this docs/ trio (requirements, system design, orchestration) — written before any app code
- `2` repo scaffold: `/server`, `/client`, `.gitignore`, `.env.example`, README skeleton
- `3` DB schema/migrations (all tables from `SYSTEM_DESIGN.md`)
- **Verify:** migrations run clean against Neon Postgres; `\dt` lists every table; FKs resolve.
- Verified against local Postgres instead (see `DECISIONS.md`); full results in `TEST_CHECKLIST.md`.

**Checkpoint 1 — Auth & roles — ✅ done**
- `4` register/login, bcrypt hash, JWT issue · `5` `roleGuard(role)` middleware
- **Verify:** register one user per role, log in, hit a guarded route with wrong role → 403, right role → 200.
- Results in `TEST_CHECKLIST.md`. Hardened post-launch: public registration restricted to customer/organiser only (`DECISIONS.md`).

**Checkpoint 2 — Admin: venue & seat layout — ✅ done**
- `6` venue + category CRUD · `7` bulk seat create + seatmap read
- **Verify:** create venue, 2 categories, bulk-insert 40 seats, `GET` seatmap returns full grid correctly.
- Results in `TEST_CHECKLIST.md`. Self-audited afterward — 7 real fixes applied (validation limits, FK-safety, auth hardening); see `DECISIONS.md`.

**Checkpoint 3 — Organiser: events, shows, pricing — ✅ done**
- `8` event CRUD · `9` show creation (clones `venue_seats` → `show_seats`, all `available`) · `10` per-category show pricing
- **Verify:** `show_seats` row count == `venue_seats` row count after show creation.
- Results in `TEST_CHECKLIST.md`. Flow traced in `FLOW.md`.

**Checkpoint 4 — Customer: browse & seat map read — ✅ done**
- `11` event listing/filters · `12` show seatmap read
- **Verify:** filter events, open a show, returned seatmap matches DB state.
- Results in `TEST_CHECKLIST.md`. Flow traced in `FLOW.md`.

**Checkpoint 5 — Core concurrency: hold & confirm (test-first) — ✅ done**
- `13` concurrency test first (N parallel requests, one seat, assert exactly 1 succeeds — red)
- `14` `attemptSeatTransition()` + hold endpoint until green · `15` multi-seat hold in one transaction · `16` hold→confirm endpoint
- **Verify:** `npm test` green; manual 2-seat hold+confirm produces correct `booking_seats` rows.
- Results in `TEST_CHECKLIST.md`. Flow traced in `FLOW.md`.

**Checkpoint 6 — TTL sweep & auto-release — ✅ done**
- `17` `node-cron` sweep releasing expired holds via `attemptSeatTransition()`
- **Verify:** shortened-TTL hold auto-releases with no manual call; lazy expiry also proven (a fresh hold on an expired-but-unswept seat succeeds).
- Results in `TEST_CHECKLIST.md`. Flow traced in `FLOW.md`.

**Checkpoint 7 — Cancellation & waitlist — ✅ done**
- `18` waitlist join · `19` cancellation endpoint · `20` `offerNextInWaitlist()` wired to cancellation · `21` sweep extended for expired-offer cascade
- **Verify:** 2 waitlisted customers, cancel a booking → oldest offered; let it expire → next customer auto-offered.
- Results in `TEST_CHECKLIST.md`. Flow traced in `FLOW.md`. One real bug found and fixed mid-verification — see `DECISIONS.md`.

**Checkpoint 8 — Time-limited offer confirm link — ✅ done**
- `22` signed offer token + `/offers/:token` (reuses checkpoint-5 hold→confirm path)
- **Verify:** valid token books; expired token rejected.
- Results in `TEST_CHECKLIST.md`. Flow traced in `FLOW.md`.

**Checkpoint 9 — QR + email (SendGrid), fault-isolated — ✅ done**
- `23` QR generation on confirm · `24` `email_outbox` insert in the same transaction as confirm · `25` SendGrid send via sweep worker
- **Verify:** real email arrives with scannable QR; then break the SendGrid key and confirm a booking again — **booking must still succeed**.
- Fault-isolation verified early with `SENDGRID_API_KEY` genuinely unset (doubled as "the key is broken" test). Real delivery verified 2026-08-25 during Checkpoint 12: a real SendGrid account + verified sender + real booking → the project owner confirmed the actual email arrived with the correct amount and a scannable QR. Results in `TEST_CHECKLIST.md`.

**Checkpoint 10 — Real-time seat map — ⚠️ core mechanism done, Redis path intentionally skipped**
- `26` in-process emitter + SSE endpoint (via `seatMapSerializer()`) · `27` Redis pub/sub behind the same interface
- **Verify:** two SSE clients on one show; a hold in one arrives on the other within ~1s.
- In-process path fully verified with two real simultaneous `curl -N` SSE clients (see `TEST_CHECKLIST.md`). The Redis-backed path is implemented behind the same interface but deliberately not being provisioned for this deploy — a single free-tier Render instance has no multi-process fan-out problem for the in-process `EventEmitter` to solve, so Upstash would add a dependency with no real benefit here. Also flagged: browser `EventSource` can't set auth headers, so the live frontend falls back to polling every ~4s regardless — a known compromise, not true push. See `DECISIONS.md`.

**Checkpoint 11 — API contract freeze — ✅ done**
- `28` OpenAPI/Postman doc generated from the real endpoints
- **Verify:** every endpoint callable in Postman with example payloads. **This doc, not the server source, goes to Antigravity.**
- `docs/API_CONTRACT.yaml` — 29 endpoints, OpenAPI 3.0, validated with a real validator + spot-checked against the live server. Results in `TEST_CHECKLIST.md`. This is the file to hand to Antigravity for Phase B.

**Checkpoint 12 — Backend deploy — ✅ done**
- `29` Render config + env (Supabase, SendGrid)
- Live at `https://ticket-booking-backend-94vk.onrender.com`
- Production database provisioned on Supabase (Session Pooler connection — the direct/IPv6
  host doesn't resolve from most networks, including the one this was built on; see
  `DECISIONS.md`). `server/src/db/pool.js`'s SSL detection fixed to trigger on any non-localhost
  host, not by string-matching `sslmode=require` (Supabase's string doesn't contain that text).
  Redis/Upstash deliberately skipped — see Checkpoint 10.
- **Verify:** live health check (`200`, DB round-trip via `SELECT 1`) ✓. Full curl sequence
  against the deployed URL — register/login/role-guard, venue/event/show setup, concurrency test
  (5 simultaneous holds on one seat → exactly one `201`, four `409`, over real network latency to
  Supabase) ✓. A real booking confirmed the deployed sweep job actually runs and calls SendGrid
  successfully (`email_outbox` reached `status = 'sent'`) ✓ — real inbox delivery was proven
  earlier against `server/.env` locally with the same key. Results in `TEST_CHECKLIST.md`.

### Phase B — Frontend (Antigravity, against the checkpoint-11 contract)

Antigravity built the frontend against the frozen contract as planned, but not cleanly through
checkpoints 13–18 — it shipped as one large batch that turned out to be running entirely on
fabricated client-side mock data (every API call silently fell back to invented data on
failure, and nothing was ever wired to a real backend). That got discovered and fixed in Phase C
below rather than as a separate Phase B pass. Functionally equivalent to 13–18 being done, just
not achieved in that order.

### Phase C — Integration & polish (back here)

**Checkpoint 19 — wire frontend to backend, fix contract drift — ✅ done**
- `36` Rewired the frontend's mock-data API layer to the real backend (Vite dev proxy, no
  fallback-to-fake-data), fixed the resulting cascade of real bugs this exposed (broken
  organiser venue picker, silently-dropped venue categories/seats, ₹400-for-every-seat pricing,
  a fake show ID that hung the seat map, a stale-selection race after a hold expires). See
  `DECISIONS.md` for the full list.
- Synced `docs/API_CONTRACT.yaml` with the two endpoints and two seatmap fields added during
  that work (`GET /organiser/venues`, `GET /organiser/events/{eventId}/summary`,
  `heldByCustomerId`/`heldUntil` on `LiveSeatmapSeat`) — it had drifted from the real API.
- **Verify:** re-validated with `npx @apidevtools/swagger-cli validate` (same tool as the
  original freeze) and spot-checked both new endpoints against the live server — responses
  match the documented schemas exactly. Results in `TEST_CHECKLIST.md`.

**Checkpoint 20 — Vercel deploy — ⏳ not started**
- `37` Needs a configurable production API base URL in the frontend first (currently only works
  via the dev-only Vite proxy) — see plan.
- **Verify:** full click-through against the real deployed pair, not localhost.

**Checkpoint 21 — full end-to-end pass + bugfixes — ⏳ not started**
- `38` Re-run `TEST_CHECKLIST.md`'s scenarios against the live deployment.

**Checkpoint 22 — finalize README — ⏳ not started**
- `39` README currently has a stale claim (says the frontend is "built separately in
  Antigravity, not this repo's source" — no longer true) and an empty section under "Seat hold
  & waitlist logic". Needs the real hosted URLs once deployed.

**Checkpoint 23 — trim `SYSTEM_DESIGN.md` into the ≤800-word write-up deliverable — ⏳ not started**
- `40` The submission artifact the brief actually asks for doesn't exist yet — `SYSTEM_DESIGN.md`
  is the ~1000-word internal working doc, not the trimmed deliverable.

**Checkpoint 24 — seed/demo data script — ⏳ not started**
- `41` So the live URL shows a populated app on first open, not an empty one.

~41 natural commit points across 25 checkpoints — comfortably over the 20-commit target.

## Deliverables checklist

- [ ] Zip of source (single repo, `/server` + `/client`)
- [ ] README: setup, `.env.example`, API docs, DB schema, hold/waitlist explanation
- [x] Hosted URL — backend (Render): `https://ticket-booking-backend-94vk.onrender.com` — [ ] frontend (Vercel)
- [ ] ≤800-word system design write-up (derived from `SYSTEM_DESIGN.md`)
- [x] ≥20 commits, sole authorship, no co-author trailer
