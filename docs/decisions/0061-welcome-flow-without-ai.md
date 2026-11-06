# 0061 – Welcome flow without AI

- **Date:** 2026-10-22
- **Status:** Accepted
- **Related:** supersedes 0045 (soft-landing onboarding); amends 0046 (user settings); builds on 0062, 0063, 0021, 0043, 0044, 0050
- **Spec:** `docs/specs/welcome.md`
- **Amended by:** 0072 (phone, email and photo are owned per organization on the member profile)

## Context
- First setup was an AI chat. Without a configured model the only way forward was "Skip".
- A non-AI path already existed: a preset builds and saves a full baseline.
- Setup status was stored per user, but whether an organization is set up is a fact about the organization. An invited member of an unfinished organization had no row.
- Members had no profile beyond name and email.

## Decision
1. `/welcome` is the entry for a signed-in user without an organization in the URL. It lists their organizations and pending invitations and offers creating one. `/select-organization` is removed.
2. `/:org/welcome` is a router that sends the member to the first unfinished step: profile, working hours, then setup, only when the organization's setup is pending and the member has `pipeline:write`. The app layout runs the same check.
3. Setup is step pages with no AI: organization, kind, spaces, food, extras, review. The kind prefills the item-type steps. Review saves through `pipelineSetup.activate` with `actor=user`. Skipping is allowed.
4. Presets are data: a venue kind names its item types and a phase template. Item type names are i18n keys.
5. Setup status moves to the organization (`OrganizationProfile.setupStatus`: `PENDING`, `COMPLETED`, `SKIPPED`), created `PENDING` with the organization. The per-user onboarding status is removed.
6. The profile belongs to the user, not the membership. Name, phone and avatar are entered once. `User.name` is a projection of first and last name, written only by a trigger.
7. Operations exist on every surface. Profile and working hours use `self:*`. Organization profile uses `configuration:*`. Setting setup status needs `pipeline:write`.

## Rejected
- Keeping the AI chat with a wizard as fallback: two paths to maintain, and the chat added little over picking a kind.
- A profile per membership: the same person retypes their phone in every organization.
- Setup status per user: invited members get no explanation, and two admins could each be pending.

## Consequences
- The AI onboarding chat, its system skill and its approval card are removed. The assistant can still change setup later.
- Onboarding works with no AI model configured.
- Profile data lives in its own user-scoped table, because Better Auth's `User` table is global and refused by `scopedDb`.
- Working hours became org-scoped with ADR 0068.
