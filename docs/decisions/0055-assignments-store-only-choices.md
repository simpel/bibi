# 0055 – Assignments store only explicit choices; the rest is derived

- **Date:** 2026-10-19
- **Status:** Accepted
- **Related:** 0034 (fixed roles and responsibilities), 0051 (single source of truth), 0052, 0056

## Context
- ADR 0034 and the plan in #250: a ticket gets one stored `Assignment` per responsibility that covers its lines' item types, copied from the responsibility's default assignee and followers. Assignments are created when a covered line appears and archived when the last one goes.
- That is a copy of two facts (which responsibilities apply, and their defaults) kept in sync by application code. Changing a responsibility's default assignee does not reach existing tickets. Adding a covered type to a responsibility does not create assignments on open tickets.

## Decision
1. **Which responsibilities apply to a ticket is derived** from its active lines' item types and the responsibilities that cover them. No rows are created or archived when lines change.
2. **Who answers for a responsibility on a ticket is derived with inheritance** (ADR 0051 rule 1):
   - an explicit `Assignment` row for (ticket, responsibility) if there is one,
   - else the responsibility's `defaultAssigneeId`.
3. **Followers are derived the same way:** the responsibility's default followers, plus explicit follows, minus explicit unfollows. `AssignmentFollower` gets `effect` (`FOLLOW`, `UNFOLLOW`) so a member can leave a default.
4. `Assignment` rows now mean "someone chose this". They are written only by `assignment.assign`, `follow` and `unfollow`. The main assignment (no responsibility) stays explicit as today.
5. `assignment.list` and `assignment.listMine` return the derived result, with `source` (`EXPLICIT`, `DEFAULT`) per assignee and follower, so the UI can show "default from Head of kitchen".
6. A sent `Sheet` snapshots its recipients at send time (ADR 0051 snapshot). Later changes do not rewrite who received it.

## Consequences
- #250 is replaced by this design. Nothing to sync, and no job to fix stale assignments.
- `listMine` becomes a query over explicit rows plus tickets whose derived responsibilities default to the caller. That needs an index on line item types per ticket (from ADR 0056 join tables) and is measured before adding a projection.
- `requiresAssignee` checks the derived main assignee.
