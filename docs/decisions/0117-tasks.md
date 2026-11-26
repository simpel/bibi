# 0117 – Tasks around a customer, before or beside an order

- **Date:** 2026-11-25
- **Status:** Accepted (the user, 2026-11-25)
- **Amended:** 2026-11-26 (the user): customer and order are editable; see Decision 2.
- **Related:** 0003, 0021, 0034, 0043, 0050, 0056, 0059, 0081, 0094, 0110, 0113, 0114

## Context
- A prospect calls and wants a site visit before there is any scope. The sales rep needs it in Bibi and on the calendar, does the visit, and only then starts an order. The same holds for tastings, planning meetings and deadlines such as "final headcount due".
- None of these are sold or delivered, so they are not lines (ADR 0052): they would land on quotes, run sheets and the order's period, and a site visit can come before any order exists.
- Internal prep (setup, teardown, AV, cleaning) is already covered by line buffers, demands and allocations (ADR 0059). The old *Status 2* `Task` in the domain model, linked to a line, is replaced.
- Needs you already calls its derived reminders "tasks" (`myWork.tasks`, ADR 0110, 0114).

## Decision
1. A `Task` is a `Record` with a new base `TASK` (ADR 0056): the organization creates its own task types with custom fields, and nothing is built in. A task type has a shape: `MEETING` (start and end) or `DEADLINE` (one due time).
2. A task belongs to a customer and a contact at that customer (both required, as on an order, ADR 0081). It may be linked to an order of the same customer; the first link is `task.linkOrder`, and `task.update` later moves it to another order of that customer or unlinks it, and may move the task to another customer (the order must then belong to it). "Create order" from a task creates the order and links the task in one command. A task never turns into an order and an order never needs a task.
3. A task may name an item (e.g. the room to show). It only warns when the item is busy (`ITEM_BUSY`, derived); it never holds or blocks.
4. A task has one assignee plus followers through `Assignment` (ADR 0034), a note, and is open or done (`doneAt`, `doneBy`). Archiving is the delete.
5. Access: a new feature `task` (group bookings, read, write, delete; ADR 0050); members read and write, managers and admins have all. A linked task is seen by whoever sees its order (ADR 0113); an unlinked task is related through its own creator, assignee and followers.
6. Operations `task.list|get|create|update|complete|reopen|linkOrder|archive` on every surface (ADR 0003). Assigning notifies the assignee (ADR 0094). An open task due today or overdue is a Needs you item for its assignee.
7. Pipelines show orders only; an order card and row carry its next open task. The calendar shows tasks in a lane of their own, and on the room's row when a task names a room, drawn as outlines, never as filled blocks.
8. Needs you's derived items are renamed "needs" (`myWork.needs`, `myWork.dismissNeed`, `NeedsYouDismissal.needKey`), so "task" means only this entity.

## Rejected
- Site visits as lines: they would show on quotes, run sheets and the order's period, and need an order before the visit.
- A task that converts into an order: one request would have two records and the visit's history would split.
- A separate Meeting entity next to deadlines: the only difference is a span or a due time; two entities would double every surface.
- Tasks as pipeline cards: an order can have several tasks, and the pipeline answers where each deal is.
- Holding the room for a site visit: showing a room should not block a booking; a warning is enough.
- Keeping "task" for Needs you and naming this Appointment: deadlines do not fit the word, and the derived items already read as "Needs you" in the UI.

## Consequences
- The my-work API is renamed (`myWork.tasks` → `myWork.needs`), a breaking change on GraphQL, REST and MCP.
- `Notification` gains an optional task subject; `notify` no longer requires an order.
- `sync_record_relations` covers `TASK` besides `ORDER` and `ITEM`.
- Task notes are free text and may hold personal data; they stay inside Bibi.
