# 0026 – Configurable domain: implementation choices

- **Date:** 2026-10-14
- **Status:** Accepted
- **Builds on:** 0021, 0025 (part 2)

## Context
- ADR 0021 decides that types, fields, vocabularies and setups are data, and that the code owns only behaviors.
- Part 2 of ADR 0025 builds this and replaces `Room` with `Item`. During the work some questions came up that 0021 does not answer.

## Decision

### Field values
- Values are stored as JSON on the row (`Item.fields`) under the field's **key** (`key`).
  - The key is generated from the name ("Area m²" → `area_m2`) or given when the field is created.
  - The key never changes and is unique per type, including among archived fields.
  - A rename therefore moves no values, and REST, GraphQL and AI see readable keys.
- `buildFieldsSchema({ specs })` (core, client-safe) builds a strict Zod schema from the type's fields. The web app validates with the same schema as the server.
- A choice from a vocabulary is stored as the vocabulary value's ID, so a rename of the value breaks nothing.
- `item.update` merges `fields` per key, and `null` removes a value.
- The field type "link to another type" is built when customers and bookings exist.

### Choice and multi-choice
- A choice or multi-choice field has **either** a vocabulary (`vocabularyId`) **or** its own options (`options`), never both.
- Own options suit one-off fields such as "Serving style".
- Only values from vocabularies count as tags in matching (part 6). Tags are not rows of their own, but the values in fields that choose from a vocabulary.

### "Data exists → CONFLICT"
The principle in 0021 applies to anything that would make existing values invalid:
- turning off a behavior that an active item has data for
- changing field type or vocabulary
- removing an option that is in use
- making a field required when items lack a value
- archiving a field that has values, a vocabulary value that an item carries, a vocabulary that a field uses, a setup with capacity or a type with active items

The check is computed in memory per type. The catalogs have hundreds of rows, so that is enough for now.

### Behaviors in columns
- Behavior data lives in ordinary columns on `Item`, and the columns have values only if the type has the behavior (otherwise `VALIDATION`):
  - `PRICED`: `priceMinor` (minor units), `priceUnit` and `vatRatePercent`
  - `BOOKABLE`: `defaultDurationMinutes`
  - `SETUPS`: `ItemSetup` rows
- Capacities are replaced as a set through `item.create` and `item.update` (`setups`).
- `COMPOSABLE` and `CHOICES` can be turned on already, but parts and choice groups come in part 3.

### Permissions
- Two new resources:
  - `item` replaces `room`.
  - `configuration` covers types, fields, vocabularies and setups.
- In the "Conference estate" template, Admin has `admin` on both and the other roles have `read`. UI and AI must read the configuration to understand the items.

### MCP
- `item_list`, `item_get`, `item_create` and `item_update` get a per-call description with the organization's types, fields and allowed values.
- The description is read through `entityType.list` as the caller. Without `configuration:read` the static description is used.

## Consequences
- `room.*`, the `Room` table and the `room` resource are gone. No data migration is needed, because there is no production data.
- A behavior can only be turned off after the data has been removed. This is intentional, preferred over silent data loss.
- Whoever wants to change a field type creates a new field, moves the values and archives the old one.
- Requirement types are linked to vocabularies in part 5 (`requirement.*`).
