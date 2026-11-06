# 0072 – Contact details per organization, on the member profile

- **Date:** 2026-10-25
- **Status:** Accepted
- **Amends:** 0068 (member profiles), 0061 (the person's profile), 0063 (who reads a file)
- **Related:** 0071 (view read models), 0051 (single source of truth)
- **Order:** #486

## Context
- A booking names who to call internally, and staff need that person's phone, email and photo.
- ADR 0068 kept phone and avatar on the global user profile, so a person had one phone and photo for every venue and colleagues could not read them.
- Bibi hosts competing venues. A person at two of them should be reached differently at each, and one venue must never see what the other holds.

## Decision
1. Phone, work email (null shows the login email) and avatar are owned per organization on `MemberProfile`. Every member of that organization can read them and no other organization can.
2. The global user profile keeps first and last name and the defaults for new memberships. It stays private to the person, and organization data never goes there.
3. Prefilled, never synced. Joining an organization copies the person's phone and photo into empty member-profile fields, and so does saving the user profile for the current organization. A value set on the member profile is never overwritten.
4. The name stays global.
5. A member's photo is readable by colleagues: `file.get` serves a key that is a member profile's avatar in the caller's organization. Every other key stays the uploader's (ADR 0063).
6. Phone and work email are edited with `memberProfile.update`.

## Rejected
- Colleagues reading the global profile, limited to shared organizations: still one phone and photo for every venue.
- A public profile for every Bibi user: shows phone numbers across competing venues.

## Consequences
- The calendar contact (ADR 0071) carries phone, email and photo from the member profile.
- Working hours now live once, on the member profile (#449), instead of three places. A staff item linked to a member works the member's hours. The global table is dropped later (expand/contract, ADR 0013).
- Open: a linked staff item has its own name beside the member's, and the two can drift.
