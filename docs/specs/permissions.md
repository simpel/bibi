# Permissions

Current behaviour. Why: ADR 0050 (presets and overrides), 0034 (fixed roles), 0005 (API keys), 0015 (superadmin). The feature list and each preset's content live in code and are not repeated here: `FEATURE_SPECS` (`packages/core/src/permissions/features.ts`) and `PRESET_PERMISSIONS` (`permissions/presets.ts`).

## Model
- A permission is `<feature>:<action>`. Actions are `read`, `write`, `delete`. `write` covers creating, changing, sending (quotes, sheets), exporting and moving a ticket to another phase; `delete` is the archive action (Okazi never hard-deletes). `write` and `delete` imply `read`. Some features have no `delete`; the audit log is `read` only.
- Always on, with no permission (`self`): the caller's own conversations, personal skills, preferences, settings and connected apps, and search (it only returns what the caller may view).
- Fixed roles `member < manager < admin` are presets: constant permission sets in code, never configurable per organization. Every member and every API key has exactly one preset. The organization creator gets `admin`.
- Overrides (`PermissionOverride`, org-scoped, unique per subject + permission): an admin allows or denies one `feature:action` for one member or API key. Effective permissions = preset, plus `allow`, minus `deny`. Only differences are stored, so a preset change reaches everyone on it. Only callers with `member:write` read or change overrides; changes are audited.
- Admin-only lock (`LOCKED_FEATURES`: `member`, `apiKey`, `paymentAccount`): every action but `read` comes only from the `admin` preset. Overrides on them are refused (`VALIDATION`) and stale rows are ignored.
- `read` can be denied on any feature except the shared vocabulary (`ALWAYS_VISIBLE_FEATURES`: `configuration`, `pipeline`, `template`, `responsibility`, `member`), because type, phase and list names and colleagues' names are labels on every screen. Pages, navigation, tools and the assistant follow the effective permissions.
- Roles are resolved live from `member` on every request (one extra indexed query), so role changes and overrides apply at once. `packages/auth` resolves; core owns the model.
- Anti-escalation: nobody gives a role above their own or changes or removes a member above them; invitations and API keys can carry any fixed role up to the caller's own. The organization always keeps one admin (`checkAdminKept`, `CONFLICT`).
- The platform role `superadmin` is separate (ADR 0015), outside presets and overrides, and grants nothing inside an organization by itself.

## API keys
- A key belongs to the organization, not to a user. It has its own preset and overrides. It keeps working when its creator leaves; removing a member does not revoke keys.
- Only admins create, change and revoke keys (`apiKey:*`, locked). A key never creates keys; the AI actor never does.
- The audit actor for a request made with a key is the key (`actor.type = "apiKey"`, `apiKeyId`); the creating admin is recorded on the key. Keys cannot run `self:*` operations.

## Feature scope: no cross-feature data
Denying `read` on a feature must hide its data everywhere, not only its own pages. If one feature shows another feature's data, fix the scope instead of adding checks around it.
- **One feature per output.** An operation returns only data owned by the feature of its `permission` (owner map `ENTITY_FEATURE`, `permissions/entity-features.ts`). Another feature's record appears only as its id.
- **Resolve through the owner.** A surface that needs another feature's data calls that feature's own operation. If it returns `FORBIDDEN`, the surface shows the piece as hidden and keeps working; it never fails the whole page.
- **Inputs are checked too.** An operation that takes another feature's id calls `checkReadable({ permission: "<feature>:read" })` first. Neither output nor error message may reveal a record the caller cannot view (no id-to-name oracle).
- **Snapshots need `read` at copy time.** Copying another feature's data (quote lines from items, sheet rows from the program, invoice from lines via `checkLinesReadable`) requires `read` on the source when the copy is made. After that the copy belongs to the copying feature. A DRAFT quote shows the ticket's lines live only to a caller with `program:read`.
- **Derived views follow the owner.** Audit entries show only when the caller may view the entity's feature, and audit images are DTOs. Search text holds only the entity's own fields. Approval previews name only records the caller may view.
- **Record-wide refusals** (`usageConflict`) name only blocking records whose feature the caller may read (`BASE_FEATURE`); otherwise the message is "It is still in use" with neither names nor a count.
- **Bundles are declared.** A feature that owns several entity kinds says so in `ENTITY_FEATURE` (e.g. `ticket` owns occupancy, assignments, ticket email and phase history; `program` owns lines, alternative groups, requirements and line states; `payment` owns deposits, invoices and balance). Nothing else crosses.
- **Known limit.** Chat history stores tool results as they were; denying a permission later does not rewrite old conversations.
- **Guard.** A core test fails when an operation's output schema has a field named after another feature's entity (`customerName`, `itemPriceMinor`, ...) or when an audited entity type has no owner in `ENTITY_FEATURE`.

## UI
- `/settings/members/<id>/permissions` and `/settings/api-keys/<id>/permissions`: a page per subject with the preset and a grid of features × actions. Each cell shows the preset value and whether it is overridden, and can be reset to the preset.

## Adding a permission
See `packages/auth/CLAUDE.md`.
