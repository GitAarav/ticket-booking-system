# Constraints

Hard rules for this project — for any AI session or contributor to read before touching code. These aren't preferences, they're things that must not be silently violated.

## Process

- **Every checkpoint must be verified working with real requests/responses before it's committed** — not "the code looks right." See `TEST_CHECKLIST.md` for what's already been proven and how.
- **No `Co-Authored-By` trailer on any commit.** Every commit is authored solely by the repo owner — an explicit, repeated ask.
- **One commit per logical checkpoint change**, short plain-language message (`type: short description`), not a long bulleted AI-style message.
- **No new npm dependency without flagging it and the reason first.** (Example: `express-rate-limit` was considered during the Checkpoint 2 audit and deliberately deferred, not silently skipped — see `DECISIONS.md`.)

## Testing scope

- **Test-first is scoped only to seat-hold / TTL / waitlist concurrency logic** (Checkpoint 5 onward) — that's the only code with real race-condition/timing risk. CRUD routes (auth, venues, events, shows) are verified manually via real requests, not unit-tested. Don't add a test suite around CRUD "for completeness" — that contradicts the decision recorded in `REQUIREMENTS.md`.

## Data & secrets

- **`.env` and anything under it must never be committed.** Local dev values (`JWT_SECRET`, local `DATABASE_URL`) are throwaway, not real credentials — but the habit of not committing `.env` still applies unconditionally.
- **Real Neon/Upstash/SendGrid credentials aren't needed until Checkpoint 12 (deploy) / Checkpoint 9 (email).** Don't provision those accounts prematurely; local Postgres covers dev until then.

## Architecture

- **Single repo, `/server` + `/client`, one commit history.** Don't split into multiple repos.
- **Frontend is built separately in Antigravity against the frozen API contract from Checkpoint 11 — never against backend source.** Contract-first handoff; the contract doc is what gets shared, not this codebase.
- **Once `attemptSeatTransition()` exists (Checkpoint 5), it is the only code path allowed to change `show_seats.status`.** Hold, confirm, offer-confirm, release, and the TTL sweep all must call it — never write a competing `UPDATE show_seats SET status = ...` anywhere else. This is the entire correctness guarantee for the concurrency requirement; bypassing it reintroduces the double-booking bug the whole design exists to prevent.
- **Redis is never the source of truth for whether a hold succeeded** — only Postgres is (see `SYSTEM_DESIGN.md`). Redis is for real-time fan-out only.
