# 0043 – The ticket: one record through organization-defined phases

- **Date:** 2026-10-18
- **Status:** Accepted
- **Related:** 0021 (configurable domain), 0022 (sales pipeline), 0034 (assignments), 0041 (three primary views), 0044 (line states and the phase grid)
- **Supersedes:** the inquiry state machine and `BookingStatus` in 0022, the fixed phases in 0022, the board columns in 0041
- **Refines:** 0021 (the base types `INQUIRY` and `BOOKING` become one base type `TICKET`)

## Context
- ADR 0022 has two records for one customer request: an `Inquiry` with a fixed state machine, and a `Booking` created on `quote.accept` with organization-defined statuses. Rooms, food and program hang off the booking, so before acceptance an inquiry cannot own anything except options.
- Real bookings change all the time: lines are added, removed and changed long before and after the deal. A customer request is one continuous thing from first contact to the delivered event, and the organization's pipeline should show exactly that.
- Phases (the pipeline columns) must be the organization's own. Nothing about them can be fixed in code, including their number and their names.

## Decision

### One record: the ticket
- `Ticket` replaces `Inquiry` and `Booking`. A ticket is created from a customer's request (or directly by staff for a quick booking) and lives until it is completed, lost or cancelled. It never turns into another record.
- A ticket has: customer, optional contact, reference number (sequential per organization), type (the organization's own, base `TICKET`) and own fields, optional desired period and quantity, optional budget, a phase, `phaseChangedAt` and a reason for the last phase change.
- Everything else attaches to the ticket: **lines** (rooms, food, activities, equipment: ADR 0044), requirements, quotes, sheets, payments, assignments, inbound email. The line is today's program item (`ProgramItem`) and absorbs `Option`.
- The ticket's dates are what the customer asked for. Each line has its own time. Nothing on the ticket is required to exist for a lead.
- The inquiry-only fields (`desiredStartsAt`, `desiredEndsAt`, `quantity`, `budgetMinor`, `lossReason`) and the booking-only fields (`startsAt`, `endsAt`, `estimatedHeadcount`, `guaranteedHeadcount`, `statusReason`) are merged. Which of them an organization sees is controlled by its ticket type's fields, not by code.

### Phases are organization data
- `TicketPhase`: name, color, position, plus the **phase flags** below. The organization adds, renames, reorders and removes phases freely. There are no fixed phases in code.
- Phase flags are generic and never domain words:

  | Flag | The system does |
  |---|---|
  | `entry` | New tickets start here. Exactly one phase is the default entry. |
  | `terminal` | No move leaves this phase. All lines are released on entry (ADR 0044). |
  | `requiresReason` | A reason is required to enter (lost, cancelled, reopened). |
  | `requiresAssignee` | The ticket must have its main assignee (ADR 0034) to enter. |
  | `invoiceable` | Invoices can be created, and only after the last line has ended. |
  | `event` | The phase is entered by a system event instead of a drag: `QUOTE_SENT`, `QUOTE_ACCEPTED` or `PAYMENT_COMPLETED`. At most one phase per event. |

- **Minimum configuration** (checked by core on every change, refused with `CONFLICT`): one `entry` phase and one `terminal` phase. Everything else is optional.
- **Transitions are data.** `TicketPhaseTransition` (from → to) says where a ticket may go. The default is every forward move plus a move to any terminal phase.
- **Events move tickets.** `quote.send`, `quote.accept` and a completed payment move the ticket into the phase that has the matching `event`, if there is one and the transition is allowed. Without such a phase the event changes nothing on the phase. A phase with an `event` is not entered by hand.
- **Quick booking** creates a ticket in an organization-chosen phase (`quickBookingPhaseId`, an organization setting). The customer pays through a link or against invoice; completed payment fires `PAYMENT_COMPLETED`.

### Moving a ticket
- One command: `ticket.changePhase({ ticketId, phaseId, reason? })`. Phase can never be set through `update`.
- A move is atomic. Core checks the transition, the phase flags and the line states the move implies (ADR 0044). If any line cannot take its new state, nothing changes and `CONFLICT` lists every blocking line.
- History comes from `AuditLog`. `phaseChangedAt` supports lists, sorting and "time in phase".

### Removing and renaming
- **Rename and recolor** are free and change no behavior.
- **Remove** is archive. A phase that holds tickets can only be archived with a **target phase** chosen: the tickets move there in one logged operation, through the same checks as a normal move (and the same atomic refusal).
- The last `entry` or `terminal` phase cannot be archived. The phase flags can be changed, but a change that would break the minimum configuration is refused.
- Archiving a phase with a `PAYMENT_COMPLETED`/`QUOTE_*` event is allowed; the event then no longer moves tickets.

### Board and views
- The pipeline board (ADR 0041) has one column per active phase in position order, and a collapsed Closed lane for terminal phases. Cards are tickets.
- Dashboard counts group by phase flag (open, terminal, invoiceable), never by phase name (ADR 0021).

### Commands and permissions
- `ticketPhase.list|get|create|update|archive|reorder|setTransitions|importTemplate` under `ticketPhase:read|admin`.
- `ticket.list|get|create|update|changePhase`, plus `ticket.export` (replaces `booking.export`, ADR 0024).
- Assignments use the subject type `TICKET` (ADR 0034). Search, embeddings and generative UI follow.

## Consequences
- Prisma: `Inquiry` and `Booking` merge into `Ticket`; `BookingStatus(Transition)` becomes `TicketPhase(Transition)`; `Option` is absorbed by lines (ADR 0044); `EntityBase` loses `INQUIRY` and `BOOKING` and gets `TICKET`.
- There are no production users, so there is no data migration (memory: no backwards compatibility). The migration is replaced and the demo seed (ADR 0025) is updated.
- Core features `inquiry`, `booking` and `option` are removed in the same change that adds `ticket`, on all four surfaces (ADR 0003). The parity and isolation tests follow.
- Quote acceptance no longer creates a record. It stores `acceptedBy`, `acceptedAt` and `acceptanceMethod` and fires `QUOTE_ACCEPTED`.
- The board, dashboard, quick booking flow, assistant cards and the My work view read tickets and phases.
- Templates (ADR 0044) preset phases, transitions and flags. "Conference estate": New, Site visit, Quote sent, Confirmed, Final count locked, Completed, Lost, Cancelled.
- ADR 0022 is marked superseded for inquiry, booking status and option behavior. Its quote versioning, owners-as-assignments and signing notes stand.

## Open questions
- **UI word.** "Ticket" is the internal and ADR word. The UI label could be configurable per organization (e.g. "Booking", "Case"). Not decided.
- **Several pipelines** (one per ticket type) are deferred. A nullable `pipelineId` on `TicketPhase` would allow it later.
- **Automation on phase entry** (send mail, create task) is deferred. The phase flags and line states are the only automation.
