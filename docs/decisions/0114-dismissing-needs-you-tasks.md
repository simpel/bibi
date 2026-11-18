# 0114 – Dismissing a Needs you task

- **Date:** 2026-11-18
- **Status:** Accepted (the user, 2026-11-18)
- **Amends:** 0110 (tasks are derived on read, never stored)
- **Related:** 0051, 0094

## Context
- Needs you lists tasks derived on read from run sheets, holds, line issues, quotes, messages, receivables and statuses (ADR 0110). A task goes away only when the data no longer calls for it.
- Some tasks are known and handled outside Bibi (the customer confirmed by phone, the clash is intended). Today they stay at the top of the notification panel until the data changes, and push real work down.
- ADR 0110 rejected a stored, tickable task list because it drifts from the data it describes.

## Decision
1. A member can dismiss a task from Needs you with the checkmark on its row, after a confirm dialog. It hides the task for that member only; others who get the same task still see it. The row stays greyed out until the next page.
2. A dismissal is stored, not the task: `NeedsYouDismissal` (organization, user, order, task key, fingerprint, created at), unique per organization, user and task key; dismissing again replaces it. The order is a foreign key, so the dismissal goes with the order.
3. The fingerprint is the task's facts: its due time plus the kind's own facts (the count, the open amount, the clashing order, the issue kind). A changed run sheet is a new version with its own id, so its task has a new key. Unread messages are due "now" on every read, so only their count counts. `myWork.tasks` leaves out a task whose key has a dismissal with the same fingerprint; when a fact changes, the task is back. The group moving with time (Soon to Today to Late) is not a change.
4. One command, `myWork.dismissTask({ key })`, permission `self:write`, in web, GraphQL, REST and MCP. The server derives the caller's tasks again and stores the fingerprint it finds; a key that is not among them is `NOT_FOUND`. The assistant proposes it and the member approves, like every mutation.

## Rejected
- Store the task list with a done flag: the list ADR 0110 rejected; it drifts from the data.
- Hide a dismissed key forever: a run sheet changed again, or a new unread message, would never reach the member.
- Snooze until tomorrow: a task the member has handled comes back every morning.
- Dismiss for everyone on the order: one member's call would hide work from colleagues who act on it too.

## Consequences
- No undo command in this step: a dismissal is undone by the facts changing. Listing and restoring dismissed tasks can follow.
- Dismissals of tasks that no longer exist stay until their order is deleted; they are small and never shown.
- The home spec, the notification panel, the support answer on Needs you, the demo seed and the isolation test cover it.
