# 0067 – Ticket statuses, boards with phases as columns, and gates on transitions

- **Date:** 2026-10-24
- **Status:** Proposed
- **Related:** 0043 (supersedes), 0044 and 0054 (phase parts superseded, addenda on acceptance), 0021, 0034, 0045, 0051, 0052, 0053, 0057
- **Spec:** `docs/specs/tickets-phases-and-states.md`

## Context
Checked 2026-10-24 against the code in this worktree:
- `TicketPhase` (`packages/db/prisma/schema/ticket-phase.prisma`) is already a stored status. It has transitions (`TicketPhaseTransition`), append-only history (`TicketPhaseChange`, ADR 0054), `Ticket.phaseId` as a projection, and one flag set that mixes three jobs: pipeline position (`entry`, `terminal`), guards (`requiresReason`, `requiresAssignee`, `requiresAcceptedQuote`) and behaviour (`invoiceable`, `event`).
- The grid `PhaseStateRule` (phases x item types) and `TicketTemplate.startPhase` also point at it.
- The word "phase" is used for the status itself, so there is nowhere to put a second, coarser level. The target scenario (Lindholmen at 50 users and 100 tickets on calendar and boards) needs several views of the same tickets (Sales, Ops, Billing), each with few columns, while the finer status stays one per ticket.
- Guards are flags on the destination status. They cannot express "needs an invoice sent", "deposit at least 30 percent" or "all lines hard-held", and they apply on every path into the status. `requiresPaidDeposit` is listed as not built in the spec.
- Impact: 77 non-test files in `packages` and `apps` reference `TicketPhase`, `phaseId` or the grid, about 32 of them in `packages/core`. The DB function `packages/db/sql/sync_line_occupancy.sql` reads `TicketPhase.terminal` (lines 5, 68 to 75, trigger on `TicketPhase` at 218 to 294).
- No database holds data worth keeping (ADR 0043), so no backfill is needed.

## Decision
1. **A ticket has one stored status, like a Jira issue.** `TicketPhase` is renamed `TicketStatus`, with `TicketStatusTransition`, `TicketStatusChange` and `Ticket.statusId` (a projection, ADR 0054 unchanged). The set is admin-defined; the default set is To do, In progress, Done.
2. **One code-owned flag stays: `closes`** (replaces `terminal`). Entering a closing status releases every line's hold. No move leaves it. At least one closing status and one `entry` status must exist.
3. **Boards are saved views.** A `Board` has a name, a saved filter over tickets (type, assignee, field values, status) and an order. An organization has any number of boards. Boards own no ticket data.
4. **A phase is a column of one board.** `BoardPhase` has a board, name, color and position. `BoardPhaseStatus` maps a status to exactly one phase per board (unique on board and status). A status not mapped on a board does not show there. Moving a card to a column with several statuses shows one drop zone per status, limited to allowed transitions. Dropping sets the status, through the one move command.
5. **Gates replace guard flags.** A gate is a check on a transition (from to), chosen from a code-owned catalogue and stored as data (`TicketStatusTransitionGate`: transition, gate key, parameters). The catalogue: `reason`, `assignee`, `acceptedQuote`, `invoiceSent`, `invoicePaid`, `depositPaid` (minimum percent), `allLinesHardHeld`, `staffAllocated`. `requiresReason`, `requiresAssignee` and `requiresAcceptedQuote` are removed and become gates on the transitions that used them. Gates read facts and never store them (ADR 0054).
6. **A refused move names the ticket, the target status and every failing gate.** `ticket.changeStatus` (renamed from `changePhase`) stays the only command, atomic, `CONFLICT` with all blockers. Quote events still move a ticket through the `event` flag on a status.
7. **Unchanged:** line states (`ItemState`, transitions, `LineStateChange`) and the grid, now keyed by status (`StatusStateRule`). "Billed" stays derived from invoices and payments (ADR 0057), not a status. Payments and invoices never move a ticket.
8. **Surfaces and permissions.** New operations `board.*`, `boardPhase.*` and `ticketStatusGate.*` on web, GraphQL, REST and MCP (parity, ADR 0003). No new permission feature (ADR 0050): statuses, boards, phases and gates are pipeline setup, so they use `pipeline:read`, `pipeline:write` and `pipeline:delete` like today's phase operations. A card move needs `ticket:write` plus passing gates, like `ticket.changePhase` today. Seed: demo organizations get the default statuses and one board per audience.

| New or changed column | Class (ADR 0051) |
|---|---|
| `TicketStatus.name, color, position, closes, entry, invoiceable, event` | owned |
| `Ticket.statusId` | projection of `TicketStatusChange` (trigger) |
| `Board.name, filter, position` | owned |
| `BoardPhase.name, color, position` | owned |
| `BoardPhaseStatus.statusId` | owned, foreign key (ADR 0056) |
| `TicketStatusTransitionGate.key, params` | owned |

## Consequences
- Renames for the codemod ticket (one Renames table, lands first): `TicketPhase` to `TicketStatus`; `TicketPhaseTransition` to `TicketStatusTransition`; `TicketPhaseChange` to `TicketStatusChange`; `Ticket.phaseId` to `statusId`; `PhaseStateRule` to `StatusStateRule` (`phaseId` to `statusId`); `TicketTemplate.startPhase` to `startStatus`; `PhaseEvent` to `StatusEvent`; operations `ticketPhase.*` to `ticketStatus.*`, `ticket.changePhase` and `ticket.phaseHistory` to `changeStatus` and `statusHistory`, `phaseGrid.*` to `statusGrid.*`; flag `terminal` to `closes`; i18n keys, `pipelineSetup` and the `phase` grid UI text. The word "phase" is then free for board columns.
- Database: `sync_line_occupancy.sql` reads `TicketStatus.closes` and its trigger moves to `TicketStatus`; the reconciliation check and `packages/db/CLAUDE.md` trigger list follow.
- Cost: about 32 core files read the phase, 77 files overall, plus the board UI, the onboarding path (ADR 0045) and the setup preview.
- On acceptance these must change (not in this PR): `packages/core/CLAUDE.md` (status and gate rules, `changeStatus`), `packages/db/CLAUDE.md` (trigger and projection list), `apps/web/CLAUDE.md` (board and drop-zone rules), root `CLAUDE.md` (differentiator and configurable-domain lines that say "phases"), `docs/specs/tickets-phases-and-states.md` (split into statuses, boards and gates; "Not built yet: `requiresPaidDeposit`" becomes the `depositPaid` gate), a new `docs/specs/boards.md`, `docs/domain-model.md` and `docs/artifacts/domain-model.html` together. ADR 0043 is marked Superseded by 0067; ADR 0044 and 0054 get dated addenda pointing here.
- Follow-up tickets in dependency order: codemod (renames), schema and trigger, core operations and gates, boards UI, seed and onboarding.

## Alternatives rejected
- **A column defined by a pure query over facts, with no stored status.** One source of truth and no drift between status and facts. Rejected: staff need a human decision that no fact captures (parked, waiting for customer, lost), transitions and the move history need a stored subject, drag and drop needs something to set, and every board would re-implement the same derived rules.
- **Keep flags on the destination status.** Cheapest. Rejected: a flag cannot take parameters (deposit percent), cannot differ by source status, and the catalogue of flags grows with every new guard.
- **One fixed pipeline with phases as the only level.** What exists today. Rejected: it gives no per-audience boards and forces one column set on 50 users.
- **Phases own statuses (a status belongs to one phase globally).** Rejected: Sales and Billing need to group the same statuses differently, so the mapping must be per board.
