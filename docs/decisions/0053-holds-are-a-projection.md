# 0053 – Holds are a database projection of line state

- **Date:** 2026-10-19
- **Status:** Accepted
- **Related:** 0022 (occupancy), 0044 (line states and the phase grid), 0051 (single source of truth), 0052

## Context
- A line's occupancy is derived from its state (ADR 0044), but it was a second stored copy written by application code in many operations. Forgetting one path gives a room that looks free but is booked.
- The exclusion constraint on occupancy must stay. It is the only thing that prevents double booking under concurrency, and a constraint needs a table.
- The setup buffer was computed at write time, so a changed changeover time never reached existing bookings.

## Decision
1. `Occupancy` has two kinds of rows. Manual blocks (maintenance, internal) are owned data. Line holds and their setup buffers are a projection (ADR 0051), keyed by a real foreign key to the line.
2. Line holds are written only by database triggers, in the same transaction as the owned change, through one SQL function. Triggers sit on line changes, on item state `hold` or `released` changes, on setup changeover changes and on an item losing `BOOKABLE`.
3. `holdKind` stays because the constraint filters on it, but only the trigger writes it.
4. An exclusion violation inside the trigger maps to `CONFLICT` with the blocking line. Phase moves stay atomic.
5. Application code never writes line holds. A test enforces it.
6. A reconciliation query rebuilds holds from lines and compares. It runs in the seed checks and the test suite.
7. Changing a changeover time re-derives future buffers and is refused with `CONFLICT` if that creates an overlap.
8. Only lines that have not ended are re-derived. The past calendar is frozen.
9. Triggers are invisible to Prisma, so each lives in one SQL file and is listed in the db package's `CLAUDE.md`.

## Rejected
- One TypeScript writer run after every command: a write that skips the hook skips the sync. A trigger cannot be skipped.

## Consequences
- Line-changing operations get simpler. The hold-sync calls in core are removed.
- Logic moves into SQL, which is harder to read. The reconciliation test covers it from outside.
- `heldAt` moves to line state history (ADR 0054).
- Soft setup buffers, a teardown type and allocation windows use the same trigger family (ADR 0059).
