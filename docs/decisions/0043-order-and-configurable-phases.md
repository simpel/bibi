# 0043 – The order: one record through organization-defined phases

- **Date:** 2026-10-18
- **Status:** Superseded by 0067
- **Related:** 0021 (configurable domain), 0022 (quotes and occupancy), 0034 (assignments), 0041 (three primary views), 0044 (line states and the phase grid), 0054 (history)
- **Spec:** `docs/specs/orders-statuses-and-states.md`

## Context
- A customer request is one continuous thing from first contact to the delivered event. Lines (rooms, food, activities) are added, removed and changed long before and after the deal.
- The organization's pipeline must show that whole lifecycle in the organization's own words. Nothing about the phases can be fixed in code, including their number and names.

## Decision
- **One record: the order.** It is created from a request or from a predefined order and lives until completed, lost or cancelled. It never turns into another record.
- **Phases are organization data.** Behaviour comes only from generic phase flags (`entry`, `terminal`, `requiresReason`, `requiresAssignee`, `invoiceable`, `event`). Transitions between phases are data too. A minimum of one `entry` and one `terminal` phase is enforced.
- **Quote events move the order** into the phase marked with that event, when allowed. Payments and invoices never move an order.
- **One command moves an order** (`order.changePhase`), atomically, and lists every blocker when it refuses.
- **Predefined orders** let staff create an order and its lines in one step, without a quote. The customer never uses the app.

## Consequences
- Order types, phases, transitions and predefined orders are data, set up through the guided setup (ADR 0044, 0045) and edited in settings.
- No database holds data worth keeping, so nothing is migrated or backfilled; the demo seed is rewritten to match (ADR 0025).

## Not decided
- A pipeline per order type, and automation on phase entry, are deferred.

## Addendum 2026-10-19 – history and facts (ADR 0052, 0054)
- History is `OrderPhaseChange`; `Order.phaseId` is a projection. `ProgramItem` is renamed `Line`, and the order owns the headcounts.
