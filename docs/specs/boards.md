# Boards, phases and the pipeline view

Behaviour spec for ADR 0067. Entities are in `docs/domain-model.md`; statuses, gates and moves are in `docs/specs/orders-statuses-and-states.md`.

## Boards and phases
- A `Board` is a saved view of the organization's orders: a name, an optional filter (order type, main assignee) and an order. It owns no order data. An organization has any number of boards; the first active one by order is the **default board**.
- A `BoardPhase` is one column of one board: a name and an order, no colour (only statuses are colour-coded). It shows one or more order statuses.
- `BoardPhaseStatus` maps a status to a phase. A status is in at most one phase per board (unique on board and status). A status in no phase of a board is not on that board; orders in it are not shown there and are counted as unmapped.
- Boards and phases are configuration (`board:read`, `board:write`, `board:delete`; the manager preset has them in full, the member preset `read`), never order data. Changing them never changes an order, a status or a move rule. The flow (statuses, Allowed next, gates) is `pipeline:write`, admin-only (ADR 0076).

## Defaults
- Every organization has at least one board. The migration and a new organization give it a board "Pipeline" with one phase per active status, open statuses first and closing statuses last.
- `board.create` starts mirroring every active status, one phase each, in the same order. Staff (or the seed) then regroup them.
- A new status (`orderStatus.create`) is on no board: in customize mode it shows in the "Not on this board" column on the far left, and staff drag it to a column (`boardPhase.moveStatus`). Pass `phaseId` to put it in an existing phase instead. A template import (`orderStatus.importTemplate`) gives each status its own phase on the default board, after the open statuses' phases unless it closes, so a new organization's board shows every status.
- Archiving a status removes it from every board. A phase it leaves empty is archived too.
- Archiving a phase removes its statuses from that board (move them first with `boardPhase.moveStatus` to keep them on it). It never touches orders or statuses.
- Archiving a board never touches orders. The last active board cannot be archived (`CONFLICT`).

## Reading a board
- `pipeline.board({ boardId?, ... })` reads one board; without `boardId` it reads the default board. Output: `boardId`, `boardName`, `columns`, `cards` and `unmappedCount`.
- A column is a phase: `id` (the phase id), `title`, `closed` (every status in it closes) and its `statuses` (`id`, `title`, `color`, `closed`). A column is one drop target. Dropping a card on it sets a status through `order.changeStatus`, with the usual allowed-target, gate and reason checks. A column with one allowed status moves at once; with several, a picker dialog lists the statuses the order may move to with their requirements in words; with none, a message says so.
- A card carries `columnId` (the phase id) and `statusId`. An order shows on exactly one card, in the column of the phase that holds its status. Closed orders show only within `closedWithinDays`.
- `unmappedCount` is the number of orders of the board's filter whose status is not in any phase of the board.
- The board's own filter (type, assignee) narrows the cards; the request's filters narrow them further.

## Customize mode on `/pipeline`
- A user with `board:write` sees a **Configure** button on `/pipeline`. It switches the board into customize mode; others have no button.
- In customize mode the columns turn over one after the other (GSAP) and slide right to make room for the **Not on this board** column on the far left, which holds the statuses on no column. Staff can:
  - drag a status chip to another column (`boardPhase.moveStatus`), or into Not on this board;
  - add a column (`boardPhase.create`) and remove one (`boardPhase.archive`, its statuses leave the board);
  - rename a column (`boardPhase.update`) and reorder columns (`boardPhase.reorder`);
  - add a status in Not on this board with a name and a colour (`orderStatus.create`, no `phaseId`), then drag it to a column; its flags are set on the status page;
  - archive a status, choosing a target status for its orders (`orderStatus.archive`).
- Every action saves at once; there is no draft or save button. Leaving customize mode returns to the cards.
- Archiving a status that holds orders needs a target status; the orders move in one logged operation through the normal move checks.

## Demo data
- Lindholmen has the default "Pipeline" board plus **Sales** (Lead, Quote sent, Won, Closed) and **Ops** (Confirmed, Final count locked, Completed). Vingaleden has only the default board. See `docs/demo-seed.md`.
