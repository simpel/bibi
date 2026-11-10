# 0101 – Item type groups

- **Date:** 2026-11-10
- **Status:** Accepted
- **Related:** 0021, 0051, 0056, 0059, 0061
- **Spec:** `docs/specs/welcome.md`, `docs/specs/configurable-domain.md`

## Context
- The welcome flow sorts the preset's item types into three steps (spaces, food, extras), but that grouping exists only in preset data (`SetupPresetType.category`). Activate creates plain item types and the grouping is lost.
- `/items` therefore shows every item of every type in one list. A venue with 15 types sees rooms, lunches and projectors mixed together.
- Capabilities cannot stand in for the grouping: `BOOKABLE` marks spaces, but food, activities and tours are all just "not bookable", and equipment can be bookable too.

## Decision
1. `ItemTypeGroup` (owned, org-scoped): `name`, `position`, `status`. It groups item types for navigation only and carries no behaviour.
2. `EntityType.groupId` is a nullable foreign key, valid only on the item base. `null` means ungrouped. No ids in JSON and no copies on items: an item's group is read through its type.
3. The welcome flow creates one group per step that has at least one chosen type (names are i18n keys `welcome.groups.*`, created in the activating member's language) and puts each type in its step's group. "Start empty" and "Skip for now" create no groups.
4. `/items` shows one tab per active group in `position` order, plus "Other" when ungrouped types exist. With no groups the page stays one list. The existing `?type=` filter works within a tab.
5. Groups are edited in Settings → Types (create, rename, reorder, archive, move a type). Archiving a group moves its types to ungrouped. Operations `itemTypeGroup.*` exist on every surface under `configuration:read|write`.
6. The demo seed and existing organizations: a migration creates no groups. The demo seed creates them the way the welcome flow does.

## Rejected
- A fixed enum (`SPACES | FOOD | EXTRAS`) on the type: puts domain words in code and fits a museum or arena poorly (ADR 0021).
- Deriving the group from capabilities and `resourceKind`: activities and tours land under food, and the organization cannot correct it.
- Free-text tags on types: no order, no single home per type, and filtering by string breaks ADR 0056.

## Consequences
- One new table, one nullable column, one migration, and a new operation family on four surfaces (parity test).
- Group names are the organization's own words, so lists and the assistant can say "Spaces" or "Lokaler" without code knowing either.
- Boards, run sheets and reports keep using types and capabilities. Groups are only a way to browse.
