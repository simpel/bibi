# 0059 – Capabilities, demands, allocations and buffers

- **Date:** 2026-10-20
- **Status:** Accepted
- **Related:** 0021 (amended), 0050 (amended), 0052 (amended), 0053 (amended), 0051 (single source of truth), 0056 (records and relations), 0043, 0044
- **Plan:** `docs/plans/type-capabilities-and-resources.md` (slices and sizes)

## Context
- A type is edited as a flat list of behaviours (`PRICED`, `COMPOSABLE`, `CHOICES`, `BOOKABLE`, `SETUPS`). The list mixes pricing, structure and scheduling, and some entries depend on others (`CHOICES` needs `COMPOSABLE`, `SETUPS` needs `BOOKABLE`).
- Real events need more: a room with optional AV that costs extra and is limited in stock, a technician needed only for setup and teardown, a lunch with its own setup time, staff who do not work every day, and a day schedule of who and what is needed when.
- Checked in code (2026-10-20):
  - Bundle expansion into lines is not implemented. `ItemComponent` is read only by `features/item/*`, GraphQL, seed checks and one count in `entity-type/behaviours.ts`. `Line` has no link to a parent.
  - `sync_line_occupancy` writes a setup buffer only for hard holds, and that buffer blocks. `Occupancy` is unique on `(lineId, type)`.
  - A line has one VAT rate, and quote totals are sums of per-line amounts.
- ADR 0021 says a package's price is charged and the parts' prices only spread VAT. ADR 0052 says the line is the only record of what is sold. Both are kept; this ADR makes them work together.

## Decision

### Types are built from capabilities
1. A type is a set of **capability sections with settings** (pricing, availability, layouts, stock, bundle, customisations, resources, staffing), not a flat list of toggles. Code owns the logic of each capability and the organization configures its settings. A genuinely new capability ships as code. There are no organization-defined behaviours or rules.
2. The names are **capability**, **Bundle** and **Customisations**, and the code keys change with them, end to end: `behaviour` becomes `capability` everywhere (the `ItemBehaviour` enum becomes `ItemCapability`, `EntityType.behaviours` becomes `capabilities`, the constants, files, UI components and API fields follow), `COMPOSABLE` becomes `BUNDLE`, `CHOICES` becomes `CUSTOMISATIONS`, `ItemComponent` becomes `ItemPart` (field `components` becomes `parts`), and `ItemChoiceGroup` becomes `ItemCustomisationGroup` (`choiceGroupId` becomes `customisationGroupId`, `choiceGroups` becomes `customisationGroups`). One change covers the Prisma enum, tables and columns, core schemas and operations, GraphQL, REST and OpenAPI, MCP tools, web, i18n keys and strings, system skills, templates, the demo seed, tests and docs. No aliases, no deprecated names, no data migration: the seed is updated and one migration renames in place. "Package" in user-facing strings, in the Conference venue template's type name and in the customer "Save as package" flow becomes "Bundle".

### Bundles and customisations
3. A bundle expands onto a ticket as one **bundle line** plus **part lines** linked by `Line.parentLineId` (owned). Part lines get their times at expansion from the component's offset and duration (defaults), are editable per event, and move with the bundle line by the same delta in one operation.
4. The bundle line carries the price (ex VAT). Part lines show their effective price (line, else price list, else item) but do not count in the total (`inTotal`). Comparisons between the two are read-only UI. No cost price, no margin, no stored comparison.
5. **VAT:** the bundle price is allocated across the parts in proportion to effective price times quantity, with largest-remainder rounding so the parts sum exactly. Each part uses its own VAT rate. A quote or invoice freezes one row per rate. One core function computes it.
6. **Customisations work on any item**, not only bundles. An option is an item with a price effect (included, extra, replaces). The rule that `CHOICES` needs `COMPOSABLE` is dropped. A chosen option's needs are mandatory, a group with minimum 0 can be skipped, and opting out is choosing another option, not a waiver.

