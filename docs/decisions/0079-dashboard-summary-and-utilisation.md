# 0079 – Dashboard summary, won/lost outcomes and utilisation

- **Date:** 2026-11-01
- **Status:** Accepted; decisions 5 and 6 superseded by ADR 0080
- **Related:** 0041 (three views, amends), 0077 (financials), 0071 (view read models), 0064 (time), 0021 (configurable domain)

## Context
- The dashboard showed open and closed counts and one badge per board column. ADR 0041 named a `dashboard.summary` operation that was never built.
- Staff want the pipeline in value, won and lost history and how loaded rooms and staff are.
- A status has no won or lost marker. `closes` is the only terminal flag, and "Lost" is just an organization's own name for a closing status.

## Decision
1. One view read model, `dashboard.summary`, on every surface. It needs `order:read`; each part from another feature is `null` without that feature's `read`. Everything is derived on read.
2. Pipeline by status: per open status, order count, confirmed value (accepted quotes) and estimated value of the rest, excl. VAT. Grouped by status id and flags, never by name.
3. Won and lost by proxy. The month an order enters a closing status is its outcome month. Won means it has an accepted quote or a sent invoice, lost means neither. No schema change.
4. Utilisation per bookable item type: booked minutes (holds inside open hours, merged so overlaps count once) over open minutes.
5. Money panel on the dashboard. Superseded by ADR 0080.
6. Period in the path. Superseded by ADR 0080.

## Rejected
- A `WON | LOST` flag on `OrderStatus` now. It needs a migration of every organization's statuses, and the quote proxy answers the same question. It stays an option if the proxy proves too coarse.
- Money inside `dashboard.summary`. It would duplicate `finance.overview` and its gate.
- Staff load as the allocation rate. Staff are items of a type, so utilisation covers them.

## Consequences
- Won and lost moved to `finance.overview`; utilisation now covers a look-ahead window (ADR 0080, 0086).
- Candidate to merge into a spec: `docs/specs/dashboard.md`.
