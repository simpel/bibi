# 0081 – Order intake: one page, packages or one-off, reviewed before Create

- **Date:** 2026-11-01
- **Status:** Accepted
- **Related:** 0043, 0044 (soft holds, no queue), 0052 (the line is the booking), 0053, 0059, 0071, 0078, 0003 (parity), 0007. Companions: 0082, 0084, 0085
- **Spec:** `docs/specs/order-intake.md`

## Context
- The order form was two unrelated forms, and both ended in an order with no lines. Lines came later, one save at a time.
- Staff need to see whether a request fits before they book. Availability was visible only after the order existed, and only hard collisions were reported.
- Nothing previewed lines without writing them.

## Decision
1. One intake page replaces the wizard and the short form. Nothing is written until Create, except a customer or contact created inline.
2. Customer and contact are required for every new order, in core, on every surface.
3. Duplicate customers are suggested, not prevented (`customer.findSimilar`).
4. "Package" is the UI name for a predefined order, with an optional guest range.
5. Packages are grouped as available, clashing, or outside the time or guest range. Every group can be picked.
6. Every intake ends in review. Planned lines are draft lines that staff edit before Create.
7. A new read, `order.previewLines`, plans lines without writing and returns them with issues: hard clash, soft overlap, self overlap, setup capacity, pool short and outside hours. One shared planning module serves the preview and create.
8. Intake starts in the entry status. A clash is prebooked, never refused, because soft holds may overlap (ADR 0044). A hard entry state that clashes is refused.
9. `order.create` creates the order and its lines in one command, all or nothing. `order.createFromTemplate` becomes a thin wrapper.
10. Open questions block Create; clashes and warnings do not.
11. Create re-checks inside its transaction. A new hard clash returns `CONFLICT`. An `intakeKey` makes a repeated submit return the first order.
12. `Order.note` is a new owned column for booking-level notes.
13. An unfinished intake is kept as a local browser draft.

## Rejected
- A wizard with one step per screen. Staff jump back and forth, and the last step needs the earlier ones in view.
- Create the order first, then add lines. An interrupted call leaves an empty lead.
- One `line.create` per line from the client. Not atomic, and every surface repeats the sequence.
- A persisted server draft order. A second lifecycle for one page.
- Refusing a clash. Staff often want to prebook and sort it out later.
- Keeping the package's start status in intake. A hard start status would turn every clash into a refusal.
- A per-item capacity. Package guest range and setup capacity cover the cases seen.

## Consequences
- Requiring a contact changes every seed, test and API client that creates an order.
- Setup capacity and pool free units become checked as issues.
- Candidate to merge into `docs/specs/order-intake.md`.
