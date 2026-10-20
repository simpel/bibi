# 0055 – Assignments store only explicit choices; the rest is derived

- **Date:** 2026-10-19
- **Status:** Accepted
- **Related:** 0034 (fixed roles and responsibilities), 0051 (single source of truth), 0052, 0056
- **Spec:** `docs/specs/assignments-and-responsibilities.md`

## Context
- ADR 0034 planned one stored `Assignment` per responsibility that covers a ticket's lines, copied from the responsibility's defaults, created when a covered line appears and archived when the last one goes.
- That copies two facts (which responsibilities apply, and their defaults) and keeps them in sync in application code. Changing a default assignee did not reach existing tickets, and adding a covered type created no assignments on open tickets.

## Decision
- **Which responsibilities apply is derived** from the ticket's active lines' item types. No rows are created or archived when lines change.
- **Who answers is derived with inheritance** (ADR 0051): an explicit `Assignment` row, else the responsibility's default assignee. Followers are the defaults plus explicit follows minus explicit unfollows (`AssignmentFollower.effect`).
- **Rows mean "someone chose this"** and are written only by `assign`, `follow` and `unfollow`. Reads return the derived result with its `source`.
- **A sent sheet snapshots its recipients** at send time.
- Rejected: syncing stored assignments from lines and responsibilities.

## Consequences
- Nothing to sync and no job to fix stale assignments; the plan in #250 is replaced.
- `listMine` queries explicit rows plus tickets whose derived responsibilities default to the caller. It needs an index on line item types per ticket (ADR 0056) and is measured before adding a projection.
- `requiresAssignee` checks the derived main assignee.
