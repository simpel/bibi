# Assignments and responsibilities

Current behaviour. Why: ADR 0034 (responsibilities are not roles), 0055 (derived, store only choices), 0056 (records).

## Responsibility
- Organization data managed by an admin (`responsibility.list|get|create|update|archive`): a name (e.g. "Head of kitchen"), the item entity types it covers, a default assignee (a member) and default followers (both user ids). It is not a permission; permissions are presets (`docs/specs/permissions.md`).
- `checkResponsibilityContents` refuses non-item types and non-members (`VALIDATION`). The covered types and default followers are join rows, not id lists.
- Sheet definitions go to a responsibility. A generated sheet is addressed to that responsibility's assignee and followers on the ticket, snapshotted in `SheetRecipient` at send time; later changes do not rewrite who received it.

## Assignment
- Every assignable subject (ticket, item) has exactly one main assignee (no responsibility) and any number of followers. A ticket also has one assignment per responsibility that applies to it. Quote has none of its own; it uses the ticket's.
- Followers are need-to-know: they see the subject in "Following" and are included where the assignee is (sheets, later notifications). Rules never require them.
- A new ticket gets the creating member as main assignee (a ticket created from a template: the creating member too).

## What is stored and what is derived
- `Assignment` and `AssignmentFollower` rows mean "someone chose this". They are written only by `assignment.assign`, `follow` and `unfollow`. `AssignmentFollower.effect` is `FOLLOW` or `UNFOLLOW`, so a member can leave a default.
- Which responsibilities apply to a ticket is derived from its active lines' item types. No rows are created or archived when lines change.
- The assignee for (ticket, responsibility) is the explicit row if one exists, else the responsibility's default assignee. Followers are the defaults plus explicit follows minus explicit unfollows.
- `assignment.list` and `assignment.listMine` return the derived result with a `source` (`EXPLICIT`, `DEFAULT`) per assignee and follower, so the UI can show "default from Head of kitchen".
- Rows reference the subject's `Record` (`recordId`, composite FK, ADR 0056) while the API keeps `subjectType`/`subjectId`; `checkSlot` checks the record exists with that base.
- Assignee and followers must be members (`VALIDATION`). All commands are audited and exist on every surface.

## Rules that use assignments
- A status with `requiresAssignee` needs the ticket's main assignee (derived) to enter. Responsibility assignments are never required, but an unassigned one is shown as a warning.
- `ticket.list` filters by `assigneeId` and `followerId`.
