# Ticket Booking System

Movie/concert ticket booking platform: visual seat maps, TTL-based seat holds with auto-release, waitlist auto-assignment on cancellation, QR-code email tickets.

**Status:** in progress — see `docs/ORCHESTRATION.md` for the build roadmap and current checkpoint.

## Docs

- [`docs/REQUIREMENTS.md`](docs/REQUIREMENTS.md) — what this system needs to do
- [`docs/SYSTEM_DESIGN.md`](docs/SYSTEM_DESIGN.md) — data model, concurrency mechanism, TTL/waitlist/real-time design
- [`docs/ORCHESTRATION.md`](docs/ORCHESTRATION.md) — build order, checkpoints, verification steps

## Setup

_Filled in as `/server` and `/client` are built — see Checkpoint 0 in `docs/ORCHESTRATION.md`._

## API docs

_Added at Checkpoint 11 (API contract freeze)._

## Seat hold & waitlist logic

_Summarized here at Checkpoint 22; full reasoning lives in `docs/SYSTEM_DESIGN.md`._
