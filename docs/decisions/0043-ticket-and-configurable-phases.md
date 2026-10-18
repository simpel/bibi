# 0043 – The ticket: one record through organization-defined phases

- **Date:** 2026-10-18
- **Status:** Accepted
- **Related:** 0021 (configurable domain), 0022 (quotes and occupancy), 0034 (assignments), 0041 (three primary views), 0044 (line states and the phase grid)

## Context
- A customer request is one continuous thing from first contact to the delivered event. Lines (rooms, food, activities) are added, removed and changed long before and after the deal.
- The organization's pipeline must show that whole lifecycle in the organization's own words. Nothing about the phases can be fixed in code, including their number and names.

## Decision

### One record: the ticket
- A `Ticket` is created from a customer's request, or by staff from a predefined ticket. It lives until it is completed, lost or cancelled and never turns into another record. The UI calls it a ticket.
- A ticket has: customer, optional contact, reference number (sequential per organization), type (the organization's own, base `TICKET`) and own fields, optional desired period, quantity, estimated and guaranteed headcount, optional budget, `holdsUntil` (ADR 0044), a phase, `phaseChangedAt` and the reason for the last phase change. Which of these an organization uses is controlled by its ticket type's fields.
- Everything else attaches to the ticket: **lines** (rooms, food, activities, equipment: ADR 0044), requirements, quotes, sheets, payments, invoices, assignments and inbound email. A line is a `ProgramItem`.
- The ticket's period is what the customer asked for. Each line has its own time. Nothing on the ticket is required for a lead.
- The inbound address of a ticket is `ticket-<id>@<MAIL_INBOUND_DOMAIN>` (ADR 0012).

### Phases are organization data
- `TicketPhase`: name, color, position and the **phase flags** below. The organization adds, renames, reorders and removes phases freely. There are no fixed phases in code.

  | Flag | The system does |
  |---|---|
  | `entry` | New tickets start here. Exactly one phase is the default entry. |
  | `terminal` | No move leaves this phase. All lines are released on entry (ADR 0044). |
  | `requiresReason` | A reason is required to enter (lost, cancelled, reopened). |
  | `requiresAssignee` | The ticket must have its main assignee (ADR 0034) to enter. |
  | `invoiceable` | Invoices can be created, and only after the last line has ended. |
  | `event` | The phase is entered by a quote event instead of by hand: `QUOTE_SENT` or `QUOTE_ACCEPTED`. At most one phase per event. |

- **Minimum configuration**, checked on every change and refused with `CONFLICT`: one `entry` phase and one `terminal` phase.
- **Transitions are data.** `TicketPhaseTransition` (from → to) says where a ticket may go. The default is every forward move plus a move to any terminal phase.
- **Quote events.** `quote.send` and `quote.accept` move the ticket into the phase with the matching `event`, if there is one and the transition is allowed. Without such a phase the ticket's phase does not change. A phase with an `event` is not entered by hand. Payments and invoices never move a ticket.

### Moving a ticket
- One command: `ticket.changePhase({ ticketId, phaseId, reason? })`. The phase is never set through `update`.
- A move is atomic. Core checks the transition, the phase flags and the line states the move implies (ADR 0044). If anything blocks, nothing changes and `CONFLICT` lists every blocker.
- History comes from `AuditLog`. `phaseChangedAt` supports lists, sorting and time in phase.

### Removing and renaming
- Rename and recolor are free and change no behavior.
- Removing is archiving. A phase that holds tickets is archived only with a **target phase** chosen: the tickets move there in one logged operation, through the same checks as a normal move.
- The last `entry` or `terminal` phase cannot be archived, and a flag change that would break the minimum configuration is refused.

### Predefined tickets
- A predefined ticket (`TicketTemplate`) is organization data: name, ticket type, the phase the ticket starts in, default own-field values and lines (item, optional setup, offset and duration from the ticket start, quantity fixed or per headcount).
- `ticket.createFromTemplate({ templateId, customerId, startsAt, quantity })` creates a ticket with its lines in one step. The lines get their states from the grid for the template's phase (ADR 0044). A collision refuses the whole creation and lists the blocking lines.
- Payment for a small ticket is a Swish or card link or an invoice. The customer never uses the app.

### Board and views
- The pipeline board (ADR 0041) has one column per active phase in position order and a collapsed Closed lane for terminal phases. Cards are tickets.
- Dashboard counts group by phase flag (open, terminal, invoiceable), never by phase name (ADR 0021).

### Commands and permissions
- `ticketPhase.list|get|create|update|archive|reorder|setTransitions|importTemplate` under `ticketPhase:read|admin`.
- `ticket.list|get|create|update|changePhase|createFromTemplate|export` under `ticket:read|write`; `ticketTemplate.list|get|create|update|archive` under `ticketTemplate:read|admin`. `ticket.export` gives json, pdf or csv (ADR 0024).
- Assignments use the subject types `TICKET` and `ITEM` (ADR 0034). Search, embeddings and generative UI cover tickets.
- All operations exist on web, GraphQL, REST and MCP (ADR 0003). AI proposes, the user approves (ADR 0007).

## Consequences
- The ticket types, phases, transitions and predefined tickets of an organization are data, set up through the guided setup (ADR 0044) and edited in settings.
- Templates ("Conference estate": New, Site visit, Quote sent, Confirmed, Final count locked, Completed, Lost, Cancelled) preset phases, transitions and flags.
- The demo seed (ADR 0025) creates phases, states, grids and predefined tickets per organization.
- There are no production users, so no data is migrated or backfilled. The schema change is added as new migrations; applied migrations are never edited. The old tables are dropped in the same change only after confirming no deployed database holds data that must survive; otherwise expand/contract applies (ADR 0013).

## Not decided
- One pipeline per organization. A pipeline per ticket type is deferred; a nullable `pipelineId` on `TicketPhase` would allow it later.
- Automation on phase entry (send mail, create task) is deferred. Phase flags, quote events and line states are the only automation.
