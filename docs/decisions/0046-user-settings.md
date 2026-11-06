# 0046 – User settings

- **Date:** 2026-10-19
- **Status:** Accepted
- **Related:** 0039, 0045, 0003, 0004, 0006, 0051

## Context
- Some per-user state is behaviour the system acts on, first the onboarding status that decides where a user lands. It must survive browsers and devices.
- `UserPreference` (ADR 0039) is opaque JSON for UI choices. System behaviour needs typed, validated columns.
- Date, clock, number and money formats affect everything the app shows, and the AI and API must set them with validated values.

## Decision
1. `UserSettings` is a separate table with one typed row per user. Settings are owned, nullable columns, where `null` means the default (ADR 0051) and no row means all defaults.
2. It is user-scoped like `UserPreference` (ADR 0039), reached only through `scopedDb`, with `userSettings.get` and `userSettings.update` on every surface under `self:read|write`.
3. Display formats (date, clock, number, money) are columns here, not preference keys. One formatter per kind in core writes every date and number, and `check:structure` refuses other formatting.
4. REST, GraphQL and MCP return machine values for every user: ISO 8601 UTC instants with a `timeZone`, amounts in minor units with a `currency`. Formatting per user there would change an integration's input whenever someone edits their profile.
5. Money format is one setting with four fixed styles that set separators and currency place together.

## Rejected
- Storing these in `UserPreference`: untyped, and the system acts on them.
- A separate currency-display setting on top of the number format: it gave 16 combinations, most of which nobody writes.

## Consequences
- The onboarding status moved to the organization (`OrganizationProfile.setupStatus`) and the AI onboarding was replaced by the welcome flow (ADR 0061).
- The assistant's prompt carries the user's formats so it writes values the same way.
- `currencyDisplay` stays as a legacy column until a later expand-and-contract step.
