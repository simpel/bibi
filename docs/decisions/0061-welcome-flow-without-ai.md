# 0061 – Welcome flow without AI

- **Date:** 2026-10-22
- **Status:** Proposed
- **Related:** supersedes 0045 (soft-landing onboarding); amends 0046 (user settings); builds on 0062 (org-scoped URLs), 0063 (file storage), 0021 (configurable items), 0043 and 0044 (phases, states, grid), 0050 (permissions)
- **Spec:** `docs/specs/welcome.md`

## Context
- Checked on 2026-10-22 in `apps/web/src/features/onboarding/`, `packages/core/src/features/pipeline-setup/` and `packages/core/src/templates/setup-presets/`:
  - The first setup is an AI chat at `/onboarding`.
  - Without a configured model the only way forward is "Skip".
  - `pipelineSetup.presetDraft` and `pipelineSetup.activate` already build and save a full baseline from a preset without any AI.
- Invitations are reached only through the email link. `/select-organization` lists memberships but not pending invitations.
- Onboarding status is per user (`UserSettings`, ADR 0046), but "is this organization set up" is a fact about the organization. An invited member of an unfinished organization has no row, so nothing tells them why the board is empty.
- Members have no profile beyond `name` and `email`: no phone, no avatar, no working hours.

## Decision
1. **Entry:** `/welcome` is where a signed-in user without an organization in the URL lands. It shows:
   - their organizations
   - pending invitations for their email (`organization.listUserInvitations`)
   - "Create a new organization" (`/welcome/new`, with a visible, validated slug: ADR 0062)

   Picking, accepting or creating goes to `/:org/welcome`. `/select-organization` is removed.
2. **`/:org/welcome` is a router.** It sends the member to the first unfinished step:
   1. `profile`: first name, last name, phone, avatar.
   2. `hours`: working hours, defaulting to Mon–Fri 08–17 with lunch 12–13.
   3. `setup/*`: only when the organization's setup is `PENDING` and the member has `pipeline:write`.
   4. `done`: when setup is pending and the member cannot do it.
   5. `/:org/pipeline`: when everything is done.

   The app layout runs the same check, so the flow cannot be bypassed.
3. **Setup is step pages, no AI:** `organization` (address, website, org number, contact), `kind` (9 venue kinds + "Start empty"), `bookable`, `sellable`, `review`.
   - The kind prefills both type steps; each says types can be added later in Settings.
   - Review saves through `pipelineSetup.activate` with `actor=user`.
   - "Skip for now" sets `SKIPPED`.
   - Lists are not part of setup.
4. **Presets are data** (`templates/setup-presets`): the 9 kinds plus empty. Each names its bookable and sellable item types and a phase template. Item type names are i18n keys, so the organization gets them in the creating member's language.
5. **Setup status moves to the organization:** `OrganizationProfile.setupStatus` (`PENDING`, `COMPLETED`, `SKIPPED`).
   - It is created `PENDING` together with the organization.
   - `UserSettings.onboardingStatus` is removed (amends 0046).
6. **The profile belongs to the user, not the membership.** Name, phone, avatar and hours are entered once and follow the user across organizations.

| Column | Kind (ADR 0051) |
|---|---|
| `UserProfile.firstName`, `lastName`, `phone`, `avatarKey` (user-scoped, one row per user) | owned |
| `User.name` | projection of first + last, written only by the `sync_user_name.sql` trigger |
| `UserWorkingHours.weekday`, `start`, `end`, `breakStart`, `breakEnd` | owned |
| `OrganizationProfile.setupStatus`, `legalName`, `orgNumber`, `streetAddress`, `postalCode`, `city`, `country`, `website`, `contactEmail`, `contactPhone` | owned |

7. **Operations on every surface** (ADR 0003):
   - `profile.get` / `profile.update` and `workingHours.get` / `workingHours.set`: permission `self:read|write`.
   - `organizationProfile.get` / `organizationProfile.update`: `configuration:read|write` (there is no `organization` feature; configuration is the setup-group feature, ADR 0050).
   - `organizationProfile.setSetupStatus`: `pipeline:write`.

## Consequences
- The AI onboarding is removed:
  - the chat UI and the `(onboarding)` route group
  - the "First setup" system skill and the `onboarding` AI feature
  - the assistant's first-setup mode, the setup approval card and the e2e mock

  `Questionnaire` and `pipeline-setup/ui` stay because other features use them. The assistant can still change the setup later (`change-setup` skill).
- New tables: `UserProfile`, `UserWorkingHours` (user-scoped) and `OrganizationProfile`; `UserSettings` is dropped. `User` is Better Auth's global table and `scopedDb` refuses it, so profile data lives in its own user-scoped table. The demo seed fills all of them.
- Onboarding works with no AI model configured.

## Alternatives rejected
- **Keep the AI chat and add a wizard as a fallback:** two paths to maintain. The chat added little over picking a kind.
- **Profile per membership:** the same person would type their phone number again in every organization. Per-organization data (role, responsibilities) already lives on `Member`.
- **Setup status per user (ADR 0046 as is):** members of an organization that is not set up get no explanation, and two admins could each be "pending".
