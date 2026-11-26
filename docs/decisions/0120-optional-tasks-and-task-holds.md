# 0120 – A task is optional all the way down, and can set rooms aside

- **Date:** 2026-11-26
- **Status:** Accepted (the user, 2026-11-26)
- **Amends:** 0117 (decisions 2 and 3)
- **Related:** 0043, 0044, 0052, 0056, 0059, 0113, 0118

## Context
- A task started as "a site visit for a customer, before any order" (ADR 0117), so it requires a customer, a contact and a time. Staff also want a quick note to self, a deadline with no customer, or a reminder with no date.
- A site visit often needs the room held while the rep waits for an answer. ADR 0117 only lets a task name a room and warn when it is busy; to hold it the rep must create an order, which is what a task exists to avoid.
- Holds come only from order lines (ADR 0052, 0059), so a held room today always has an order.

## Decision
1. A task needs only its type. Customer, contact, time, assignee, note and rooms are optional. A contact needs a customer, and an order must belong to the task's customer, so a task without a customer has neither. A task has at most one time, its due time (`dueAt`), never a span: the type's meeting and deadline shape goes away.
2. A task without a due time is not on the calendar or in Needs you, is never overdue and sorts last. A due time and a room's hold are independent: a visit due Thursday 14:00 can hold the Atrium from Wednesday 08:00 to Thursday 17:00.
3. A task lists the rooms it concerns (`TaskItem`, replacing the single `itemId`), each as one of three: **related** (named only, no window, so no busy warning; the `ITEM_BUSY` warning goes), **prebook** (a soft hold) or **book** (a hard hold that blocks). A prebook or book has its own from and to, required, and unrelated to the due time; a related room has none. Only items that can be booked (`BOOKABLE`) can be held, and a task takes no quantities; related also takes any such item, never stock like food.
4. A hold writes `Occupancy` as a projection like a line's (ADR 0053, 0059), with a `taskItemId` beside `lineId` (written by one core function, `syncTaskHolds`, rather than a trigger), so availability, conflicts and the calendar treat it like any hold. It is active only while the task is open and not archived: marking the task done (or archiving it) releases the hold. Only converting the task to an order keeps the room held, as the order's line (decision 5). A prebook may overlap; a book that collides is `CONFLICT`.
5. Create order from a task turns each prebook and book into a line with the same hold and releases the task's own holds in the same command, so the room stays held without being held twice; related rooms stay on the task. Reopening a done task does not bring its holds back: the rep sets the room aside again.

## Rejected
- A hidden order per task: one request would again have two records, and tasks would show in pipelines.
- Keeping rooms advisory: staff would still need an order to hold a room.
- Prebook only: a rep who has agreed a visit should be able to block the room.
- Quantities and stock items on a task: a task is not sold or delivered (ADR 0117), only room time is worth holding.

## Consequences
- Migration: `customerId` and `contactId` become nullable; `startsAt` becomes the optional `dueAt` and `endsAt` and the task type's `taskShape` go (an existing meeting keeps its start as `dueAt`; its end is dropped); `TaskItem` replaces `itemId` (existing rooms become related, without a window); `Occupancy.taskItemId`.
- Core's `syncTaskHolds` derives task holds (the one writer), with a reconciliation check `task-holds` beside `line-holds`.
- Every task surface changes: DTO, create and update, list order, Needs you, calendar, notifications, order and customer Tasks tabs, the demo seed and the docs.
- The spec `docs/specs/tasks.md` and `docs/domain-model.md` follow once this is accepted.
