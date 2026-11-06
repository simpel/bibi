# 0067 – Order statuses, boards with phases as columns, and gates on transitions

- **Date:** 2026-10-24
- **Status:** Accepted
- **Related:** 0043 (supersedes), 0044 and 0054 (phase parts superseded), 0021, 0034, 0045, 0051, 0052, 0053, 0057, 0076 (amends §4 to §6 and §8)
- **Spec:** `docs/specs/orders-statuses-and-states.md`

## Context
- `OrderPhase` was already a stored status, but one flag set mixed pipeline position, guards and behaviour. The word "phase" named the status itself, so there was no room for a second, coarser level.
- The target venue needs several views of the same orders (Sales, Ops, Billing), each with few columns, while the finer status stays one per order.
- Guards were flags on the destination status. They cannot take parameters ("deposit at least 30 percent") or express "an invoice was sent", and they apply on every path into the status.
- Many files in core and apps read the phase, and the hold trigger reads its terminal flag. No data needed a backfill.

## Decision
1. An order has one stored status, like a Jira issue. `OrderPhase` becomes `OrderStatus`, with its transitions, an append-only change history and `Order.statusId` as a projection (ADR 0054). The set is admin-defined.
2. One code-owned flag stays: `closes` (was `terminal`). Entering a closing status releases every line's hold, and no move leaves it. At least one closing and one `entry` status must exist.
3. Boards are saved views: a name, a saved filter over orders and an order. An organization has any number. Boards own no order data.
4. A phase is a column of one board. A status maps to exactly one phase per board, and a status not mapped on a board does not show there. Dropping a card sets the status through the one move command.
5. Gates replace guard flags. A gate is a check on a transition, chosen from a code-owned catalogue and stored as data with parameters. Catalogue: `reason`, `assignee`, `acceptedQuote`, `invoiceSent`, `invoicePaid`, `depositPaid`, `allLinesHardHeld`, `staffAllocated`. Gates read facts and never store them (ADR 0054).
6. A refused move names the order, the target status and every failing gate. `order.changeStatus` stays the only command, atomic, `CONFLICT` with all blockers. Quote events still move an order through the `event` flag.
7. Unchanged: line states and the grid (now keyed by status). "Billed" stays derived (ADR 0057). Payments and invoices never move an order.
8. Statuses, boards, phases and gates are pipeline setup and use the `pipeline:*` permissions on every surface. A card move needs `order:write` plus passing gates.

## Rejected
- A column defined by a query over facts with no stored status: staff need human decisions no fact captures (parked, waiting, lost), and moves need a stored subject.
- Flags on the destination status: no parameters, no per-source rules, and the catalogue grows with every guard.
- One fixed pipeline with phases as the only level: no per-audience boards.
- A status belonging to one phase globally: Sales and Billing group the same statuses differently.

## Consequences
- The rename lands first as one codemod. The word "phase" is then free for board columns.
- `sync_line_occupancy` reads `OrderStatus.closes` and its trigger moves with it.
- Follow-up order: schema and trigger, core operations and gates, boards UI, seed and onboarding.

## Addenda
- 2026-10-30: the first gates (`REASON`, `ASSIGNEE`, `ACCEPTED_QUOTE`) replaced the three `requires*` flags and are set through one write path with the status's transitions. A gate runs only on a move. The same move must pass or fail the same way on every board, the order page, quote events and the API.
- 2026-11-01 (ADR 0076): §4 drop zones become one drop target per column with a status picker. §5 gates sit on the target status with an optional source status, and transitions apply only while a status has `restrictsNext`. §8 boards use a new `board` permission feature and `pipeline:write` is the admin-only flow.
