# 0064 – Time and time zones

- **Date:** 2026-10-22
- **Status:** Accepted
- **Related:** 0042 (date helpers stay in core), 0051 (single source of truth), 0052, 0053, 0059 (buffers, working hours), 0061

## Context
- The calendar, orders and working hours all depend on time, and the app had no single rule for it. The zone was a constant in four places, and organization and venue had no zone column.
- Calendar columns assumed 24 hours a day, which is wrong on the two DST days. Opening hours were free text.
- Venues may one day be in other zones. That is not built now, but nothing built now may make it expensive.

## Decision
1. Every stored time is an instant (`timestamptz`). There are no date-only columns and no stored wall-clock times, except in hours patterns (point 9).
2. A plain date exists only as a code-level key, for example a period in a URL path. The calendar URL holds an inclusive date range and derives the view from it, never stores the view.
3. The zone is owned data: required on the organization profile, nullable on the venue (`null` inherits). One resolver, `effectiveTimeZone`, is the only reader, and the constants are removed. It is chosen at organization creation and editable later.
4. Lines, occupancy and the calendar use the venue's zone. Order-level fields and anything without a venue use the organization's. A zone change affects display and later entry, never a stored instant.
5. Forms take local wall-clock time and convert once at the edge. A nonexistent local time moves forward, an ambiguous one takes the earlier offset. A day-only entry fills in 23:59.
6. A day runs from midnight to the next midnight in the zone and can be 23 or 25 hours. Calendar columns derive from instants.
7. Relative time goes through one component that always shows the exact time in a tooltip.
8. Opening, user and item working hours share one shape: a weekly pattern plus dated exceptions.
9. The pattern is stored as wall-clock data in the owner's zone, so a zone change moves the hours with the owner. An instant range per exception would pin it to the old zone's midnight.
10. Hours are advisory. They are evaluated on read, never enforced by a constraint or trigger. Scheduling outside them warns.
11. A multi-venue calendar uses the organization's zone and labels other zones. Designed for, not built.

## Rejected
- The browser's zone: staff abroad would see bookings shifted.
- Date-only columns for hold expiry and desired times: a hold needs a time.
- Floating wall-clock times with a zone per row: breaks the exclusion constraint and buffer triggers, which need instants.
- Hours as a hard constraint: events outside hours are normal here.

## Consequences
- `check:structure` fails on zone-naive date calls and hard-coded zone names outside the time module.
- The calendar needs a DST test.
- A second zone later costs a label and a column set, not a rewrite.
- Operations that stamp a fact with the current instant read it through `nowOf({ context })`. Only internal callers such as the seed and tests set it, so history is written by the real operations at its own date. No adapter passes it.
