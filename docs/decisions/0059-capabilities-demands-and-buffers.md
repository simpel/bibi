# 0059 – Capabilities, demands, allocations and buffers

- **Date:** 2026-10-20
- **Status:** Accepted
- **Related:** 0021 (amended), 0050 (amended), 0052 (amended), 0053 (amended), 0051, 0056, 0043, 0044
- **Plan:** `docs/plans/type-capabilities-and-resources.md`

## Context
- A type was a flat list of behaviours that mixed pricing, structure and scheduling, with hidden dependencies between them.
- Real events need optional extras with limited stock, staff needed only for setup and teardown, per-layout setup time and working hours.
- ADR 0021 says a bundle's price is charged and part prices only spread VAT. ADR 0052 says the line is the only record of what is sold. Both stay.

## Decision
1. A type is a set of capability sections with settings (pricing, availability, layouts, stock, bundle, customisations, resources, staffing). Code owns each capability's logic and the organization configures its settings. There are no organization-defined behaviours or rules.
2. Names: capability, Bundle, Customisations. The rename from behaviour, composable and choices is done end to end with no aliases.
3. A bundle expands into one bundle line plus part lines linked by `Line.parentLineId`. Parts get default times from offset and duration, are editable, and move with the bundle by the same delta.
4. The bundle line carries the price. Part lines show their effective price but do not count in the total.
5. Bundle VAT is allocated across parts by effective price times quantity with largest-remainder rounding. Each part uses its own rate, and a quote or invoice freezes one row per rate.
6. Customisations work on any item. An option has a price effect (included, extra, replaces). Opting out is choosing another option, not a waiver.
7. `ItemDemand` (owned) is what an item asks of a pool: an item type with optional tags, required or not, quantity, and windows (setup, booking, teardown).
8. A pool is the units matching a type and tags. `LineAllocation` (owned) records which unit a booking got. Availability chains, for example an AV unit needs a free technician.
9. A type is Equipment or Person, on one engine. Staff are items.
10. A unit is held only for its demand's windows. The hold inherits the parent line's kind and is a projection written by the trigger family.
11. A mandatory demand is met only when a unit is allocated. An unfilled optional demand is a derived warning, never stored.
12. An allocation is not a line and never appears on customer documents.
13. `setupMinutes` and `teardownMinutes` are nullable on type, item and line (`null` inherits). Effective setup is the larger of that value and the layout changeover, never the sum.
14. Buffers exist for soft holds too, as non-blocking rows, with a `TEARDOWN` type.
15. A bookable item has working hours: a weekly pattern with exceptions. They are soft: they decide who is offered, and an off-schedule pick only warns. The no-double-booking constraint stays hard.
16. No new permission features. Type sections need `configuration:write`, demands and working hours need `item:write`, allocating needs `program:write` plus `item:read`. The manager preset gains `item:write`.

## Rejected
- Derived `Line` rows for allocations: breaks ADR 0053 and 0052.
- Storing an offset and deriving part times: two writers for `startsAt`.
- Separate mechanisms for equipment and people, or a separate staff entity: duplicates targeting, allocation and the projection.
- A warnings envelope on every `Result`: touches every operation for a derivable state.
- Hard enforcement of working hours: schedules bend in practice.
- A rules engine of organization-defined behaviours.

## Consequences
- Bundle expansion is real code, and quote and invoice amounts carry a per-rate VAT breakdown for bundle lines.
- `sync_line_occupancy` and its reconciliation check grow.
- Rule 16 holds for engine re-derivation too: `line.*` and `itemDemand.*` keep allocation slots in step without needing the other feature's permission, and neither returns the other feature's data.
- A staff item can link to a member profile (ADR 0068). It still has no login of its own.
