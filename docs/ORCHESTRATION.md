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

**Checkpoint 4 — Customer: browse & seat map read**
- `11` event listing/filters · `12` show seatmap read
- **Verify:** filter events, open a show, returned seatmap matches DB state.

**Checkpoint 5 — Core concurrency: hold & confirm (test-first)**
- `13` concurrency test first (N parallel requests, one seat, assert exactly 1 succeeds — red)
- `14` `attemptSeatTransition()` + hold endpoint until green · `15` multi-seat hold in one transaction · `16` hold→confirm endpoint
- **Verify:** `npm test` green; manual 2-seat hold+confirm produces correct `booking_seats` rows.

**Checkpoint 6 — TTL sweep & auto-release**
- `17` `node-cron` sweep releasing expired holds via `attemptSeatTransition()`
- **Verify:** shortened-TTL hold auto-releases with no manual call; lazy expiry also proven (a fresh hold on an expired-but-unswept seat succeeds).

**Checkpoint 7 — Cancellation & waitlist**
- `18` waitlist join · `19` cancellation endpoint · `20` `offerNextInWaitlist()` wired to cancellation · `21` sweep extended for expired-offer cascade
- **Verify:** 2 waitlisted customers, cancel a booking → oldest offered; let it expire → next customer auto-offered.

**Checkpoint 8 — Time-limited offer confirm link**
- `22` signed offer token + `/offers/:token` (reuses checkpoint-5 hold→confirm path)
- **Verify:** valid token books; expired token rejected.

**Checkpoint 9 — QR + email (SendGrid), fault-isolated**
- `23` QR generation on confirm · `24` `email_outbox` insert in the same transaction as confirm · `25` SendGrid send via sweep worker
- **Verify:** real email arrives with scannable QR; then break the SendGrid key and confirm a booking again — **booking must still succeed**.

**Checkpoint 10 — Real-time seat map**
- `26` in-process emitter + SSE endpoint (via `seatMapSerializer()`) · `27` Redis pub/sub behind the same interface
- **Verify:** two SSE clients on one show; a hold in one arrives on the other within ~1s.

**Checkpoint 11 — API contract freeze**
- `28` OpenAPI/Postman doc generated from the real endpoints
- **Verify:** every endpoint callable in Postman with example payloads. **This doc, not the server source, goes to Antigravity.**

**Checkpoint 12 — Backend deploy**
- `29` Render config + env (Neon, Upstash, SendGrid)
- **Verify:** live health check; re-run the full curl sequence against the deployed URL.

### Phase B — Frontend (Antigravity, against the checkpoint-11 contract only)

13 — browsing/filter (`30`) · 14 — seat grid + countdown + SSE hook (`31`) · 15 — checkout/hold-confirm (`32`) · 16 — booking history/cancel (`33`) · 17 — organiser dashboard (`34`) · 18 — admin venue builder UI (`35`)
**Verify per checkpoint:** manual click-through against the deployed backend.

### Phase C — Integration & polish (back here)

19 — wire frontend to backend, fix contract drift (`36`) · 20 — Vercel deploy (`37`) · 21 — full end-to-end pass + bugfixes (`38`) · 22 — finalize README (`39`) · 23 — trim `SYSTEM_DESIGN.md` into the ≤800-word write-up deliverable (`40`) · 24 — seed/demo data script (`41`)

~41 natural commit points across 25 checkpoints — comfortably over the 20-commit target.

## Deliverables checklist

- [ ] Zip of source (single repo, `/server` + `/client`)
- [ ] README: setup, `.env.example`, API docs, DB schema, hold/waitlist explanation
- [ ] Hosted URL — backend (Render) + frontend (Vercel)
- [ ] ≤800-word system design write-up (derived from `SYSTEM_DESIGN.md`)
- [ ] ≥20 commits, sole authorship, no co-author trailer
