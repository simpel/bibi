# 0055 – Assignments store only explicit choices; the rest is derived

- **Date:** 2026-10-19
- **Status:** Accepted
- **Related:** 0034 (fixed roles and responsibilities), 0051 (single source of truth), 0052, 0056
- **Spec:** `docs/specs/assignments-and-responsibilities.md`

## Context
- ADR 0034 planned one stored assignment per responsibility covering an order's lines, copied from defaults and kept in sync by application code.
- That copies two facts. A changed default did not reach existing orders, and a newly covered type created no assignments on open orders.

## Decision
1. Which responsibilities apply is derived from the order's active lines' item types. No rows are created or archived when lines change.
2. Who answers is derived with inheritance (ADR 0051): an explicit assignment, else the responsibility's default assignee. Followers are defaults plus explicit follows minus explicit unfollows.
3. A row means someone chose it. Only `assign`, `follow` and `unfollow` write rows. Reads return the derived result with its source.
4. A sent sheet snapshots its recipients at send time.

## Rejected
- Syncing stored assignments from lines and responsibilities: it needs a job to repair drift.

## Consequences
- Nothing to sync. The earlier plan in #250 is replaced.
- `listMine` combines explicit rows with orders whose derived responsibilities default to the caller. Measure before adding a projection.
- `requiresAssignee` checks the derived main assignee.
