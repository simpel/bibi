# 0039 – User preferences

- **Date:** 2026-10-17
- **Status:** Accepted
- **Related:** 0003 (parity), 0004 (multi-tenancy), 0006 (database conventions), 0014 (system logging), 0034 (fixed access roles)

## Context
- The web app must remember per-user UI choices on the server, first the column order of data tables, so they follow the user across devices.
- Every table so far is organization-scoped and every permission comes from a role. A UI preference belongs to one person, and no role should withhold it.
- The `execute` pipeline needs an organization on the context.

## Decision
1. A generic key/value store per user, `UserPreference(userId, key, value Json)`, unique on `(userId, key)`. Keys are namespaced by the UI that owns them. Values are opaque to core and capped at 10 KB.
2. It is user-scoped, with no `organizationId`, as a new kind of exception to ADR 0006 (`USER_SCOPED_MODELS`). `scopedDb` still pins every query to the acting user and refuses the system actor, so a handler cannot touch another user's rows.
3. `userPreference.list` and `userPreference.set` exist on every surface (ADR 0003). `set` is audited and needs approval from the AI actor.
4. Permission `self:read|write` is a pseudo-feature granted to every caller with an execute context, never to API keys. Ownership is enforced by the data layer, not by roles (ADR 0050).

## Rejected
- Storing preferences in browser storage: does not follow the user across devices.
- Organization-scoped rows: a preference should follow the user across organizations.

## Consequences
- Preferences need an active organization on the session. A superadmin with none gets `{}` and cannot save.
- Organization admins reading the audit log see preference changes made there. No business data belongs in a preference.
- A new user-scoped table needs a `userId` column and a `USER_SCOPED_MODELS` entry, checked by a test.
- Each UI validates what it reads back and falls back to its default.
