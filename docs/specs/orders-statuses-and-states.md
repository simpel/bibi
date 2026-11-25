# Orders, statuses, line states and the status grid

Current behaviour, checked against the code. Why these choices were made: ADR 0043, 0044, 0054. Entity fields: `docs/domain-model.md`.

## The order
- A `Order` is created from a customer's request, or by staff from a predefined order. It lives until it is completed, lost or cancelled and never turns into another record.
- It has a customer, optional contact, sequential reference number per organization, the organization's own type (base `ORDER`) with own fields, optional desired period, `estimatedHeadcount` and `guaranteedHeadcount` (lines inherit them), optional budget and `holdsUntil`. The order type's fields control which of these an organization uses.
- Lines (`Line`: rooms, food, activities, equipment), requirements, quotes, run sheets, payments, invoices, assignments and inbound email attach to the order. Nothing on the order is required for a lead. The order's period is what the customer asked for; each line has its own time.
- Inbound address: `order-<id>@<MAIL_INBOUND_DOMAIN>` (ADR 0012).

## Statuses are organization data
- `OrderStatus`: name, color, position and flags. The organization adds, renames, reorders and removes statuses freely; none are fixed in code. A new status (`orderStatus.create`) is only a name and a colour, placed last with every flag off; its flags are set with `orderStatus.update`.

| Flag | The system does |
|---|---|
| `entry` | New orders start here. Exactly one active status is the default entry. |
| `closes` | No move leaves it. Entering it releases every line. |
| `invoiceable` | Invoices can be created in this status. |
| `event` | Entered by a quote event (`QUOTE_SENT` or `QUOTE_ACCEPTED`) instead of by hand. At most one active status per event. |

- Minimum configuration, refused with `CONFLICT` on every change: one `entry` status and one `closes` status.
- Movement is free by default (ADR 0076): an order may move from a status to any other, except that nothing leaves a `closes` status and a status with a quote `event` is entered only by that event, never by hand. A status with `restrictsNext` allows only the rows of `OrderStatusTransition` (from → to). A free status keeps no transition rows. Set it with `orderStatus.setTransitions({ id, allowedNext: "ANY" | "ONLY_THESE", toStatusIds })` (`toStatusIds` only with `ONLY_THESE`).
- Move rules are gates on the target status (`OrderStatusGate`, ADR 0067 §5, ADR 0076), never flags on a status. A gate has an optional source: a specific status or none (from any status). The gates of a move from A to B are the gates into B from any status plus those into B from A. Set them with `orderStatus.setGates({ id, gates: [{ fromStatusId: string | null, gates }] })` on the target: it replaces every gate into that status. `orderStatus.list|get` return `restrictsNext`, `transitionsTo` (the effective allowed targets), `transitionGates` (effective per target) and `gatesInto` (raw, by source). Both setters need `pipeline:write`, the admin-only flow.

| Gate | A move into the status needs |
|---|---|
| `REASON` | A reason (`reason`). |
| `ASSIGNEE` | The order's main assignee. |
| `ACCEPTED_QUOTE` | An accepted quote. |

- A gate runs only on a move: creating an order in a status checks none, and removing the main assignee is allowed. Templates give each status `gatesIn`, which become from-any gates (`importTemplate` returns `gatesAdded`). More gates (invoices, deposits, holds, staff) are #493.
- `quote.send` and `quote.accept` move the order into the status with the matching `event` when one exists; otherwise the status does not change. Payments and invoices never move an order.
- Removing a status is archiving. A status that holds orders needs a target status; orders move in one logged operation through the normal checks. The last `entry` or `closes` status cannot be archived.

