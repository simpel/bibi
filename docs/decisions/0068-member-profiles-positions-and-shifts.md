# 0068 – Member profiles, positions and shifts

- **Date:** 2026-10-24
- **Status:** Proposed
- **Related:** amends 0059 (staff are items, no login) and 0061 (user working hours); builds on 0050 (permissions), 0051 (single source of truth), 0053 (holds), 0056 (foreign keys), 0064 (time, advisory hours)
- **Ticket:** #442

## Context
- Checked on 2026-10-24:
  - `packages/db/prisma/schema/user-profile.prisma`: `UserProfile` (name, phone, avatar) and `UserWorkingHours` are keyed by `userId`, so they are global. The same person gets one schedule in every organization.
  - `auth.prisma`: `Member` (organization, user, role) is the only org-scoped record of a person. Nothing links a member to a staff item.
  - ADR 0059 rule 9: a Person-type item has no profile or login. Rule 15 and 16: working hours are advisory.
  - `occupancy.prisma` and migrations `20261015044802_occupancy`, `20261103000000_item_states`: the no-double-booking constraint is `EXCLUDE USING gist ("itemId" WITH =, tsrange(...) WITH &&)`. It is per item, not per person.
- Target: Lindholmen with 50 users and 100 tickets on the calendar and boards. People work in several roles (a waiter who also bartends) and, over time, for several organizations.
- Gaps: a user cannot be staffed because staff items do not know the user; schedules cannot differ per organization; two staff items for one person can be held at the same time; there is no way to say "works these dated shifts" or "is called in when needed".

## Decision
### Profile and links
1. **`MemberProfile`** (owned, org-scoped, one per `Member`, unique on `memberId`) holds the person's work in that organization. It is not `UserProfile`: that stays global for name, phone and avatar (ADR 0061). Access level stays on `Member` (ADR 0050).
2. A member profile has zero or more **staff items** (Person-type items, ADR 0059) through a link table `MemberProfileItem(memberProfileId, itemId)`, a foreign key on both sides (ADR 0056). An item belongs to at most one profile. A staff item without a profile stays valid (external or freelance staff, no login).
3. **Positions are the types** of the linked staff items (Waiter, Technician, Bartender, Sales). There is no separate position list. The same type list is the staffing pool that demands target (ADR 0059 rule 7), so "who can do this" and "who is on the list" are one answer. A person with two positions has two staff items.

### Schedule
4. The profile has a **schedule kind** (owned): `PATTERN` (weekly pattern with exceptions, the ADR 0064 rule 10 shape), `SHIFTS` (dated shifts only) or `CASUAL` (no schedule, offered last).
5. `UserWorkingHours` moves to the profile: `MemberWorkingHours` keyed by `(memberProfileId, weekday)`, plus the exceptions of ADR 0064 #429. Migration copies each user's rows to every organization the user is a member of, then drops the global table.
6. **`Shift`** (owned): `memberProfileId`, `startsAt`, `endsAt` (instants, ADR 0064), optional `itemId` (the position worked, null = any), `note`. Shifts may not overlap for one profile.
7. **Advisory (ADR 0064 rule 11):** prepick and the free-pool list prefer people on shift (pattern hours, a shift, then casual); allocating someone off shift is allowed and shows a derived warning (ids and kind only). Nothing about schedules is enforced by a constraint or trigger.

### Person-wide collision
8. A person must not be held twice at once even through two staff items. The hard rule moves from item to **person**: holds of staff items carry a derived `personKey` (the profile id, else the item id), written only by the hold trigger (projection, ADR 0053), and a second `EXCLUDE USING gist ("personKey" WITH =, tsrange(...) WITH &&)` applies to hard holds. Soft holds still may overlap. Linking or unlinking an item recomputes the key and is refused when it would create an overlap.
9. A conflict reads as "already held as <position> on <ticket>", not as a constraint error.

### Permissions and surfaces
10. Profile fields, schedule, links and shifts need `item:write` (the manager preset has it, ADR 0050). A member edits their own phone and avatar through `UserProfile` as today. New operations live in `packages/core` first and appear in web, GraphQL, REST and MCP in the same change (parity). Seed: the demo organizations get linked staff items and a few shifts.

### Data classes (ADR 0051)
| Data | Class |
|---|---|
| `MemberProfile`, schedule kind, `MemberProfileItem`, `MemberWorkingHours`, exceptions, `Shift` | owned |
| Positions, on-shift status, warnings, prepick order | derived |
| `personKey` on staff holds | projection (trigger, reconciliation check extended) |

## Consequences
- Rule changes once accepted: `packages/db/CLAUDE.md` (person-wide exclusion constraint, `personKey` trigger and reconciliation), `packages/core/CLAUDE.md` (profile and shift operations, advisory ranking), `apps/web/CLAUDE.md` only if the profile editor adds a UI pattern.
- Specs: new `docs/specs/member-profiles.md` (profile, links, schedule kinds, shifts, collision); update `docs/specs/welcome.md` (hours step writes the profile) and the staffing and allocation spec.
- Docs: Target notes in `docs/domain-model.md` and `docs/artifacts/domain-model.html` together; addenda in ADR 0059 (rule 9, staff are linked to a member profile) and 0061 (working hours are org-scoped).
- Cost: a data migration that copies hours per organization, and a second exclusion constraint on a hot table.
- Implementation tickets already exist: #448 (profiles and staff item links), #449 (working hours per org), #450 (shifts, ranking and warnings), #451 (person-wide collision constraint and trigger). The demo seed is #456.

## Alternatives rejected
- **Keep hours on the global user.** One schedule cannot serve two employers.
- **A separate position list** next to item types. Two lists to keep in step, and the staffing pool would still be item types.
- **One staff item per person with several positions.** Breaks "type = position" and the pool targeting of ADR 0059.
- **Enforce the person-wide rule in code only.** Races between two tickets; the database already owns the item-wide rule (ADR 0053).
- **Hard enforcement of shifts.** Swaps and overtime are normal (ADR 0059, ADR 0064).
