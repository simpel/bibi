# 0072 – Contact details per organization, on the member profile

- **Date:** 2026-10-25
- **Status:** Accepted
- **Amends:** 0068 (member profiles), 0061 (the person's profile), 0063 (who reads a file)
- **Related:** 0071 (view read models), 0051 (single source of truth)
- **Ticket:** #486

## Context
- A booking on the calendar names who to call internally. Staff need that person's phone, email and photo, not only a name.
- Four entities describe a person:
  - `User`: the login, global, from Better Auth.
  - `UserProfile`: first and last name, phone and avatar. Global and private to the person (ADR 0061).
  - `Member`: one per organization, holding the role.
  - `MemberProfile`: one per organization, holding the person's work there (ADR 0068).
- ADR 0068 kept phone and avatar on `UserProfile`. So a person had one phone and photo for every venue, and colleagues could not read them.
- Bibi hosts competing venues. A person who works at two of them should be reached differently at each, and one venue must never see what the other holds.

## Decision
1. **Contact details are owned per organization on `MemberProfile`:** `phone`, `email` (work email; null shows the login email) and `avatarKey`. They are org-scoped like the rest of the profile, so every member of that organization can read them, and no other organization can.
2. **`UserProfile` is the person's own data:** first and last name (projected into `User.name`) plus the defaults for new memberships. It stays private to the person (ADR 0061). Organization data never goes there.
3. **Prefilled, never synced.**
   - Joining an organization copies the person's phone and photo into empty member-profile fields (Better Auth `afterAddMember` and `afterAcceptInvitation`).
   - Saving `UserProfile` does the same for the current organization, because the welcome flow saves the profile after joining.
   - A value set on the member profile is never overwritten.
4. **The name stays global** on `User`.
5. **A member's photo is readable by colleagues here:** `file.get` serves a key that is a member profile's `avatarKey` in the caller's organization. Every other key stays the uploader's (ADR 0063).
6. Phone and work email are edited with `memberProfile.update` (`item:write`, like the rest of the profile). The member's own page edit comes later.

## Consequences
- The calendar's contact (ADR 0071) carries phone, email and photo from the member profile.
- A migration adds the three nullable columns and prefills them from existing user profiles. It creates a member profile where one was missing.
- **Working hours** lived in three places: global `UserWorkingHours`, each staff item's `HoursDay`, and the `MemberWorkingHours` planned in ADR 0068. They now live once, on the member profile (#449): `HoursDay` and `HoursException` take a third owner, `memberProfileId`.
  - `workingHours.get|set` read and write the caller's member profile in the current organization, with the same contract.
  - A staff item linked to a member works the member's hours. `itemHours.get` shows them, and `itemHours.set` on it is a `CONFLICT`.
  - A migration copies each user's working days to every membership. `UserWorkingHours` is no longer read and is dropped in a later release (expand/contract, ADR 0013).
- Open overlap, a follow-up decision:
  - **A linked staff item has its own `name`** beside the member's, and the two can drift apart.

## Rejected
- **Colleagues read the global `UserProfile`**, limited to shared organizations. That still gives one phone and photo for every venue, which is wrong for people who work at several.
- **A public profile for every Bibi user.** It would show phone numbers across competing venues.
