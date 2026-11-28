# 0121 – Tasks without an order move through the pipeline like orders

- **Date:** 2026-11-27
- **Status:** Accepted (the user, 2026-11-27: "do the best implementation, nothing halfbaked"; table names kept)
- **Amends:** 0117 (decision 7: "Pipelines show orders only")
- **Related:** 0043, 0067, 0076, 0111, 0120

## Context
- A task can stand alone (ADR 0120): a site visit, a prebooked room, a headcount reminder with no order. Today it is invisible on the pipeline until it is linked to an order, where it shows only as that order's chip.
- Staff run the pipeline to see where each piece of work stands, and want a task with no order to sit in a phase and be moved on like an order.
- A task has no status. The organization's statuses (ADR 0043) are written and named for orders, with gates and movement rules (ADR 0076), though nothing about a status itself is about orders: it is a step in the organization's flow.

## Decision
1. A status is a shared pipeline status, not an order status: orders and tasks use the same set, the same phases and the same movement rules. A task has one (`Task.statusId`, owned), set while it has no order. A new task takes the entry status if tasks may sit there, else the first status that allows tasks by position.
2. A status carries one flag, `tasks` ("Tasks can be here"). Only flagged statuses hold a task, and a task is moved only among them; a column with no flagged status refuses a task dropped on it. The flag is set in the flow editor with the other status flags (`pipeline:write`).
3. Movement uses the same operation and rules as an order: a status that `restrictsNext` limits where a task may go next, and a gate on the target status applies to the task. A gate that reads order data (assignee, lines, quote) holds for a task only where it reads something a task has; otherwise it is skipped for tasks, never failed.
4. The board shows a task in the phase of its status as a card in its own style (the task look, ADR 0117: hairline border, no fill), after the orders of that phase. A task is on the board only while it is open and has no order. Linking it to an order, or marking it done, removes its card; the order's next-task chip stays as is.
5. Dragging a task is `task.move`, a command with `task:write`, audited and on every surface (ADR 0003). The board's search and view filters apply to tasks by customer, assignee and type; a view filter that cannot apply to a task (order type, status flags) hides tasks.
6. Unlinking a task from its order (ADR 0120) puts it back in the entry-or-first flagged status.

## Rejected
- A strip above the board: no phases, no dragging, and the pipeline's logic would be split in two.
- Tasks in every status: a status such as Invoiced or Cancelled would hold tasks, and gates written for orders would apply to things they were never written for.
- Renaming the model to `PipelineStatus` in this change: it touches every surface for a name only. The table, its operations and `/admin/pipeline` keep their names for now; texts and docs say "status", and a rename can follow on its own.
- A separate task status set: staff would keep two flows in step, and the pipeline's columns would not line up.

## Consequences
- Migration: `Task.statusId` (nullable, composite FK to `OrderStatus`; backfilled for tasks without an order and not done), `OrderStatus.tasks` (default false, the name kept; every entry status starts flagged so existing boards show tasks).
- `pipeline.board` returns task cards beside order cards; the card shape, the drop picker and the web board change. GraphQL, REST, MCP, the assistant and the board's customize mode follow.
- Archiving a status that tasks sit in moves them to the entry-or-first flagged status, like orders.
- The spec `docs/specs/tasks.md`, `docs/domain-model.md` and `/support` follow once this is accepted.
