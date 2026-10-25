# Tickets, statuses, line states and the status grid

Current behaviour, checked against the code. Why these choices were made: ADR 0043, 0044, 0054. Entity fields: `docs/domain-model.md`.

## The ticket
- A `Ticket` is created from a customer's request, or by staff from a predefined ticket. It lives until it is completed, lost or cancelled and never turns into another record.
- It has a customer, optional contact, sequential reference number per organization, the organization's own type (base `TICKET`) with own fields, optional desired period, `estimatedHeadcount` and `guaranteedHeadcount` (lines inherit them), optional budget and `holdsUntil`. The ticket type's fields control which of these an organization uses.
- Lines (`Line`: rooms, food, activities, equipment), requirements, quotes, sheets, payments, invoices, assignments and inbound email attach to the ticket. Nothing on the ticket is required for a lead. The ticket's period is what the customer asked for; each line has its own time.
- Inbound address: `ticket-<id>@<MAIL_INBOUND_DOMAIN>` (ADR 0012).

## Statuses are organization data
- `TicketStatus`: name, color, position and flags. The organization adds, renames, reorders and removes statuses freely; none are fixed in code.

| Flag | The system does |
|---|---|
| `entry` | New tickets start here. Exactly one active status is the default entry. |
| `closes` | No move leaves it. Entering it releases every line. |
| `requiresReason` | A reason is required to enter. |
| `requiresAssignee` | The ticket needs its main assignee to enter. |
| `requiresAcceptedQuote` | The ticket needs an accepted quote to enter. |
| `invoiceable` | Invoices can be created in this status. |
| `event` | Entered by a quote event (`QUOTE_SENT` or `QUOTE_ACCEPTED`) instead of by hand. At most one active status per event. |

- Minimum configuration, refused with `CONFLICT` on every change: one `entry` status and one `closes` status.
- Transitions are data (`TicketStatusTransition`, from → to). Default: every forward move plus a move to any closing status.
- `quote.send` and `quote.accept` move the ticket into the status with the matching `event` when one exists and the transition is allowed; otherwise the status does not change. Payments and invoices never move a ticket.
- Removing a status is archiving. A status that holds tickets needs a target status; tickets move in one logged operation through the normal checks. The last `entry` or `closes` status cannot be archived.

## Moving a ticket
- One command: `ticket.changeStatus({ ticketId, statusId, reason? })`. The status is never set through `ticket.update`.
- A move is atomic. Core checks the transition, the status flags and the line states the move implies. If anything blocks, nothing changes and `CONFLICT` lists every blocker (e.g. a hard hold collision, a disallowed state transition, a missing assignee).
- History is `TicketStatusChange` (append-only: from, to, reason, `changedAt`, `changedBy`, `trigger` = `MANUAL | QUOTE_EVENT | TEMPLATE | SYSTEM`); read it with `ticket.statusHistory`. `Ticket.statusId` is a projection set by a trigger on insert into that table; never write it. Time-in-status reports are plain SQL on it.
- Facts stay on their records: quote status on `Quote`, payment status on `Payment`, holds on lines. A status may only guard a fact on entry (`requiresAcceptedQuote`). A status that contradicts a fact is shown as a derived warning, never silently resolved.
- Not built yet: `requiresPaidDeposit`.

## Predefined tickets
- `TicketTemplate`: name, ticket type, start status, default own-field values and lines (item, optional setup, offset and duration from the ticket start, quantity fixed or per headcount).
- `ticket.createFromTemplate({ templateId, customerId, startsAt, quantity })` creates the ticket with its lines in one step. Lines get their state from the grid cell for the start status. A collision refuses the whole creation and lists the blocking lines.

## Line states
- `ItemState` per item type: name, color, position and flags. Every type has at least one state and exactly one `initial` state.

| Flag | The system does |
|---|---|
| `hold` | `NONE`, `SOFT` or `HARD`. Only for types with the `BOOKABLE` capability. `SOFT` reserves without blocking others; `HARD` blocks. |
| `inSheets` | Lines in this state are included in generated sheets. |
| `released` | Final state. The hold is dropped; nothing leaves it. |
| `expires` | Lines in this state fall to the type's `expiryStateId` when the ticket's `holdsUntil` passes. |

