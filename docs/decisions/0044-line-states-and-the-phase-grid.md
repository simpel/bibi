# 0044 – Line states, the phase grid and guided setup

- **Date:** 2026-10-18
- **Status:** Accepted
- **Related:** 0021, 0043, 0022, 0027, 0045, 0052, 0053, 0054
- **Spec:** `docs/specs/orders-statuses-and-states.md`

## Context
- An order allocates rooms, food and activities, and what "allocated" means changes over its life: held softly in a lead, booked after the deal, released on cancellation.
- Organizations must see and control that flow in their own words, and staff must see each line's state in the calendar.

## Decision
1. Every item type has its own states, driven only by generic flags: `hold` (`NONE`, `SOFT`, `HARD`), `inSheets`, `released`, `expires`. Transitions are data.
2. Lines carry the state. A soft hold is a line in a state with `hold = SOFT`, with no separate option record.
3. One expiry date per order (`Order.holdsUntil`) applies to every line in an `expires` state.
4. There is no queue and no rank. Several soft holds may overlap, and the calendar shows "held since". Who gets the room is a human decision.
5. A phase grid (phases by item types) sets the state lines move to when an order enters a phase. Empty cells keep the state. The move is atomic and lists every blocker.
6. Staff can override a single line, and phase moves skip it until `line.followPhase`.

## Rejected
- Automatic ordering of holds by first come: a VIP may need to go ahead of an earlier holder.

## Consequences
- `order.expireHolds` is a job (ADR 0027) that moves lines to the type's expiry state. The order's phase does not change.
- Sheets choose lines by `inSheets`, so they contain only what the organization marked sendable.
- Holds became a database projection and history is `LineStateChange` (ADR 0052, 0053, 0054). The setup wizard UI was replaced by the assistant onboarding, then the welcome flow (ADR 0045, 0061).
