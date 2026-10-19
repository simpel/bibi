# 0039 – User preferences

- **Date:** 2026-10-17
- **Status:** Accepted
- **Related:** 0003 (parity), 0004 (multi-tenancy), 0006 (database conventions), 0014 (system logging), 0034 (fixed access roles)

## Context
- The web app needs to remember per-user UI choices on the server, first the column order of data tables, so a choice follows the user between browsers and devices.
- Every table so far is org-scoped and every permission is granted by the member's role. A UI preference is neither: it belongs to one person, not to the organization, and no role should be able to withhold it.
- The `execute` pipeline (validation, permission, audit, system log) only runs with an organization on the context. A user without an active organization (for example a superadmin who belongs to none) has no context at all.

## Decision
- **Generic key/value store per user.** `UserPreference(userId, key, value Json)`, unique on `(userId, key)`. No domain words: keys are namespaced by the UI that owns them, e.g. `table.columns.<tableId>` = an array of column ids.
  - Key: `^[a-z0-9][a-z0-9._-]*$`, at most 200 characters. Value: any JSON value, at most 10 KB as JSON (UTF-8).
- **User-scoped, not org-scoped.** The table has no `organizationId`, so a preference follows the user across organizations. It is listed as a new kind of exception to ADR 0006: `USER_SCOPED_MODELS` in `packages/db/src/scoped/models.ts` (part of `UNSCOPED_MODELS`).
  - It is still reached only through `scopedDb`: for a user-scoped model the client ANDs `userId = actorId` into every `where`, forces it on every create and upsert, strips it from updates and refuses the system actor. A handler cannot read or write another user's rows even if it asks for them.
  - No `status` (an upsert replaces the value; there is no delete yet), no `createdBy` (the owner is `userId`).
- **Operations**, on every surface (ADR 0003):
  - `userPreference.list({ prefix? })` → `{ items: { id, key, value, updatedAt }[] }`: the caller's own rows only.
  - `userPreference.set({ key, value })` → the saved row (upsert). A command: audited, and approval is required when the AI actor calls it.
  - REST `GET /user-preferences?prefix=` and `PUT /user-preferences/{key}`; GraphQL `userPreferences(prefix:)` and `userPreferenceSet(input:)`; MCP `userPreference_list` and `userPreference_set`.
- **Permission `self:view|edit` (renamed by ADR 0050 from `self:read|write`; `RESOURCES` is now `FEATURES`, and API keys do not get `self`).** `self` is a pseudo-resource (`SELF_RESOURCE`), not in `RESOURCES`: no role grants or withholds it, and `hasPermission` grants it to every caller that has an execute context (an authenticated member of the active organization, or an API key/OAuth token bound to one). Ownership is enforced by the data layer, not by roles.
- **Audit and logging** follow the normal pipeline: one `AuditLog` row per `set` (entity type `userPreference`, before/after) in the organization the change was made from, and one system log line per call.
- **Web:** `features/user-preference/load.ts` (`loadUserPreferences({ prefix })` → key → value, `{}` when signed out or on error) and `actions.ts` (`saveUserPreference({ key, value })` → `ActionResult`). Both operations are in `UI_EXEMPT`: they have no page of their own.

## Consequences
- Org admins who read the audit log of their organization see the preference changes made there (UI choices only; no business data belongs in a preference).
- Preferences need an active organization on the session, like every other operation. A superadmin on `/admin` gets them when their session has an active organization; one who belongs to no organization gets `{}` and cannot save. A user-only execute context is left for later if that becomes a need.
- A new user-scoped table needs a `userId` column and an entry in `USER_SCOPED_MODELS`; `packages/db/test/user-scope.test.ts` checks both.
- Values are opaque to core: each UI validates what it reads back and falls back to its default when the value does not fit (e.g. a stored column that no longer exists).
