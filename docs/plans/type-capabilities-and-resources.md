# Plan (draft): type capabilities, bundles, customisations, resources and buffers

Status: draft for review. All design decisions are made (21 below, no open ones). Not an ADR and no tickets exist yet. Written from a design conversation; every claim marked **verified** was read in code or ADRs, the rest is a decision or a proposal.

## Goal
An org admin builds a type from generic parts and can model, for example, a conference day: a room with optional AV (limited stock, priced extra) that needs a technician for setup and teardown only, a lunch that needs a waiter from setup start, and a day schedule showing who and what is needed when.

## Decisions (made by the product owner)
1. A type is built from **capability sections with settings**, not a flat list of toggles. Code keeps owning the logic; orgs configure settings. New capabilities ship as code, never as org-defined logic.
2. Names: **capability**, **Bundle** and **Customisations**, and the code keys change with them, end to end and without aliases: `behaviour` to `capability` everywhere (enum, column, constants, files, UI, API), `COMPOSABLE` to `BUNDLE`, `CHOICES` to `CUSTOMISATIONS`, `ItemComponent` to `ItemPart`, `ItemChoiceGroup` to `ItemCustomisationGroup`. "Package" in user-facing strings, the template type name and "Save as package" becomes "Bundle". Resources and Staffing are settled (decision 11). The other section labels are tentative: Pricing, Availability, Room layouts (setups), Stock.
3. **Customisations work on any item**, not only on bundles. Each option is an item with a price effect (included, extra, replaces).
4. Crew is a **bookable item**. Any item can need resources, **mandatory** (missing one blocks) or **optional** (missing one warns).
5. Every item has **`setupMinutes` and `teardownMinutes`**, like calendar travel time. Effective setup is the **larger** of the item's `setupMinutes` and the layout's changeover time (never the sum). A booking with parts at 10, 15 and 30 min shows 30.
6. A resource is held **only for the windows it needs**: any of SETUP, BOOKING, TEARDOWN. The technician only for setup and teardown, the waiter for setup and the booking.
7. A resource hold **inherits the parent line's hold kind** (soft with soft, hard with hard). No special "scarce resource" logic.
8. Limited stock is modelled as a **pool**: a need targets an item type (optionally with required tags), a free unit is allocated. The UI lists the units, **one prepicked** (deterministic: first free in pool order), staff can change it.
9. A bundle's `offsetMinutes` and `durationMinutes` are **defaults**. Each event's lines can change them (lunch 40 min at one conference, 70 at another).
10. Solutions are **generic**: no "crew", "AV" or "technician" in code.
11. **Equipment and people are separate in the product.** The needing item has two labelled lists, **Resources** (equipment) and **Staffing** (people), on one engine. A type is either Equipment or Person, which decides which list offers it. Staff are in the first cut, without a profile or login. Code names: `ItemDemand` (what an item asks of a pool) and `LineAllocation` (which unit a booking got); "pool" is the plain-English term for the units matching a type and tags.
12. **People have schedules.** Working hours (a weekly pattern, e.g. part time and never Wednesdays) are an Availability setting on a bookable item, and absence uses the existing manual blocks. This follows right after staff, not in the first cut.
13. **Opting out is a customisation, not a waiver.** The need hangs on a customisation option, e.g. group "Installation" with "Our technician" (a priced service item that needs a technician) or "Self-install" (adds nothing). A chosen option's needs are mandatory, so a missing person blocks that option only. A group with minimum 0 can be skipped. There is no per-line waiver concept.
14. **Bundles price as one line externally; the parts stay visible internally.** The bundle line carries the price (ex VAT, as all prices today). Customer documents (quote, invoice, payment page) show that line, with VAT per rate. The part lines stay on the ticket with their own effective prices (line, else customer price list, else item), so staff can see what each part is worth next to the bundle price; they do not count in the total (quotes already have an `inTotal` flag). Any comparison between the two (a sum, a difference) is a read-only UI calculation. It adds no stored value, projection or snapshot, and the architecture does not own it. There is no cost price or margin. The one thing that is architecture is VAT: items have different rates (alcohol and food), so the bundle price is allocated across the parts in proportion to their effective price times quantity, with largest-remainder rounding so the parts sum exactly, and the quote or invoice freezes one row per VAT rate. One core function computes it.
15. **Setup and teardown minutes resolve in three levels:** a type default, an item override, a line override. Each is nullable and empty inherits; the effective value is derived with its source, the same pattern as price. The effective setup is then the larger of that value and the layout's changeover time.
16. **A resource is held exactly for its demand's windows.** The person's or equipment's own setup and teardown minutes do not apply around an allocation window, and no location or travel is modelled. Applying the unit's own buffers to every hold on it is a possible later change.
17. **Allocations never appear on customer documents.** A `LineAllocation` is not a line. Customers see the bundle line and any priced customisation option (for example "Our technician"), because those are lines (decisions 13 and 14).
18. **Warnings are derived on read.** An unfilled optional demand is a state, not an event: line reads carry a derived `warnings` field, like the effective price and VAT, with no change to `Result` and nothing stored. Parity is automatic because lines are read on all four surfaces. Under the feature-scope rule a warning carries only ids and a kind (for example an unfilled demand id); the item's name is resolved through the item operation, so a denied piece shows as hidden.
19. **Permissions use existing features, no new ones.** Type sections, the Equipment or Person choice and the type default setup and teardown minutes need `configuration:write`. An item's demands, its setup and teardown minutes and a person's working hours need `item:write`. Allocating a unit needs `program:write` plus `item:read` to reference it. Recording absence is `occupancy.*`, owned by the `ticket` feature. **The manager preset gains `item:write`** (not `item:delete`), which amends ADR 0050; it named item editing as a per-member override.
20. **Working hours are soft.** Schedules decide who is offered, prepicked and counted as free on a given day; staff can still pick someone off-schedule by hand, which gives a derived warning. A mandatory demand is met only when a unit is allocated, so with no free on-schedule unit it is met only by that explicit choice. The no-double-booking constraint stays hard.
21. **Nothing in the database enforces working hours.** The free pool, the prepick and the warning are evaluated on read in core. No trigger, projection or new constraint.

