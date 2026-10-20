# 0044 – Line states, the phase grid and guided setup

- **Date:** 2026-10-18
- **Status:** Accepted
- **Related:** 0021 (configurable items), 0043 (ticket and phases), 0022 (occupancy), 0027 (job scheduler), 0036 (calendar view), 0045 (onboarding), 0052, 0053, 0054
- **Spec:** `docs/specs/tickets-phases-and-states.md`

## Context
- A ticket allocates rooms, food and activities, and what "allocated" means changes during its life: a room is held softly in a lead, booked after the deal and released after a cancellation; food is estimated, ordered, then locked at the final count.
- Organizations must see and control that flow, and staff must see each line's state in the calendar. The states are the organization's own words.

## Decision
- **Every item type has its own states** (`ItemState`), driven only by generic flags: `hold` (`NONE`, `SOFT`, `HARD`), `inSheets`, `released`, `expires`. Transitions between states are data.
- **Lines carry the state.** A soft hold is a line in a state with `hold = SOFT`. There is no separate option record.
- **One expiry date per ticket** (`Ticket.holdsUntil`) applies to every line in an `expires` state. Lines in other states ignore it.
- **No queue and no rank.** Several soft holds may overlap; the calendar shows "held since", oldest first. Who gets the room is a human decision (a VIP may go ahead of an earlier holder). Rejected: automatic ordering by first come.
- **The phase grid** (`PhaseStateRule`, phases × item types) sets the state lines move to when a ticket enters a phase. Empty cells keep the state. The whole move is atomic and lists every blocker.
- **Staff can override a single line** at any time; phase moves then skip it until `line.followPhase`.
- **Guided setup** walks an admin through types, states, phases and the grid with a preview before activation.

## Consequences
- `ticket.expireHolds` is a job (ADR 0027) that moves lines to the type's `expiryStateId`, audited per line; the ticket's phase does not change.
- Sheets use `inSheets` to choose lines, so a sheet only contains what the organization marked as sendable.
- The demo seed creates phases, states and grids per organization (ADR 0025).

## Addenda
- 2026-10-19: the wizard UI is replaced by the assistant onboarding at `/onboarding` (ADR 0045); the setup operations and templates stay.
- 2026-10-19: holds are a database projection, history is `LineStateChange`, `heldAt` is no longer a column (ADR 0052, 0053, 0054).