### Demands, pools and allocations
7. **`ItemDemand`** (owned): what an item asks of a pool. Target is an item type, optionally with required tags (a join table, ADR 0056), plus `required`, `quantity` and `windows` (a set of `SETUP`, `BOOKING`, `TEARDOWN`). Options and bundle parts use the same targeting (a specific item or a pool).
8. A **pool** is the units matching a type and tags. **`LineAllocation`** (owned) records which unit a booking got. The UI lists the units with one prepicked (first free in pool order) and staff can change it. Availability chains: an AV unit needs a free technician for each of its windows.
9. A type is **Equipment** or **Person**. The needing item shows two lists, **Resources** (equipment) and **Staffing** (people), on one engine. Staff are items, with no profile or login yet.
10. **Holds:** a unit is held only for its demand's windows. The hold inherits the parent line's kind (soft with soft, hard with hard) and is a projection written by the trigger family. The unit's own buffers do not apply around an allocation window, and no location or travel is modelled.
11. A mandatory demand is met only when a unit is allocated. An unfilled optional demand is a **derived warning** on line reads, carrying only ids and a kind (feature scope, ADR 0050). `Result` does not change and nothing is stored.
12. A `LineAllocation` is not a line and never appears on customer documents. Customers see the bundle line and any priced option (for example "Our technician").

### Buffers
13. `setupMinutes` and `teardownMinutes` are nullable on type, item and line, and empty inherits (ADR 0051 rule 1). The effective value is derived with its source. Effective setup is the larger of that value and the layout's changeover time, never the sum.
14. Buffers exist for soft holds too, as non-blocking rows. A `TEARDOWN` occupancy type is added, and the `Occupancy` key grows beyond `(lineId, type)` to cover allocations and windows.

### Working hours
15. A bookable item has working hours: a weekly pattern with exceptions (opening hours for a room, part time and days off for a person). Absence uses the existing manual `INTERNAL` blocks.
16. Working hours are **soft**. They decide who is offered, prepicked and counted as free. Staff can pick someone off-schedule, which gives a warning. The database enforces nothing about them. The no-double-booking exclusion constraint stays hard.

### Permissions
17. No new features. Type sections and defaults need `configuration:write`. Demands, an item's minutes and working hours need `item:write`. Allocating needs `program:write` plus `item:read`. Absence is `occupancy.*` (feature `ticket`). The **manager preset gains `item:write`** (not `item:delete`).

### Data classes (ADR 0051)
| Data | Class |
|---|---|
| `setupMinutes`, `teardownMinutes` (type, item, line), `ItemDemand`, `LineAllocation`, `Line.parentLineId`, part line times, working hours, Equipment or Person | owned |
| Effective minutes, warnings, free pool, prepick, day schedule, bundle VAT breakdown on a draft | derived |
| Resource, setup and teardown holds | projection (trigger, reconciliation check extended) |
| Bundle VAT rows on a sent quote or invoice | snapshot |

## Consequences
- Bundle expansion becomes real code. Quote and invoice amounts change from one VAT rate per line to a per-rate breakdown for bundle lines.
- `sync_line_occupancy` grows: soft buffers, `TEARDOWN`, allocation windows, the `max` rule. The reconciliation check and the SQL tests grow with it. There is no data to migrate (no production users).
- The rename in decision 2 is a large mechanical change (about 190 files) that lands first. ADR 0013's expand/contract rule is waived for its migration because there are no production users.
- A day schedule view needs no new storage.
- The manager preset changes, so the permission tests and docs change with it.
- Each slice states its demo seed change (for example a pool of 10 AV units, a pool of 2 technicians with schedules, a conference-day bundle) and updates `docs/demo-seed.md`.
- When this ADR is accepted, update `CLAUDE.md` (the trigger list, "code owns only generic behaviours", the manager role) and `docs/domain-model.md` with `docs/artifacts/domain-model.html`.

## Alternatives rejected
- **Derived `Line` rows for allocations.** Breaks ADR 0053 (application code never writes line holds) and ADR 0052 (every line is something booked or sold).
- **Storing an offset and deriving part times.** `Line.startsAt` would then have two writers, against ADR 0051.
- **Two parallel mechanisms for equipment and people.** Duplicates targeting, allocation and the projection.
- **A separate staff entity.** Needs a second path through occupancy, lines and the exclusion constraint. Revisit when staff need logins or schedules as first-class data.
- **A warnings envelope on every `Result`.** Touches every operation for a state that is better derived.
- **Hard enforcement of working hours** in the hold function. Schedules bend in practice (swaps, overtime).
- **A per-line waiver** for a mandatory demand. Opting out is a customisation.
- **Organization-defined behaviours** (a rules engine). Orgs configure settings of built-in capabilities.
