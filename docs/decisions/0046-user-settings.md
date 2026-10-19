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
- **Operations**, on every surface (ADR 0003), permission `self:read|write`:
  - `userSettings.get` → `{ id, onboardingStatus, updatedAt }` of the caller.
  - `userSettings.update({ onboardingStatus })` → upsert, audited. The AI actor needs approval like any command.
  - REST `GET` and `PUT /user-settings`, GraphQL `userSettings` and `userSettingsUpdate`, MCP `userSettings_get` and `userSettings_update`.
- **The state drives the onboarding:**
  - Creating an organization sets `PENDING` (`afterNewOrganization`).
  - The app layout sends a user whose status is `PENDING` to `/onboarding` before anything else.
  - Skip sets `SKIPPED`; approving the first-setup card sets `COMPLETED` and opens the board.
  - Invited members never get a row, so they go straight to the app.
- **Dev switcher:** each user in the dev menu is a sub-menu with "Switch to" and "Reset onboarding". Reset sets that user's row to `PENDING` through `resetDevOnboarding` in `@okazi/auth` (dev environment only, seeded dev users only). It writes another user's row directly, which no operation may do, so it is dev tooling and not an operation.

## Consequences
- One new table and migration; the demo seed is unchanged (seeded users have no row).
- The onboarding no longer relies on routing alone: a user who closes the tab mid-setup is sent back to it next time, until they finish or skip.
- Operations and adapters sit next to the preference ones (`features/user-preference/`, `settings-schema.ts`), because both are the caller's own data and `packages/core/src/index.ts` is at its line limit.
