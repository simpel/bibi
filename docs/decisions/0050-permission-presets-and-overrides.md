# 0050 – Permission presets and per-user overrides

- **Date:** 2026-10-19
- **Status:** Accepted
- **Related:** 0034 (fixed access roles, superseded in part), 0048 (access levels, superseded), 0005 (API keys, amended), 0015 (superadmin), 0003 (parity), 0007 (AI-first UX)

## Context
- ADR 0034 and 0048 gave each member one fixed role (`member`, `manager`, `admin`) and nothing else. Real venues need finer control: one member may also edit items, one manager must not see payments.
- Permissions were per resource with `read < write < admin`, which does not match how staff think about the app ("can Tina handle quotes?") and cannot hide a part of the app.
- API keys were tied to the user who created them and capped by that user's role, so a key died when that person left.

## Decision

### Features and actions
- A permission is `<feature>:<action>`. Features are the parts of the app staff recognise, defined once as data in `packages/core/src/permissions/features.ts`:

| Group | Features |
|---|---|
| Bookings | `ticket` (incl. holds, occupancy, assignments, ticket email), `program` (program items, their line states and needs) |
| Selling and money | `customer` (incl. contacts), `quote`, `payment`, `sheet` |
| Catalog | `item`, `venue`, `priceList` |
| Setup | `configuration` (types, fields, lists, setups), `pipeline` (phases, item states, phase grid), `template` (ticket templates, sheet definitions), `responsibility` |
| Organization | `member`, `apiKey`, `paymentAccount`, `audit`, `assistant` (organization skills, everyone's conversations) |

- Actions: `read`, `write` and `delete` (amended 2026-10-20). `write` covers creating, changing, sending (quotes, sheets), exporting and moving a ticket to another phase; managing the phases themselves is the separate `pipeline` feature. `delete` is the archive action (Okazi never hard-deletes). `write` and `delete` imply `read`. Payments, sheets, the payment account and the assistant have no `delete`; the audit log is `read` only.
- Always on, with no permission: the caller's own conversations, personal skills, preferences, settings and connected apps (`self`), and search (it only returns what the caller may view).

### Presets
- `member`, `manager` and `admin` (ADR 0034) become presets: constant permission sets in code, not configurable per organization.
  - `member`: `read` on every feature except `audit`, `assistant` and `apiKey`.
  - `manager`: member + every action on Bookings and Selling.
  - `admin`: every action on every feature.
- Every member and every API key has exactly one preset.

### Overrides
- An admin fine-tunes one member or API key with overrides: `allow` or `deny` per `feature:action`, stored in `PermissionOverride` (org-scoped, unique per subject + permission).
- Effective permissions = preset, plus `allow`, minus `deny`. Only the differences are stored, so a change to a preset reaches everyone on it.
- Admin-only lock: every action except `read` on `member`, `apiKey` and `paymentAccount` comes only from the `admin` preset. Overrides on them are refused (VALIDATION), and stale rows are ignored.
- `read` can be denied on any feature except shared vocabulary, so not everyone sees everything. Pages, navigation, tools and the assistant follow the effective permissions.
- Only callers with `member:write` (admins) read or change overrides. Changes are audited.

### Feature scope (no cross-feature data)
Denying `read` on a feature must hide its data everywhere, not only its own pages. If one feature shows another feature's data, the scope is wrong; fix the scope instead of adding checks around it.

- **One feature per output.** An operation returns only data owned by the feature of its `permission`. Ownership is `ENTITY_FEATURE` in `packages/core/src/permissions/entity-features.ts`. Another feature's record appears only as its id.
- **Resolve through the owner.** A surface that needs another feature's data (a page, a GraphQL edge, a card) calls that feature's own operation. If that returns FORBIDDEN, the surface shows the piece as hidden and keeps working; it never fails the whole page.
- **Inputs are checked too.** An operation that takes another feature's id calls `checkReadable({ permission: "<feature>:read" })` before reading it. Neither the output nor an error message may reveal anything about a record the caller cannot view (no id-to-name oracle).
- **Snapshots need read at copy time.** Copying another feature's data into this one (quote lines from items, sheet rows from the program) requires `read` on the source when the copy is made. After that the copy belongs to the copying feature.
- **Derived views follow the owner.** Audit entries are shown only when the caller may view the entity's feature, and audit images are DTOs, never raw rows. Search text holds only the entity's own fields. Approval previews name only records the caller may view.
- **Shared vocabulary is always visible.** `configuration`, `pipeline`, `template`, `responsibility` and `member` (`ALWAYS_VISIBLE_FEATURES`): type, phase and list names and colleagues' names are labels on every screen, so `read` on them cannot be denied. Changing them stays permissioned.
- **Bundles are declared, not implied.** A feature that owns several entity kinds (`ticket` owns occupancy, assignments and ticket email; `program` owns program items, line states and needs) says so in `ENTITY_FEATURE`. Nothing else crosses.
- **Known limit.** Chat history stores tool results as they were; denying a permission later does not rewrite old conversations.
- **Guard.** A core test fails when an operation's output schema has a field named after another feature's entity (`customerName`, `itemPriceMinor`, ...) or when an audited entity type has no owner in `ENTITY_FEATURE`.

### API keys
- An API key belongs to the organization, not to a user. It has its own preset and overrides, edited like a member's. It keeps working when its creator leaves; removing a member no longer revokes keys.
- Only admins create, change and revoke keys (`apiKey:*`, locked). A key never creates keys; the AI actor never does (ADR 0005).
- The audit actor of a request made with a key is the key (`actor.type = "apiKey"`, `apiKeyId`); the creating admin is recorded on the key.
- Existing keys are dropped (no production users).

### Superadmin
- Unchanged (ADR 0015): a platform role, outside presets and overrides.

### UI
- `/settings/members/<id>/permissions` and `/settings/api-keys/<id>/permissions`: a page per subject with the preset and a grid of features × actions. Each cell shows the preset value and whether it is overridden, and can be reset to the preset.

## Consequences
- Every core operation's `permission` is remapped from `resource:read|write|admin` to `feature:action`; the parity test and `RESOURCES` become `FEATURES`.
- `packages/auth` resolves preset + overrides on every request (one extra indexed query); role changes and overrides apply at once.
- The assistant's tool list and Access section (ADR 0048) are built from effective permissions instead of the role.
- ADR 0048's access levels are replaced by the presets above; ADR 0034's roles stay as preset names.
