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

## Setup

_Filled in as `/server` and `/client` are built — see Checkpoint 0 in `docs/ORCHESTRATION.md`._

## API docs

_Added at Checkpoint 11 (API contract freeze)._

## Seat hold & waitlist logic

_Summarized here at Checkpoint 22; full reasoning lives in `docs/SYSTEM_DESIGN.md`._