## Verified facts that shape the work
- Bundle expansion into lines **is not implemented**. `ItemComponent` is read only by `features/item/*`, the GraphQL item schema, DB registration, seed checks and one count in `entity-type/behaviours.ts`. `Line` has no parent-line link. ADR 0021 and ADR 0052 describe it, so it is new work.
- ADR 0052 (price is line-level, the line is the only record of what is sold) conflicts with ADR 0021 ("the package's price is charged, parts' prices only spread VAT"). Resolved by decision 14.
- ADR 0053: line holds are written only by the trigger `sync_line_occupancy` (`packages/db/sql/`), application code never writes them, and a reconciliation check proves the projection (ADR 0051 rule 7).
- `sync_line_occupancy.sql` writes a `SETUP` buffer only for **hard** holds and `SETUP` rows block. Soft holds get no buffer today.
- `Occupancy` is unique on `(lineId, type)`: one `HOLD` and one `SETUP` per line. Resource holds on other items and a `TEARDOWN` need a new key.
- A hard-hold exclusion constraint per item (`Occupancy_no_overlap`) is what prevents double booking; it must stay.
- Verified: prices are VAT-exclusive and a line has one VAT rate (line, else item, else venue default). `lineAmounts` rounds net and VAT per line and quote totals are sums (`features/quote/line-totals.ts`). A bundle with mixed rates therefore changes the one-rate-per-line shape into a per-rate breakdown.
- "Requirement" already means a count against a list on a ticket (ADR 0021). Do not reuse the word for resource needs.

## Target model (ADR 0051 classes)
| Thing | Class | Notes |
|---|---|---|
| `EntityType`, `Item` and `Line` `setupMinutes` and `teardownMinutes` | owned | nullable at every level, empty inherits (decision 15); the effective value and its source are derived on read |
| `ItemDemand` (item needs a resource) | owned | target = item type (+ required tags via join table, ADR 0056), `required`, `quantity`, `windows` (enum array of SETUP, BOOKING, TEARDOWN) |
| `Line.parentLineId` | owned | links a part line to its bundle line |
| Part line times | owned | stored on the line at expansion, editable per event; moving a bundle line moves its parts by the same delta in one operation |
| `LineAllocation` (allocation) | owned | line, `ItemDemand`, chosen unit (null while unfilled) |
| Resource, setup and teardown holds | projection | written by the trigger family, inherit `holdKind`, up to three windows per allocation, reconciliation check extended |
| Type choice Equipment or Person | owned | on `EntityType`, item types only |
| Working hours (weekly pattern, exceptions) | owned | on a bookable item; absence reuses manual `INTERNAL` blocks (`occupancy.*`, verified) |
| Bundle VAT breakdown | derived on a draft, snapshot on send | the bundle price allocated across parts by effective price, one frozen row per VAT rate on quotes and invoices |
| Day schedule | derived | read model over lines and occupancy, grouped by resource and day, no new storage |

