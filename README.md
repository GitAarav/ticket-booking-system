# Ticket Booking System

Movie/concert ticket booking platform: visual seat maps, TTL-based seat holds with auto-release, waitlist auto-assignment on cancellation, QR-code email tickets.

**Status:** in progress — see `docs/ORCHESTRATION.md` for the build roadmap and current checkpoint.

## Docs

- [`docs/REQUIREMENTS.md`](docs/REQUIREMENTS.md) — what this system needs to do
- [`docs/SYSTEM_DESIGN.md`](docs/SYSTEM_DESIGN.md) — data model, concurrency mechanism, TTL/waitlist/real-time design
- [`docs/ORCHESTRATION.md`](docs/ORCHESTRATION.md) — build order, checkpoints, verification steps
- [`docs/DECISIONS.md`](docs/DECISIONS.md) — why each mid-build choice was made, not just what changed
- [`docs/CONSTRAINTS.md`](docs/CONSTRAINTS.md) — hard rules the codebase must not violate
- [`docs/FLOW.md`](docs/FLOW.md) — how a request actually travels through the code, file by file
- [`docs/TEST_CHECKLIST.md`](docs/TEST_CHECKLIST.md) — everything verified so far, and how
- [`docs/ROLLBACK.md`](docs/ROLLBACK.md) — how to undo a change that breaks something
- [`docs/API_CONTRACT.yaml`](docs/API_CONTRACT.yaml) — the frozen API contract (OpenAPI 3.0, importable directly into Postman)

## Setup

**Backend** (`/server`):

1. `cd server && npm install`
2. Copy `.env.example` to `.env` and fill in `DATABASE_URL` (a local Postgres works fine for dev — see `docs/DECISIONS.md`), `JWT_SECRET`, and leave `SENDGRID_API_KEY`/`REDIS_URL` blank until deploy
3. `npm run migrate` — applies the schema
4. `SEED_ADMIN_EMAIL=... SEED_ADMIN_PASSWORD=... npm run seed:admin` — creates your first admin account (public registration only allows customer/organiser, by design — see `docs/DECISIONS.md`)
5. `npm run dev` (auto-restart) or `npm start` — server listens on `PORT` (default 4000), and starts the TTL/waitlist/email sweep job automatically
6. `npm test` — runs the automated concurrency test

**Frontend** (`/client`): built separately in Antigravity against `docs/API_CONTRACT.yaml`, not against this repo's source — see `docs/ORCHESTRATION.md`'s "Tool handoff" section.

## API docs

See [`docs/API_CONTRACT.yaml`](docs/API_CONTRACT.yaml) — a complete OpenAPI 3.0 spec covering all 29 real endpoints (auth, admin, organiser, customer, waitlist offers), with request/response schemas and realistic example payloads for every one. Import it directly into Postman ("Import" → select the file) or any OpenAPI-compatible tool. This file, not this repository's source code, is what the frontend is built against.

## Seat hold & waitlist logic

_Summarized here at Checkpoint 22; full reasoning lives in `docs/SYSTEM_DESIGN.md`._
