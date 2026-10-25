# 0064 – Time and time zones

- **Date:** 2026-10-22
- **Status:** Accepted
- **Related:** 0042 (date helpers stay in core), 0051 (single source of truth), 0052 (the line is the booking), 0053 (holds are a projection), 0059 (buffers, working hours), 0061 (user working hours)

## Context
- The calendar, tickets and working hours all depend on time, and the app has no single rule for it.
- Checked in code (2026-10-22):
  - The zone is a constant in four places: `DEFAULT_TIME_ZONE` (`packages/i18n/src/time-zone.ts`), `SCHEDULE_TIME_ZONE` (worker), the demo seed and the calendar page. `Organization` and `Venue` have no zone column.
  - `calendar-layout.ts` builds a fixed 24 hour columns per day, which cannot be right on the two DST days (23 and 25 hours). Not yet confirmed by a test.
  - `Venue.openingHours` is a free-text string. `UserWorkingHours` stores minutes after midnight "in the organization's time zone", which does not exist as data.
  - All times are `DateTime` (instants). `Ticket.holdsUntil` and `desired*` are instants too. Relative times ("3 days ago") are formatted ad hoc with `useFormatter` in about ten components, with no tooltip.
- Venues may one day be in other zones (Norway, Finland). That is not built now, but nothing we build now may make it expensive.

## Decision

### What is stored
1. **Every stored time is an instant** (`timestamptz`). There are no date-only columns and no stored wall-clock times, except in hours patterns (rule 10). `holdsUntil` can be "13:00 on 14 Nov", so it stays an instant.
2. A **plain date** exists only as a code-level key (`PlainDate`, `plain-date.ts`): a period in a URL path, and the date of an exception in an hours pattern. It is never a column, except that exception date (rule 10). Query strings are a last resort, so the calendar's `?view=` and `?date=` move into the path: `/calendar/{from}/{to}`, two plain dates, both inclusive (a week is `/calendar/2026-11-09/2026-11-15`). Core turns them into `[start of from, start of to + 1 day)` in the zone. The view is derived from the range, never stored in the URL: 1 day is the day view, 7 days the week view, a whole calendar month the month view, anything else a list. Bare `/calendar` redirects on the server to today's range in the user's preferred view (ADR 0039). An invalid date redirects to today, `from` after `to` is swapped and a span over the cap (62 days) is cut. Optional filters (venue, type, state, phase, ticket) stay as query strings.

### Zones
3. `OrganizationProfile.timeZone` (owned, IANA name, required; `Organization` belongs to Better Auth, the profile is ours and exists from creation, ADR 0061) and `Venue.timeZone` (owned, nullable, `null` = inherit, ADR 0051). Core exposes one resolver, `effectiveTimeZone`, and nothing else reads a zone. The four constants are removed.
3a. The zone is chosen when the organization is created: `/welcome/new` (ADR 0061) gets a searchable dropdown of IANA zones after name and slug, defaulting to the user's current zone (from the browser, fallback `Europe/Stockholm`). It is editable later in organization settings, and a venue can override it.
4. Which zone applies: lines, occupancy and the calendar use the **venue's**; ticket-level fields (`holdsUntil`, `desired*`) and anything without a venue use the **organization's**. A zone change affects display and later entry only. It never moves a stored instant.

### Entry and display
5. Forms take local wall-clock time and convert once at the edge, in the zone from 4. A template time ("10:00") is resolved when the ticket is created, in the venue's zone.
6. A local time that does not exist (spring gap) moves forward to the first valid time. An ambiguous one (autumn) takes the earlier offset.
7. A day-only entry fills in **23:59**. Clients hold events outside working hours, so the default does not follow opening hours.
8. A **day** is midnight to the next midnight in the zone and can be 23 or 25 hours. Calendar columns are derived from instants, never a fixed 24. A block that crosses midnight is one block, clipped per day.
9. **Relative time** goes through one helper and one UI component (`RelativeTime` in `@bibi/ui`, taking the instant and zone). It always shows the exact date and time in a tooltip. Existing ad hoc uses are migrated.

### Hours
10. **Opening hours** (venue), **working hours** (user) and **item working hours** (#388) share one shape and one UX: a weekly pattern (weekday, start and end minute, optional break) plus dated exceptions (closed, or other hours), in minutes after midnight in the owner's zone.
10a. *Amended 2026-10-25 (#429).* The pattern is stored as wall-clock data: weekday rows in minutes, and an exception keyed by a plain-date column (`date`) with its minutes. Both are read in the owner's current zone, so a zone change moves the hours with the owner. Rules 1 and 2 exist for the exclusion constraint and the buffer triggers, which hours never reach (rule 11). An instant range per exception was rejected: rule 4 would pin it to the old zone's midnight, so after a zone change "24 Dec" would cover the wrong local day.
11. Hours are **advisory**. They are evaluated on read, never enforced by a constraint or trigger. Scheduling outside them is always allowed, and the system warns (on lines, occupancy and assignments alike).

### Multi-zone
12. A calendar for one venue uses its zone. "All venues" uses the organization's zone and labels a block with the venue's zone when it differs. Designed for, **accepted, not built**; it is built when a second zone exists.

### Data
| Column | Class |
|---|---|
| `OrganizationProfile.timeZone` | owned |
| `Venue.timeZone` | owned (`null` = inherit) |
| effective zone | derived on read |
| hours pattern and exception rows (`HoursDay`, `HoursException`) | owned (replace `Venue.openingHours`, whose text stays as a note) |

- Surfaces: `organizationProfile.update` and `venue.update` take `timeZone`; hours get their own operations on web, GraphQL, REST and MCP (ADR 0003). Permission follows the owning feature (ADR 0050).
- Seed: one demo venue with its own zone, and structured hours for the demo venues.
- Enforcement: `check:structure` (or a Biome rule) fails on `getHours()`-style calls, `new Date(y, m, d)`, hard-coded zone names and `format.relativeTime` outside the time module.

## Consequences
- One migration adds the zone columns. A second migrates the free-text opening hours.
- Creating an organization sets `timeZone` on its profile row (a required input of the create step, on every surface that creates one), and the welcome spec (`docs/specs/welcome.md`) gets the new field.
- The calendar's URL changes from `?view=&date=` to `/calendar/{from}/{to}` (existing links redirect). Switching view picks a new range around the same anchor day. The first day of the week is a rendering choice (locale), not part of the URL.
- The calendar needs a DST test (23 and 25 hour days, events past midnight).
- Relative times in the app change to show a tooltip.
- A second zone later costs a label and a column set, not a rewrite.

## Alternatives rejected
- **The browser's zone.** Staff abroad would see the venue's bookings shifted.
- **Date-only columns** for `holdsUntil` and `desired*`. A hold needs a time, and a second type adds conversions for no gain.
- **Floating wall-clock times stored with a zone per row.** It breaks the exclusion constraint and the buffer triggers (ADR 0053), which need instants.
- **Hours as a hard constraint.** Special events outside hours are normal here.
