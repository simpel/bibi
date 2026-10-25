# 0046 – User settings

- **Date:** 2026-10-19
- **Status:** Accepted
- **Related:** 0039 (user preferences), 0045 (soft-landing onboarding), 0003 (parity), 0004 (multi-tenancy), 0006 (database conventions)

## Context
- The onboarding (ADR 0045) has a state that belongs to a person: not started, pending, finished or skipped. It must survive browsers and devices and decide where the user lands.
- ADR 0039's `UserPreference` is a generic key/value store for UI choices with opaque values. Behaviour that the system acts on (redirect to the onboarding) needs a typed, validated column, not a JSON value that each UI interprets.

## Decision
- **A separate table, `UserSettings`: one typed row per user.** Columns: `userId` (unique), `onboardingStatus` (`PENDING`, `COMPLETED`, `SKIPPED`), timestamps. Future per-user behaviour settings become columns here, not keys in `UserPreference`.
  - No row means the user was never asked, so nothing is pending. `userSettings.get` then returns `onboardingStatus: null` and `id: null`.
- **User-scoped like `UserPreference`** (ADR 0039): no `organizationId`, listed in `USER_SCOPED_MODELS`, reached only through `scopedDb`, which pins every query to the acting user and refuses the system actor.
- **Operations**, on every surface (ADR 0003), permission `self:read|write` (ADR 0050):
  - `userSettings.get` → `{ id, onboardingStatus, updatedAt }` of the caller.
  - `userSettings.update({ onboardingStatus })` → upsert, audited. The AI actor needs approval like any command.
  - REST `GET` and `PUT /user-settings`, GraphQL `userSettings` and `userSettingsUpdate`, MCP `userSettings_get` and `userSettings_update`.
- **The state drives the onboarding:**
  - Creating an organization sets `PENDING` (`afterNewOrganization`).
  - The app layout sends a user whose status is `PENDING` to `/onboarding` before anything else.
  - Skip sets `SKIPPED`; approving the first-setup card sets `COMPLETED` and opens the board.
  - Invited members never get a row, so they go straight to the app.
- **Dev switcher:** each user in the dev menu is a sub-menu with "Switch to" and "Reset onboarding". Reset sets that user's row to `PENDING` through `resetDevOnboarding` in `@bibi/auth` (dev environment only, seeded dev users only). It writes another user's row directly, which no operation may do, so it is dev tooling and not an operation.

## Consequences
- One new table and migration; the demo seed is unchanged (seeded users have no row).
- The onboarding no longer relies on routing alone: a user who closes the tab mid-setup is sent back to it next time, until they finish or skip.
- Operations and adapters sit next to the preference ones (`features/user-preference/`, `settings-schema.ts`), because both are the caller's own data and `packages/core/src/index.ts` is at its line limit.

## Addendum 2026-10-22 – setup status moves to the organization
- `onboardingStatus` is removed. The setup status is `OrganizationProfile.setupStatus`, and the AI onboarding is replaced by the welcome flow (ADR 0061).

## Addendum 2026-10-25 – date and clock formats (#481)
- `UserSettings` comes back with two owned, nullable columns: `dateFormat` (`D_MMM_YYYY`, `D_MMMM_YYYY`, `YYYY_MM_DD`, `DD_MM_YYYY`, `MM_DD_YYYY`) and `clockFormat` (`H24`, `H12`). `null` = the default, `D_MMM_YYYY` (27 Aug 2026) and `H24` (ADR 0051). No row means the defaults.
- `userSettings.get` and `userSettings.update({ dateFormat?, clockFormat? })` on every surface (REST `GET`/`PUT /user-settings`), `self:read|write`. Omitted keeps a value, `null` resets it. Set on `/profile`.
- A typed setting, not a `UserPreference` key: every date and time the app shows depends on it, the AI and API set it with a validated enum, and the server reads it to render.
- One formatter, `createDateTimeFormat({ locale, timeZone, formats })` in core `time/`, writes every date and time: `date`, `time`, `dateTime`, `weekday` and the ranges. It assembles dates from `Intl.DateTimeFormat.formatToParts`, because Intl options alone cannot give `27 Aug 2026` in English (they give `Aug 27, 2026`). Month and weekday names follow the UI language. The web app gets it from `getDateTimeFormat()` (server) and `useDateTimeFormat()` (client); `check:structure` refuses next-intl `format.dateTime`/`dateTimeRange` and `toLocale*String` outside the time module.

## Addendum 2026-10-25 – number format and currency display (#482)
- Two more owned, nullable columns: `numberFormat` (`SPACE_COMMA` 1 234,50, `COMMA_DOT` 1,234.50, `DOT_COMMA` 1.234,50, `SPACE_DOT` 1 234.50) and `currencyDisplay` (`SYMBOL` kr, `CODE` SEK). Unlike the date format, `null` follows the UI language (sv `1 234,50 kr`, en `SEK 1,234.50`): a fixed default would look foreign in one of the two languages.
- The currency itself is not a user setting. Payments and receivables store their own `currency`; amounts without one (item prices, quote totals, budgets) use core's `DEFAULT_CURRENCY` until an organization setting exists. Where the currency stands follows the UI language, and amounts always have two decimals.
- One formatter, `createNumberFormat({ locale, formats })` in core `number/` (`number`, `money`, `amount`), formats with `Intl.NumberFormat` and swaps in the chosen separators from `formatToParts`. The web app gets it from `getNumberFormat()` and `useNumberFormat()`; `check:structure` refuses raw currency formatting, `Intl.NumberFormat`, `toLocaleString` and next-intl `format.number` outside it.
- The assistant writes values the same way: its system prompt gets a formats section (`formatsSection`, examples from both formatters, the organization's zone and the local time), for dates, clock, numbers and amounts alike.
- REST, GraphQL and MCP data stay machine values for every user: instants in ISO 8601 (UTC) with a `timeZone`, amounts in minor units with a `currency`. Formatting per user there would change an integration's input whenever someone edits their profile; a client that wants the user's style reads `userSettings.get`.
