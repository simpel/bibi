# Tasks

Target behaviour. Why: ADR 0117. Entity: `docs/domain-model.md` (Task).

## Scenario
1. A prospect calls and wants a site visit. The rep creates a task of the organization's type "Site visit" for Thursday 14:00–15:00, for the customer and contact (created on the spot if new), assigned to themself, showing the Atrium. No order.
2. The task shows on the calendar, in the rep's My work and on the customer page.
3. After the visit the rep marks it done and writes a note ("Atrium, ~80 people, March").
4. From the task, **Create order** opens the order form with customer, contact and note filled in. Saving creates the order and links the task.
5. A rep who held the visit outside Bibi just creates the order. No task is needed.

## Rules
- Task types are the organization's own (base `TASK`), each with a shape: `MEETING` needs start and end (end after start, also a database CHECK); `DEADLINE` has one due time and no end. Changing a type's shape is refused while it has active tasks (`CONFLICT`).
- Customer and contact are required; the contact must work at the customer (`VALIDATION`). The customer never changes after create.
- `task.linkOrder` sets the order once: same customer, an order that is not archived, also one in a closing status (`VALIDATION`); a task already linked is `CONFLICT`. `task.create` with `orderId` and `order.create` with `taskIds` link in the same command, under the same rules.
- `ITEM_BUSY`: a meeting whose item has a hard hold, buffer or block overlapping its span. A deadline never warns. Soft holds do not count. The task is still saved.
- `overdue`: open, and past its end (meeting) or due time (deadline).
- `complete` sets `doneAt` and `doneBy`; `reopen` clears them. Both are audited.
- The assignee defaults to the creator on create; `task.update` changes it with `assigneeId`. Assigning a task notifies the new assignee (`ASSIGNED` with `taskId`, no order needed, data `taskTypeName` and `taskStartsAt`).
- Needs you: kind `TASK_DUE` (key `TASK_DUE:<taskId>`) for the assignee, group TODAY when due today and LATE when overdue, with no age limit. It is dismissable like other needs (ADR 0114): `NeedsYouDismissal` stores `taskId`, its `orderId` null for a task without an order.

## Surfaces
- Every operation on web, GraphQL, REST and MCP. The assistant proposes; the user approves writes.
- Web:
  - `/tasks`: a list, searched like orders (`is:open|done|overdue`, `assignee:`, `customer:`, `type:`, `when:`).
  - `/tasks/{id}`: the detail page, edited in place, with **Create order** while the task is unlinked.
  - `/new/task`: create, prefilled from `?customer=` or `?order=`. Also reachable from the create hub, ⌘K, the customer page and the order's Tasks tab.
- Order page: a **Tasks** tab.
- Customer page: a Tasks section after contacts.
- Pipeline card and order row: the next open task (earliest), as a task chip.
- Calendar: a Tasks lane above the rooms; a meeting that names a room also shows an outlined marker on that room's row.
- My work: today's tasks in the timeline; `TASK_DUE` in Needs you.

## Visual rules
Tasks must never be mistaken for bookings or orders.
- **Orders and lines keep their look:** filled blocks and cards coloured by status or state.
- **Tasks have no fill.** They use a solid hairline border in the `--task` token, which is used for nothing else. Never dashed: dashed means blocked or preliminary (`booking-tone`).
- **Leading round checkbox and a fixed type icon:** meeting `CalendarClock`, deadline `Flag`.
- **Time first:** "Thu 14:00 · Site visit · Sara".
- **Done:** checked, strike-through, muted.
- **Overdue:** the time in destructive text, never a red fill.
- **Components in `@bibi/ui`:** `TaskRow`, `TaskChip`, `TaskCalendarMarker`.
