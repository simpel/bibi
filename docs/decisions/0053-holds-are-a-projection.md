# 0053 – Holds are a database projection of line state

- **Date:** 2026-10-19
- **Status:** Accepted
- **Related:** 0022 (occupancy), 0044 (line states and the phase grid), 0051 (single source of truth), 0052

## Context
- ADR 0044 says a line's occupancy is *derived* from its state. In practice it is a second stored copy, written by application code in several operations: line create, update and archive, `line.changeState`, `ticket.changePhase`, `ticket.expireHolds`, `itemState.update` (changing `hold` or `released`), customer and ticket archive.
- Every new path that changes a line, a state or a setup must remember to resync occupancy. Forgetting one gives a room that looks free but is booked, or one that looks booked but is free.
- The `SETUP` buffer is derived from `Setup.changeoverMinutes` at write time. A later change to the changeover time does not reach existing bookings.
- The exclusion constraint (`Occupancy_no_overlap`) must stay: it is the only thing that makes double booking impossible under concurrency. A constraint needs a table, so holds cannot simply be computed on read.

## Decision
1. `Occupancy` has two kinds of rows:
   - **Manual blocks** (`MAINTENANCE`, `INTERNAL`): owned data, written by `occupancy.*` as today.
   - **Line holds** (`HOLD` and its `SETUP` buffer): a **projection** (ADR 0051), with `lineId` as a real foreign key instead of `sourceType` / `sourceId`.
2. Line holds are written **only by database triggers**, in the same transaction as the owned change:
   - on `Line` (today `ProgramItem`, ADR 0052) insert, update (item, setup, time, state, status) and archive,
   - on `ItemState` update of `hold` or `released`,
   - on `Setup` update of `changeoverMinutes`,
   - on `Item` losing `BOOKABLE` (refused while lines hold it, as today).
   One SQL function, `sync_line_occupancy(line_id)`, computes the rows. The triggers call it.
3. `Occupancy.holdKind` stays (the exclusion constraint filters on it) but is part of the projection: the trigger copies it from the line's state, and nothing else writes it.
4. An exclusion violation raised inside the trigger is mapped to `CONFLICT` with the blocking line, exactly as today. Phase moves stay atomic (ADR 0044).
5. Application code never writes line holds. A test fails if any core module calls `occupancy.create|update|updateMany` outside `features/occupancy/` manual-block operations.
6. A reconciliation query rebuilds line holds from lines and compares. It runs in the seed checks and in the test suite (rule 7 in ADR 0051).
7. Changing a setup's changeover time re-derives every future buffer. If that creates an overlap, the change is refused with `CONFLICT` listing the lines.
8. **Only lines that have not ended are re-derived.** Occupancy of ended lines is frozen. Changing a state's `hold` flag or a setup's changeover time never rewrites the past calendar or fails on old overlaps.
9. **Discoverability.** Triggers are invisible to Prisma and to `check:structure`. The SQL lives in one file per function under `packages/db/sql/` (applied by the migration), each table with a trigger says so in its Prisma doc comment, and `CLAUDE.md` lists them under Architecture principles.

Alternative considered: one TypeScript writer run by `execute` after every command for the lines it recorded. Rejected because a write that skips the hook skips the sync; a trigger cannot be skipped.

## Consequences
- Every line-changing operation becomes simpler: it changes the line, and holds follow. The hold-sync calls in core are removed.
- Logic moves into SQL, which is harder to read and test than TypeScript. Mitigation: one function, one migration file, and the reconciliation test, which covers it from the outside.
- The `polymorphic source` columns go away for line holds. `Occupancy.sourceType` / `sourceId` are removed (manual blocks have no source).
- `heldAt` moves to line state history (ADR 0054).

## Addendum 2026-10-20 – buffers and allocations
- Setup buffers also exist for soft holds as non-blocking rows, a `TEARDOWN` type is added, and allocation windows are projected by the same trigger family, so the `Occupancy` key grows beyond `(lineId, type)` (ADR 0059).
