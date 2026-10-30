# Boards, phases and the pipeline view

Behaviour spec for ADR 0067. Entities are in `docs/domain-model.md`; statuses, gates and moves are in `docs/specs/tickets-statuses-and-states.md`.

## Boards and phases
- A `Board` is a saved view of the organization's tickets: a name, an optional filter (ticket type, main assignee) and an order. It owns no ticket data. An organization has any number of boards; the first active one by order is the **default board**.
- A `BoardPhase` is one column of one board: name, color and order. It shows one or more ticket statuses.
- `BoardPhaseStatus` maps a status to a phase. A status is in at most one phase per board (unique on board and status). A status in no phase of a board is not on that board; tickets in it are not shown there and are counted as unmapped.
- Boards and phases are configuration (`pipeline:read`, `pipeline:write`, `pipeline:delete`), never ticket data. Changing them never changes a ticket, a status or a transition.

## Defaults
- Every organization has at least one board. The migration and a new organization give it a board "Pipeline" with one phase per active status, open statuses first and closing statuses last.
- `board.create` starts mirroring every active status, one phase each, in the same order. Staff (or the seed) then regroup them.
- A new status (`ticketStatus.create`) is on no board: in customize mode it shows in the "Not on this board" column on the far left, and staff drag it to a column (`boardPhase.moveStatus`). Pass `phaseId` to put it in an existing phase instead. A template import (`ticketStatus.importTemplate`) gives each status its own phase on the default board, after the open statuses' phases unless it closes, so a new organization's board shows every status.
- Archiving a status removes it from every board. A phase it leaves empty is archived too.
- Archiving a phase removes its statuses from that board (move them first with `boardPhase.moveStatus` to keep them on it). It never touches tickets or statuses.
- Archiving a board never touches tickets. The last active board cannot be archived (`CONFLICT`).

## Reading a board
- `pipeline.board({ boardId?, ... })` reads one board; without `boardId` it reads the default board. Output: `boardId`, `boardName`, `columns`, `cards` and `unmappedCount`.
- A column is a phase: `id` (the phase id), `title`, `color`, `closed` (every status in it closes) and its `statuses` (`id`, `title`, `color`, `requiresReason`, `closed`). Each status is a drop zone: moving a card onto it sets that status through `ticket.changeStatus`, with the usual transition, gate and reason checks. A drop zone not allowed from the card's status is shown disabled.
- A card carries `columnId` (the phase id) and `statusId`. A ticket shows on exactly one card, in the column of the phase that holds its status. Closed tickets show only within `closedWithinDays`.
- `unmappedCount` is the number of tickets of the board's filter whose status is not in any phase of the board.
- The board's own filter (type, assignee) narrows the cards; the request's filters narrow them further.

## Customize mode on `/pipeline`
- A user with `pipeline:write` sees a **Configure** button on `/pipeline`. It switches the board into customize mode; others have no button.
- In customize mode the columns turn over one after the other (GSAP) and slide right to make room for the **Not on this board** column on the far left, which holds the statuses on no column. Staff can:
  - drag a status chip to another column (`boardPhase.moveStatus`), or into Not on this board;
  - add a column (`boardPhase.create`) and remove one (`boardPhase.archive`, its statuses leave the board);
  - rename or recolor a column (`boardPhase.update`) and reorder columns (`boardPhase.reorder`);
  - add a status in Not on this board (`ticketStatus.create`, no `phaseId`), then drag it to a column;
  - archive a status, choosing a target status for its tickets (`ticketStatus.archive`).
- Every action saves at once; there is no draft or save button. Leaving customize mode returns to the cards.
- Archiving a status that holds tickets needs a target status; the tickets move in one logged operation through the normal move checks.

## Demo data
- Lindholmen has the default "Pipeline" board plus **Sales** (Lead, Quote sent, Won, Closed) and **Ops** (Confirmed, Final count locked, Completed). Vingaleden has only the default board. See `docs/demo-seed.md`.