A mandatory demand is met only when a unit is allocated (decision 20). An unfilled optional demand is a derived warning on line reads (decision 18); `Result` does not change.

## Slices (dependency order, sizes are first guesses)
Every slice states its seed change (ticket rule) and keeps 1:1 parity (web, GraphQL, REST, MCP).

1. **ADR: capabilities, resources and buffers.** Supersedes parts of 0021, 0052, 0053. Records the decisions above, including what it supersedes. XS.
1b. **Rename behaviours to capabilities, `COMPOSABLE` and `CHOICES` end to end.** `behaviour` to `capability` everywhere, enum values, `ItemComponent` to `ItemPart`, `ItemChoiceGroup` to `ItemCustomisationGroup`, every surface, i18n, skills, templates, seed, tests, docs; one in-place migration. Lands before slices 3, 4, 5 and 7. XL (about 190 files).
2. **Setup and teardown buffers.** Item fields, `max` rule, `TEARDOWN` occupancy, soft buffers as non-blocking rows, trigger and reconciliation. M to L.
3. **Targets: specific item or type plus tags.** One shared selector used by bundle parts, customisation options and resource needs; unit allocation with prepick. M.
4. **Bundle expansion into lines.** `parentLineId`, part times from defaults, move cascade, per-rate VAT breakdown for the bundle price (decision 14), frozen as one row per rate on quotes and invoices. L.
5. **Customisations on any item.** Options as priced items with a price effect, decoupled from Bundle in the model and UI. M to L. Needs 3 and 4.
6. **Resources and staffing.** `ItemDemand`, `LineAllocation`, the Equipment or Person type choice, the two labelled lists, window projection, derived warnings, and the chained pool check (AV needs a technician, 10 units but 2 people). Conflicts and the allocation UI name the missing pool and window. XL, split in: data and projection, allocation UI, derived warnings. Needs 2 and 3.
7. **Type editor.** Capability sections replace the behaviour checkboxes, new labels in sv and en, docs guide. The rename of keys and strings is its own slice (1b). M. Starts after the ADR; sections land with the slice that owns each.
8. **Day schedule view.** Rows are rooms, people and equipment, blocks are setup, booking and teardown. Needs 2 and 6. M.
9. **Working hours for bookable items.** A weekly pattern with exceptions on any bookable item (opening hours for a room, working hours for a person), absence as `INTERNAL` manual blocks, and read-time evaluation for the free pool, the prepick and the warning (decisions 20 and 21). M. Needs 6.
10. **Manager preset gets `item:write`.** Union `grantAll({ features: ["item"], only: "write" })` into the manager preset in `permissions/presets.ts`, amend ADR 0050, update the permission tests and the docs. XS, independent of the other slices.

## Open decisions
None. All decisions above are made; the next step is the ADR (slice 1).


## Board issues (project 8, all in Backlog)
ADR: `docs/decisions/0059-capabilities-demands-and-buffers.md` (Proposed).

| Slice | Issue | Size | Priority |
|---|---|---|---|
| 1. Accept the ADR | #378 | XS | P1 |
| 1b. Rename keys end to end | #390 | XL | P1 |
| 2. Setup and teardown buffers | #379 | L | P1 |
| 3. Pool targets | #380 | M | P1 |
| 4. Bundle expansion and per-rate VAT | #381 | L | P1 |
| 5. Customisations on any item | #382 | L | P1 |
| 6a. Demands, allocations, holds projection | #383 | L | P1 |
| 6b. Allocation UI | #384 | M | P1 |
| 6c. Derived warnings | #385 | S | P1 |
| 7. Type editor | #386 | M | P1 |
| 8. Day schedule view | #387 | M | P2 |
| 9. Working hours | #388 | M | P2 |
| 10. Manager preset `item:write` | #389 | XS | P1 |

Dependencies are in each issue under "Depends on". Move a card to Todo when its blockers are done; #378 is `type:decision`, so the autonomous run never picks it.