- Transitions between states of one type are data (`ItemStateTransition`). Default: every forward move and a move to released.
- A line has `stateId` and `stateOverridden`. History is `LineStateChange` (`trigger` = `MANUAL | STATUS | EXPIRY | SYSTEM`); `Line.stateId` is set by a trigger on it. "Held since" (`heldAt` in the line DTO) is the latest change's `changedAt`, not a column.
- A line's occupancy is a projection of its state (ADR 0053, `packages/db/CLAUDE.md`): `SOFT` gives a soft hold, `HARD` a blocking one, `NONE` and released none. Untimed lines never hold. Hard holds, setup, maintenance and internal blocks never overlap on one item; soft holds may.
- One expiry date per ticket: `Ticket.holdsUntil` applies to every line whose state has `expires`. The job `ticket.expireHolds` moves those lines to `expiryStateId`, audited per line; the ticket's status does not change. Without a date nothing expires.
- No queue and no rank: several soft holds may overlap. The calendar shows each holder's "held since" date, oldest first, and who gets the room is a human decision. A hard hold blocks and the soft holders it overlaps are shown as blocked.
- Lines may form an `AlternativeGroup`; choosing one option moves the others to the released state.
- Removing a state is archiving and needs a target state of the same type when lines use it; grid cells and `expiryStateId` move with it or are cleared. The initial state cannot be archived until another is chosen.

## The status grid
- `StatusStateRule(statusId, entityTypeId, stateId)`: when a ticket enters a status, its lines of that type move to that state. The grid is statuses × item types.
- Cells are optional: an empty cell means keep the state. A new line gets the cell's state for the ticket's current status, or the type's initial state when the cell is empty.
- Closing statuses ignore the grid and release every line.
- Entering a status moves every line that is not overridden and whose cell is set. The step must be an allowed state transition; if not, the line is a blocker.

## Overrides
- `line.changeState({ lineId, stateId })` sets one line to any allowed state at any time, with the same hold checks as a status move. The line is then `stateOverridden` and status moves skip it. `line.followStatus` clears the flag and applies the current status's cell. Closing statuses still release it.

## Calendar
- Each occupancy is drawn in its state's color: hard holds solid, soft holds hatched, released not shown. Filters: state, status, ticket, item type. Each block links to the ticket and shows the line's state name.
- One read, `calendar.range({ from, to, venueId?, typeId?, stateId?, statusId?, ticketId? })` (ADR 0064): `from` and `to` are plain dates, both inclusive, at most 62 days, resolved to `[start of from, start of to + 1 day)` in the venue's zone, else the organization's. It returns every active occupancy overlapping that range as a block already joined with its line, ticket, state and status (setup and teardown included), earliest first, with no paging. Permission `ticket:read`; the item is an id, the line's name and held-since need `program:read`, the state's name and color need `pipeline:read`. An unknown venue or ticket is `NOT_FOUND`. The web calendar, GraphQL, REST and MCP all read it.

## Board
- One column per active status in position order and a collapsed Closed lane for closing statuses. Dashboard counts group by status flag, never by status name.

## Setup
- First setup is the assistant onboarding at `/onboarding` (ADR 0045; the earlier wizard is gone). It builds a draft through `pipelineSetup.presetDraft|preview|activate` (activate is one audited batch). Afterwards the same data is edited in settings.
- The preview steps a simulated ticket through every status and lists configuration problems: no entry or closing status, a state nothing can leave, a type with no initial state.
- Templates ("Conference estate" and per-type state presets) fill the draft and can be changed freely.

## Operations
- `ticketStatus.list|get|create|update|archive|archivePreview|reorder|setTransitions|importTemplate`, `ticketTemplate.list|get|create|update|archive`, `ticket.list|get|create|update|changeStatus|createFromTemplate|expireHolds|export|statusHistory`, `itemState.list|get|create|update|archive|archivePreview|reorder|setTransitions`, `statusGrid.get|setCell|importTemplate`, `line.changeState|followStatus`, `pipelineSetup.presetDraft|preview|activate`, `calendar.range`.
- All exist on web, GraphQL, REST and MCP; AI proposes, the user approves.

## Not decided
- One pipeline per organization; a pipeline per ticket type is deferred (a nullable `pipelineId` on `TicketStatus` would allow it).
- Automation on status entry (send mail, create task) is deferred; status flags, quote events and line states are the only automation.
- A line state change does not notify the line's responsibility yet; deferred until notifications exist.
