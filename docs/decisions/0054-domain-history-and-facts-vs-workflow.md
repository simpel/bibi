# 0054 – Domain history is owned data; workflow never stores facts

- **Date:** 2026-10-19
- **Status:** Accepted
- **Related:** 0014 (logging), 0032 (audit log retention), 0043 (ticket and phases), 0044, 0051

## Context
- ADR 0043 says "history comes from `AuditLog`". So phase history, time-in-phase reports and "held since" depend on a table that is:
  - permission-gated (`audit:view`, admins only),
  - pseudonymised after 365 days (ADR 0032),
  - shaped for evidence (before/after JSON images), not for queries.
- At the same time `Ticket.phaseChangedAt` and `phaseReason`, and `ProgramItem.heldAt`, store the latest entry of that history a second time.
- Quote events (`QUOTE_SENT`, `QUOTE_ACCEPTED`) push a ticket into a phase. A later manual phase move does not touch the quote. So the phase can say "Inquiry" while the quote says `ACCEPTED`, and nothing shows the mismatch.

## Decision
1. **Two append-only history tables, owned by core:**
   - `TicketPhaseChange`: `ticketId`, `fromPhaseId`, `toPhaseId`, `reason`, `changedAt`, `changedBy`, `trigger` (`MANUAL`, `QUOTE_EVENT`, `TEMPLATE`, `SYSTEM`).
   - `LineStateChange`: `lineId`, `fromStateId`, `toStateId`, `changedAt`, `changedBy`, `trigger` (`MANUAL`, `PHASE`, `EXPIRY`, `SYSTEM`).
2. **The current value is a projection of the history.** `Ticket.phaseId` and `Line.stateId` (ADR 0052) stay as foreign keys for constraints and indexes. They are set by a trigger on insert into the history table, never written directly. `phaseChangedAt`, `phaseReason` and `heldAt` are removed and read from the latest history row.
3. **The audit log stays evidence.** It still records every command. No feature reads from it, and pseudonymising it never changes business history.
4. **Facts stay on their records; phases only guard.**
   - Quote status is owned by `Quote`. Payment status by `Payment`. Holds by lines.
   - A phase flag may require a fact before entry: `requiresAcceptedQuote`, `requiresPaidDeposit` (later). These are checked on entry, like `requiresAssignee`.
   - Quote events may still move the ticket forward, as a convenience, recorded with `trigger = QUOTE_EVENT`.
   - A phase that contradicts a fact is shown on the ticket as a derived warning (for example "Quote accepted, ticket in Inquiry"). It is never silently resolved by changing either side.
5. History rows may hold free-text `reason`. It is covered by the same personal-data retention as other organization data, not by the audit pseudonymisation job.

## Consequences
- Time-in-phase and conversion reports become plain SQL on `TicketPhaseChange`, open to anyone with `ticket:view`.
- ADR 0043 gets an addendum: "History comes from `TicketPhaseChange`".
- `ticket.changePhase`, quote events, `line.changeState`, phase moves and `ticket.expireHolds` insert history rows instead of updating columns.
- Demo seed creates history rows through the same operations. The seed checks verify that every ticket's `phaseId` equals its latest change.
