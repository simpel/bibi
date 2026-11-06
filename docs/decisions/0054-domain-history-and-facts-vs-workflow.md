# 0054 – Domain history is owned data; workflow never stores facts

- **Date:** 2026-10-19
- **Status:** Accepted
- **Related:** 0014 (logging), 0032 (audit log retention), 0043 (order and phases), 0044, 0051
- **Spec:** `docs/specs/orders-statuses-and-states.md`

## Context
- ADR 0043 took history from `AuditLog`, which is permission-gated, pseudonymised after a year and shaped for evidence, not queries.
- The latest phase change and "held since" were also stored a second time on the order and line.
- A phase could contradict a fact (phase "Inquiry" while the quote is accepted) and nothing showed it.

## Decision
1. Two append-only history tables owned by core: one for order phase changes and one for line state changes, each with who, when and a trigger.
2. The current phase and state are projections of the history. A trigger on insert sets them. The duplicated columns are removed.
3. The audit log stays evidence. No feature reads history from it.
4. Facts stay on their records (quote status on the quote, payment status on the payment, holds on lines). A phase flag may require a fact on entry. A phase that contradicts a fact is a derived warning, never silently resolved.
5. History reason text follows organization retention, not audit pseudonymisation.

## Rejected
- Letting the phase store the fact: it goes stale when the fact changes elsewhere.

## Consequences
- Time-in-phase and conversion reports are plain SQL, open to anyone with `order:read`.
- Phase moves, quote events and hold expiry insert history rows instead of updating columns.
- Seed checks verify each order's current phase equals its latest change.
