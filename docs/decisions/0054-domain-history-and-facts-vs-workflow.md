# 0054 – Domain history is owned data; workflow never stores facts

- **Date:** 2026-10-19
- **Status:** Accepted
- **Related:** 0014 (logging), 0032 (audit log retention), 0043 (ticket and phases), 0044, 0051
- **Spec:** `docs/specs/tickets-statuses-and-states.md`

## Context
- ADR 0043 said "history comes from `AuditLog`", so phase history, time-in-phase and "held since" depended on a table that is permission-gated, pseudonymised after 365 days (ADR 0032) and shaped for evidence, not queries.
- `phaseChangedAt`, `phaseReason` and `heldAt` stored the latest history entry a second time.
- Quote events push a ticket into a phase but a later manual move does not touch the quote, so the phase could say "Inquiry" while the quote said `ACCEPTED`, and nothing showed the mismatch.

## Decision
1. **Two append-only history tables, owned by core:** `TicketPhaseChange` and `LineStateChange`, each with who, when and a `trigger`.
2. **The current value is a projection of the history.** `Ticket.phaseId` and `Line.stateId` stay as foreign keys and are set by a trigger on insert into the history table, never written directly. The duplicated columns are removed.
3. **The audit log stays evidence.** No feature reads from it, and pseudonymising it never changes business history.
4. **Facts stay on their records; phases only guard.** Quote status lives on `Quote`, payment status on `Payment`, holds on lines. A phase flag may require a fact on entry. A phase that contradicts a fact is a derived warning, never silently resolved. Rejected: letting the phase store the fact.
5. History `reason` text follows organization data retention, not the audit pseudonymisation job.

## Consequences
- Time-in-phase and conversion reports are plain SQL on `TicketPhaseChange`, open to anyone with `ticket:read`.
- Phase moves, quote events, `line.changeState` and `ticket.expireHolds` insert history rows instead of updating columns.
- The seed checks verify that every ticket's `phaseId` equals its latest change.
