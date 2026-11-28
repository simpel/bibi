# Tasks

Target behaviour. Why: ADR 0117, 0120, 0121. Entity: `docs/domain-model.md` (Task, TaskItem).

## Scenario
1. A prospect calls and wants a site visit. The rep creates a task of the organization's type "Site visit" due Thursday 14:00, for the customer and contact (created on the spot if new), assigned to themself, naming the Atrium. No order.
2. The prospect wants the Atrium for a day in March. The rep prebooks it on the task for that day (a soft hold), or books it (a hard hold) once the date is agreed. The hold has its own from and to, unrelated to the visit's due time.
3. The task shows on the calendar at its due time, the held Atrium as a block, in the rep's My work and on the customer page.
4. After the visit the rep marks it done and writes a note ("Atrium, ~80 people, March"). Done releases the hold for good.
5. From the task, **Create order** opens the order form with customer, contact and note filled in, and lists the rooms the task holds. Saving creates the order and links the task; each held room becomes a line of the order in the same hold, and the task lets go of it in the same step.
6. A quick note to self ("order name badges") needs only its type: no customer, no time.
7. A rep who held the visit outside Bibi just creates the order. No task is needed.

## Rules
- Task types are the organization's own (base `TASK`). A task needs only its type; customer, contact, order, due time, assignee, note and rooms are optional.
- A contact needs a customer and must work at it; an order needs a customer and must belong to it (`VALIDATION` at `contactId` or `orderId`). `task.update` can move a task to another customer (with a contact at it, or none); a move needs `orderId` null or an order of the new customer. `customerId: null` clears the customer, and then `contactId` and `orderId` must be null too (or already empty).
- A task has at most one time, its due time (`dueAt`), never a span. Without one it is not on the calendar, not in Needs you, never overdue and sorts last in lists; `from`/`to` filter on the due time, so it only appears without a window.
- Rooms (`items`, ADR 0120): each an active item of a `BOOKABLE` type, at most once per task, no quantity. `RELATED` only names the room and has no window; `PREBOOK` (soft hold, may overlap) and `BOOK` (hard hold) need their own `startsAt` before `endsAt` (`VALIDATION` at `items.<i>`). `task.update` with `items` replaces the set; a kept room keeps its id. Needs `item:read`.
- Holds: a prebook or book holds its room as an `Occupancy` `HOLD` (`SOFT` or `HARD`, `taskItemId` set, no buffers) while the task is active and open. A book that collides with a hard hold, buffer or block is `CONFLICT` at `items.<i>`, never saved. Availability, collisions, pool units and the calendar treat it like any hold; a line whose hard hold would collide with it names "booked by a task". The only writer is core's `syncTaskHolds`, checked by the `task-holds` reconciliation.
- Done (`task.complete`) releases the holds for good: each prebook and book becomes related, without a window, and reopening holds nothing. Archive releases them; restore holds them again (a book that now collides refuses the restore). A room on a task refuses the item's delete; an item a task holds cannot be archived; `BOOKABLE` cannot be switched off while a type's items are on tasks.
- Create order from a task: `order.create` with `taskIds` carries every prebook and book over. A room no input line takes becomes a line for that item with the room's window, of the organization's first line type by name (the intake's default), named after the item. Its state is the item type's first state of the hold's kind that is not released (soft for a prebook, hard for a book; by position, then id). When the entry status gives the line another state, the line is moved there by hand (`MANUAL`, `stateOverridden`), so a status move does not change it; otherwise it follows the status. An item type without such a state, or no line type, is `VALIDATION` at `taskIds.<i>`; a booked room that collides is `CONFLICT`. A room an input line takes is not added again. All of the tasks' prebooks and books become related in the same command, so a room is never held twice. Carrying rooms over needs `program:write`.
- The order form opened from a task lists the held rooms read-only; sending `taskIds` is enough.
- `task.linkOrder` sets the first order: same customer, an order that is not archived, also one in a closing status (`VALIDATION`); a task already linked is `CONFLICT`. `task.update` with `orderId` then moves it to another order of the customer, or unlinks it with `null`, under the same rules. `task.create` with `orderId` and `order.create` with `taskIds` link in the same command, under the same rules.
- Pipeline (ADR 0121): a task without an order has a status (`statusId`), one of the organization's statuses flagged `tasks` ("Tasks can be here", set in the flow editor, `pipeline:write`; never a closing status, `VALIDATION`). A new task takes the entry status if it holds tasks, else the first that does by position; with none flagged it has no status, is on no board, and creating it still works. Linking an order (`task.create` with `orderId`, `task.linkOrder`, `order.create` with `taskIds`, `task.update`) clears the status; unlinking sets the default again. Done keeps the status; reopening or restoring puts the task back there, or in the default when that status no longer holds tasks. Clearing a status's flag or archiving it moves its tasks to the default; a status that starts to hold tasks gives the tasks without one a status. The `task-status` reconciliation checks it.
- `task.move({ id, statusId })` (`task:write`, audited, approved like other commands): only to an active status that holds tasks (`VALIDATION` at `statusId`); a status that restricts its next moves allows only its listed targets, and the gates into the target apply where they read something a task has (`ASSIGNEE` needs its assignee); `REASON` and `ACCEPTED_QUOTE` are skipped, and a quote event status is entered by hand. Every blocker is listed in one `CONFLICT`. A task with an order follows its order and a done task is off the board: both `CONFLICT`.
- `overdue`: open, with a due time before now.
- `complete` sets `doneAt` and `doneBy`; `reopen` clears them. Both are audited.
- The assignee defaults to the creator on create; `task.update` changes it with `assigneeId`. Assigning a task notifies the new assignee (`ASSIGNED` with `taskId`, no order needed, data `taskTypeName` and `taskDueAt`, null without a due time).
- Needs you: kind `TASK_DUE` (key `TASK_DUE:<taskId>`) for the assignee, only with a due time, group TODAY when due today and LATE when overdue, with no age limit. It is dismissable like other needs (ADR 0114): `NeedsYouDismissal` stores `taskId`, its `orderId` null for a task without an order.

## Surfaces
- Every operation on web, GraphQL, REST and MCP. The assistant proposes; the user approves writes.
- Web:
  - `/tasks`: a list, searched like orders (`is:open|done|overdue`, `assignee:`, `customer:`, `type:`, `when:`).
  - `/tasks/{id}`: the detail page, edited in place, with **Create order** while the task is unlinked.
  - `/new/task`: create, prefilled from `?customer=` or `?order=`. Also reachable from the create hub, ⌘K, the customer page and the order's Tasks tab.
- Order page: a **Tasks** tab.
- Customer page: a Tasks section after contacts.
- Pipeline card and order row: the next open task with a due time (earliest), as a task chip.
- Pipeline board: an open task without an order is a task card (the task look) in the phase of its status, after the phase's orders, dragged like an order card (`task.move`); a column with no status that holds tasks refuses it. `pipeline.board` returns `taskCards` (`kind`, `id`, `columnId`, `statusId`, `typeName`, `customerId`, `dueAt`, `overdue`, `assigneeId`, `allowedStatusIds`), empty without `task:read` or with an order type filter; the assignee filter and the board's search (customer, assignee, type) apply to them.
- Calendar: a Tasks lane above the rooms (tasks due in the range, a point at the due time); a room a task holds is a hold block on that room's row with `taskId`, hatched when prebooked like any soft hold.
- My work: today's tasks in the timeline; `TASK_DUE` in Needs you.

## Visual rules
Tasks must never be mistaken for bookings or orders.
- **Orders and lines keep their look:** filled blocks and cards coloured by status or state.
- **Tasks have no fill.** They use a solid hairline border in the `--task` token, which is used for nothing else. Never dashed: dashed means blocked or preliminary (`booking-tone`).
- **Leading round checkbox and a fixed task icon.**
- **Time first:** "Thu 14:00 · Site visit · Sara".
- **Done:** checked, strike-through, muted.
- **Overdue:** the time in destructive text, never a red fill.
- **Components in `@bibi/ui`:** `TaskRow`, `TaskChip`, `TaskCalendarMarker`.