## Moving an order
- One command: `order.changeStatus({ orderId, statusId, reason? })`. The status is never set through `order.update`.
- A move is atomic. Core checks the allowed targets, the gates and the line states the move implies. If anything blocks, nothing changes and `CONFLICT` lists every blocker (e.g. a hard hold collision, a disallowed state transition, a missing assignee).
- History is `OrderStatusChange` (append-only: from, to, reason, `changedAt`, `changedBy`, `trigger` = `MANUAL | QUOTE_EVENT | TEMPLATE | SYSTEM`); read it with `order.statusHistory`. `Order.statusId` is a projection set by a trigger on insert into that table; never write it. Time-in-status reports are plain SQL on it.
- Facts stay on their records: quote status on `Quote`, payment status on `Payment`, holds on lines. A gate may only guard a fact (the `ACCEPTED_QUOTE` gate). A status that contradicts a fact is shown as a derived warning, never silently resolved.
- Not built yet: the `DEPOSIT_PAID` gate (#493).

## Predefined orders
- `OrderTemplate`: name, order type, start status, default own-field values and lines (item, optional layout, offset and duration from the order start, quantity fixed or per headcount).
- `order.createFromTemplate({ templateId, customerId, startsAt, quantity })` creates the order with its lines in one step. Lines get their state from the grid cell for the start status. A collision refuses the whole creation and lists the blocking lines.

## Comments
- Staff comment on the whole order or one of its lines (`Comment`, ADR 0115) in the **Comments** section of the order page's **Activity** tab (`?tab=activity`; a `#comments` or `#comment-<lineId>` link on another tab opens it): a text box, an **About** picker (the whole booking or a line) and **Add comment**. Comments list oldest first with author, relative time, "edited" and the line they are about.
- Authors edit their own comments in place and delete them after a confirm; a caller with `comment:delete` (managers, admins) deletes anyone's.
- A comment icon with the count sits on the order's title row, on each line in the program table and in each line's hover card on the timeline, and on My work cards. A red dot means the viewer has unread comment notifications there (each person their own, ADR 0094). On the order page the icon opens that line's (or the order's) comments with a text box; the hover card's icon picks the line in the Comments section; My work's opens the order at its comments. Opening the comments, or scrolling the Comments section into view, reads the notifications.
- The order page: the title with status, Follow and comments, the key facts and what needs attention (issues, the closed notice, the caller's tasks); then four tabs, each its own URL (`?tab=program|run-sheets|money|activity`, only the open one loads) beside a panel with the details, people and balance. Program: lines and requirements. Run sheets. Money (labelled Quote & payments): quotes, balance and payments, the estimate history. The key facts end with the quoted sum, the total incl. VAT of the quote last sent, with whether the order still matches it; it links to this tab. Activity: comments, messages, status history, versions. A tab whose sections the caller may not read is left out.
- The reply arrow beside a comment's edit and delete buttons opens a reply box; replies sit indented under their comment, one level. Typing `@` in any comment box lists colleagues by name; the picked `@Name` shows highlighted and the person is mentioned.
- A new comment notifies the order's assignees, followers and creator, never the author; a reply also its comment's author; a mentioned colleague gets "mentioned you" instead, even when not on the order.
- Run sheets carry every comment: a line's on its row (a Comments column in What to deliver), the order's in a block at the top. A comment change makes the next version, the row marked ★.

## Line states
- `ItemState` per item type: name, color, position and flags. Every type has at least one state and exactly one `initial` state.

| Flag | The system does |
|---|---|
| `hold` | `NONE`, `SOFT` or `HARD`. Only for types with the `BOOKABLE` capability. `SOFT` reserves without blocking others; `HARD` blocks. |
| `inRunSheets` | Lines in this state are included in generated run sheets. |
| `released` | Final state. The hold is dropped; nothing leaves it. |
| `expires` | Lines in this state fall to the type's `expiryStateId` when the order's `holdsUntil` passes. |

- Transitions between states of one type are data (`ItemStateTransition`). Default: every forward move and a move to released.
- A line has `stateId` and `stateOverridden`. History is `LineStateChange` (`trigger` = `MANUAL | STATUS | EXPIRY | SYSTEM`); `Line.stateId` is set by a trigger on it. "Held since" (`heldAt` in the line DTO) is the latest change's `changedAt`, not a column.
- A line's occupancy is a projection of its state (ADR 0053, `packages/db/CLAUDE.md`): `SOFT` gives a soft hold, `HARD` a blocking one, `NONE` and released none. Untimed lines never hold. Hard holds, setup, maintenance and internal blocks never overlap on one item; soft holds may.
- One expiry date per order: `Order.holdsUntil` applies to every line whose state has `expires`. The job `order.expireHolds` moves those lines to `expiryStateId`, audited per line; the order's status does not change. Without a date nothing expires.
- No queue and no rank: several soft holds may overlap. The calendar shows each holder's "held since" date, oldest first, and who gets the room is a human decision. A hard hold blocks and the soft holders it overlaps are shown as blocked.
- Lines may form an `AlternativeGroup`; choosing one option moves the others to the released state.
- Removing a state is archiving and needs a target state of the same type when lines use it; grid cells and `expiryStateId` move with it or are cleared. The initial state cannot be archived until another is chosen.

## The status grid
- `StatusStateRule(statusId, entityTypeId, stateId)`: when an order enters a status, its lines of that type move to that state. The grid is statuses × item types.
- Cells are optional: an empty cell means keep the state. A new line gets the cell's state for the order's current status, or the type's initial state when the cell is empty.
- Closing statuses ignore the grid and release every line.
- Entering a status moves every line that is not overridden and whose cell is set. The step must be an allowed state transition; if not, the line is a blocker.

## Overrides
- `line.changeState({ lineId, stateId })` sets one line to any allowed state at any time, with the same hold checks as a status move. The line is then `stateOverridden` and status moves skip it. `line.followStatus` clears the flag and applies the current status's cell. Closing statuses still release it.

## Calendar
- Each occupancy is drawn in its state's color: hard holds solid, soft holds hatched, released not shown. Filters: state, status, order, item type. Each block links to the order and shows the line's state name.
- One read, `calendar.range({ from, to, venueId?, typeId?, stateId?, statusId?, orderId? })` (ADR 0064): `from` and `to` are plain dates, both inclusive, at most 62 days, resolved to `[start of from, start of to + 1 day)` in the venue's zone, else the organization's. It returns every active occupancy overlapping that range as a block already joined with its line, order, state and status (setup and teardown included), earliest first, with no paging. Permission `order:read`; the item is an id, the line's name and held-since need `program:read`, the state's name and color need `pipeline:read`. An unknown venue or order is `NOT_FOUND`. The web calendar, GraphQL, REST and MCP all read it.

## Board
- Boards, their columns (phases) and drop zones are in `docs/specs/boards.md`. A column is one drop target: dropping on a phase with several statuses opens a picker of the statuses the order may move to, with their requirements in words; a `REASON` gate asks for the reason first. Dashboard counts group by status flag, never by status name.

## Setup
- First setup is the assistant onboarding at `/onboarding` (ADR 0045; the earlier wizard is gone). It builds a draft through `pipelineSetup.presetDraft|preview|activate` (activate is one audited batch). Afterwards the same data is edited in settings.
- The preview steps a simulated order through every status and lists configuration problems: no entry or closing status, a state nothing can leave, a type with no initial state.
- Templates ("Conference estate" and per-type state presets) fill the draft and can be changed freely.

## Operations
- `orderStatus.list|get|create|update|archive|archivePreview|reorder|setTransitions|setGates|importTemplate`, `orderTemplate.list|get|create|update|archive`, `order.list|get|create|update|changeStatus|createFromTemplate|expireHolds|export|statusHistory`, `itemState.list|get|create|update|archive|archivePreview|reorder|setTransitions`, `statusGrid.get|setCell|importTemplate`, `line.changeState|followStatus`, `pipelineSetup.presetDraft|preview|activate`, `calendar.range`.
- All exist on web, GraphQL, REST and MCP; AI proposes, the user approves.

## Not decided
- One pipeline per organization; a pipeline per order type is deferred (a nullable `pipelineId` on `OrderStatus` would allow it).
- Automation on status entry (send mail, create task) is deferred; status flags, quote events and line states are the only automation.
- A manual status move (`order.changeStatus`) notifies everyone on the order (ADR 0094); a move a quote event makes runs nested and does not notify yet. A line state change does not notify the line's responsibility yet.
