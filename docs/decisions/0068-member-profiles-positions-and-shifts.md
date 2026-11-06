# 0068 – Member profiles, positions and shifts

- **Date:** 2026-10-24
- **Status:** Accepted, contact details per organization added by 0072
- **Related:** amends 0059 (staff are items, no login) and 0061 (user working hours); builds on 0050, 0051, 0053, 0056, 0064
- **Order:** #442

## Context
- Profile and working hours were keyed by user, so one person had one schedule in every organization.
- `Member` is the only org-scoped record of a person, and nothing linked it to a staff item.
- The no-double-booking constraint is per item, so one person with two staff items could be held twice at once.
- People work in several roles and, over time, for several organizations.

## Decision
1. `MemberProfile` (owned, org-scoped, one per member) holds a person's work in that organization. The global user profile keeps name, phone and avatar. Access level stays on `Member` (ADR 0050).
2. A profile links to zero or more staff items (Person-type items). An item belongs to at most one profile. A staff item without a profile stays valid for freelancers.
3. Positions are the types of the linked staff items. There is no separate position list, and the same type list is the staffing pool that demands target (ADR 0059). A person with two positions has two staff items.
4. A profile has a schedule kind: `PATTERN` (weekly pattern with exceptions), `SHIFTS` (dated shifts only) or `CASUAL` (no schedule, offered last).
5. Working hours move to the profile, per organization.
6. A `Shift` (owned) is a dated instant range for a profile, optionally for one position. Shifts do not overlap for one profile.
7. Schedules are advisory (ADR 0064). Prepick prefers people on shift. Allocating someone off shift is allowed and warns. Nothing about schedules is enforced by the database.
8. A person must not be held twice at once. The hard exclusion moves from item to person: staff holds carry a derived `personKey` (profile id, else item id), written only by the hold trigger, with a second exclusion constraint on hard holds. Soft holds may overlap. Linking or unlinking an item that would create an overlap is refused.
9. A conflict reads as "already held as <position> on <order>".
10. Profile, schedule, links and shifts need `item:write`. Members edit their own phone and avatar as before. Operations appear on every surface.

## Rejected
- Keeping hours on the global user: one schedule cannot serve two employers.
- A separate position list: two lists to keep in step.
- One staff item per person with several positions: breaks type as position and pool targeting.
- Enforcing the person-wide rule in code only: races between two orders.
- Hard enforcement of shifts: swaps and overtime are normal.

## Consequences
- A data migration copies each user's hours to every organization they belong to.
- A second exclusion constraint on a hot table, plus an extended reconciliation check.
- Rule docs and specs follow on acceptance. Implementation orders: #448 to #451, seed #456.
