# Configurable domain: types, fields, lists and capabilities

Current behaviour, checked against the code. Why: ADR 0021, 0026. Direction (partly built): ADR 0059 and `docs/plans/type-capabilities-and-resources.md`.

## What the organization configures (data)
- **Types** (`EntityType`) for the base entities in `ENTITY_BASES` (`ITEM`, `CUSTOMER`, `CONTACT`, `ORDER`, `REQUIREMENT`, `LINE`). Examples: Conference room, Dish or Package for items, Company for customers, Conference for orders.
- **Item type groups** (`ItemTypeGroup`, ADR 0101): headings the item types are browsed under. See "Item type groups" below.
- **Fields** (`FieldDefinition`) per type. Kinds (`FIELD_KINDS`): `TEXT`, `NUMBER`, `BOOLEAN`, `DATE`, `CHOICE`, `MULTI_CHOICE`, `LINK`.
- **Vocabularies** (`Vocabulary` + `VocabularyValue`): the organization's own lists ("Allergens", "Diet", "Accessibility"). Choice fields and requirements point to one.
- **Requirements** (`Requirement`): a count on an order against a vocabulary value (Gluten × 3). It applies to the whole order or to one line, and a row on a line replaces the order's count there. Requirement is also a type with its own fields. Requirements never link to a person: there is no personal data about guests.
- **Run sheets**: the organization defines the run sheet (`RunSheetDefinition`: which item types and fields, which vocabularies' requirements, which responsibility it goes to) and each order gets versioned run sheets (`RunSheet`, changes marked ★).
- **Layouts** (`SetupLayout`, per room, not an organization list): each room has its own layouts (Cinema, U-table, Mingle) with capacity and setup and teardown minutes (ADR 0103, `docs/specs/floor-plans-and-layouts.md`). The shared `Setup` list is retired.
- Order statuses, line states and the grid are configured the same way (`docs/specs/orders-statuses-and-states.md`). Access is fixed presets (`docs/specs/permissions.md`).
- New organizations start empty. Templates (`templates/vocabularies/eu-14-allergens`, `templates/configuration/conference-venue`) are ordinary data created through ordinary operations; they can be changed freely and imports are idempotent. The assistant can suggest a configuration and the user approves.

## Field values
- Values are JSON on the row (`Item.fields`) under the field's `key`, generated from the name ("Area m²" → `area_m2`) or given at creation. The key never changes and is unique per type, including archived fields, so a rename moves no values.
- `buildFieldsSchema({ specs })` (core, client-safe) builds a strict Zod schema from the type's fields; the web app and the server validate with the same one.
- A vocabulary choice is stored as the value's id, so renaming a value breaks nothing. A choice field has either a vocabulary (`vocabularyId`) or its own `options`, never both. Only vocabulary values count as tags in matching.
- `LINK` names a target type (`linkTypeId`, an item, customer, contact or order type) and stores one record id; the server checks it is an active record of that type in the same organization.
- `item.update` merges `fields` per key; `null` removes a value.

## Capabilities (`ITEM_CAPABILITIES`)
| Capability | The system does |
|---|---|
| `PRICED` | Price, price unit (`PER_PERSON`, `PER_UNIT`, `PER_HOUR`, `FLAT`), VAT; columns `priceMinor`, `priceUnit`, `vatRatePercent` |
| `BUNDLE` | Contains other items (`ItemPart`) with counts, `offsetMinutes` and `durationMinutes` |
| `CUSTOMISATIONS` | Customisation groups among the parts (`minPick`, `maxPick`). Still requires `BUNDLE` (ADR 0059 drops that; not built yet) |
| `BOOKABLE` | Occupies time with conflict protection; `defaultDurationMinutes` |
| `SETUPS` | The room's layouts (capacity, setup and teardown minutes, drawing) and its people limit `maxPeople`; UI: Layouts. Requires `BOOKABLE` |

- Capability data lives in ordinary columns on `Item` and has values only if the type has the capability (otherwise `VALIDATION`). Layouts are not part of an item save: they have their own `layout.*` operations, and `maxPeople` is a column on the item, a hard limit (ADR 0103).
- The part graph is acyclic; core rejects cycles and more than 5 levels. In a bundle the bundle's price is charged and its VAT is distributed over the part lines in proportion to their effective price × quantity, with largest-remainder rounding, one VAT row per rate (ADR 0059).
- `customerId = null` is a catalog item; set means a customer-specific bundle (`item.saveAsBundle` creates one from a quote).
- Adding an item to an order expands it into lines, occupancy and order lines that copy name, price, VAT and tags (snapshot). `line.expandBundle` adds a bundle as one bundle line that carries the price plus part lines linked by `Line.parentLineId`, which show their own prices but do not count in the totals (ADR 0059); customisation options are not expanded yet.

## Item type groups
- A group (`name`, `position`, `status`) only organizes item types for browsing; it carries no behaviour. `EntityType.groupId` is a nullable foreign key on item types (`null` = ungrouped).
- `/items` shows one tab per active group in `position` order, plus "Other" for ungrouped types when any exist. With no groups the page is one list. The `?type=` filter works within a tab.
- Groups are edited in Settings → Types → Groups: create, rename, reorder, archive and move a type. Archiving a group moves its types to ungrouped.
- The welcome flow creates the groups (one per step with chosen types) and the demo seed creates Spaces, Food & drink and Extras. Existing organizations get none.
- Operations `itemTypeGroup.*` under `configuration:read|write|delete`; `entityType.create|update` take `groupId` and `item.list` takes `groupId` (`null` = ungrouped).

## Matching and tags
- A requirement is compared with the items on the order tagged with the same vocabulary value. A hit on a mandatory part without an alternative is flagged and blocks the run sheet.
- A bundle inherits its parts' vocabulary values: mandatory parts give "contains", optional parts "may contain" per alternative. `item.resolve` is the only place this is computed.

## "Data exists → CONFLICT"
Anything that would make existing values invalid is refused: turning off a capability an active item has data for; changing a field's kind or vocabulary; removing an option in use; making a field required when items lack a value; changing a `LINK` target while records have a value; archiving a record a `LINK` points to, a field with values, a vocabulary value an item carries, a vocabulary a field uses, or a type with active items. It is computed in memory per type (catalogs have hundreds of rows). To change a field's kind: create a new field, move the values, archive the old one.

## Surfaces
- Operations are generic (`item.*`, `entityType.*`, `fieldDefinition.*`, `vocabulary.*`, `requirement.*`, `runSheet.*`, `layout.*`). GraphQL and REST expose fields as `fields: JSON` plus the definitions.
- The MCP tools `item_list|get|create|update` describe the organization's types, fields and allowed values per call (read through `entityType.list` as the caller; static description without `configuration:read`).
- Each field kind and capability has its own Zod schema and its own component in `@bibi/ui`. Reports build on capabilities and status flags, never on type names.
- Permissions: `item:*` for items and their layouts, `configuration:*` for types, fields and vocabularies.
