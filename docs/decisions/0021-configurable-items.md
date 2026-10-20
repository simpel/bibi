# 0021 – Configurable domain

- **Date:** 2026-10-14
- **Status:** Accepted
- **Supersedes:** 0011

## Context
- Venues differ. A conference estate has kitchens, allergens and room setups. A boat company has boats, tours and accessibility needs, and for a museum food may be entirely irrelevant.
- If the system assumes concepts such as "dish", "allergen" or "kitchen order", it takes two seconds before a customer wants something similar but different.
- The system should therefore contain no domain words. Each organization sets up its own library once. The code provides only generic behavior.

## Decision

### The organization configures (data)
- **Types** (`EntityType`): each organization defines types for its base entities, that is item (`Item`), customer, contact and ticket. Examples: Conference room, Dish, Boat and Package for items, Company and Authority for customers, Conference and Event for tickets.
- **Fields** (`FieldDefinition`) per type: text, number, yes/no, date, choice, multi-choice from a vocabulary, or link to another type. Values are stored as JSON on the row and validated by a Zod schema built from the definitions.
- **Vocabularies** (`Vocabulary` + `VocabularyValue`): the organization's own lists, for example "Allergens", "Diet", "Accessibility" or "Dress code". Multi-choice fields and requirements point to a vocabulary.
- **Requirements** (`Requirement`): a count on a ticket against a value in a vocabulary, for example Gluten × 3 or Wheelchair × 2. A requirement can apply to the whole booking or to a program item, and a row on the program item replaces the ticket's count there. Requirement is also a type with its own fields, for example "Severity".
- **Sheets**: the organization defines the sheet (`SheetDefinition`), and each ticket gets versioned sheets (`Sheet`). Examples of sheets are "Kitchen order" and "Bar order". The definition states which item types and fields are included, which vocabularies' requirements are included and which responsibility it goes to. Sheets are versioned with change marking (★).
- **Setups** (`Setup`): the organization's own setups with setup time, for example Cinema, U-table and Mingle.
- Ticket phases, item states and the grid between them are configured the same way (ADR 0043, 0044). Access uses fixed roles (ADR 0034).

### The code provides (fixed behavior without domain words)
Types for `Item` switch on behaviors (the states of an item's lines are `ItemState`, ADR 0044):

| Behavior | The system does |
|---|---|
| `PRICED` | Price, price unit (`PER_PERSON`, `PER_UNIT`, `PER_HOUR`, `FLAT`), VAT and order lines |
| `COMPOSABLE` | Contains other items with counts, `offsetMinutes` and `durationMinutes` |
| `CHOICES` | Choice groups among the parts (`minPick`, `maxPick`). Requires `COMPOSABLE`. |
| `BOOKABLE` | Occupancy in time and conflict protection. Has a default duration. |
| `SETUPS` | Capacity per setup and setup time. Requires `BOOKABLE`. |

- **Matching:** a requirement on a ticket is compared with the items on the ticket that are tagged with the same vocabulary value. A hit on a mandatory part without an alternative is flagged and blocks the sheet. This is the former allergy check in generic form.
- **Inherited tags:** a composed item inherits its parts' vocabulary values. Mandatory parts give "contains", optional parts give "may contain" per alternative. `item.resolve` is the only place where this is computed.
- A behavior cannot be turned off on a type as long as any item of the type has data for it (`CONFLICT`).

### Templates are optional data
- New organizations start empty. Nothing is preinstalled.
- Templates can be imported, for example the vocabulary "EU's 14 allergens" or the starter package "Conference estate". A template is just data created through ordinary operations and can be changed freely afterwards.
- The AI assistant can suggest a configuration ("we are a manor with a restaurant"). The user approves as usual (ADR 0007).

### Composition, price and snapshot
- The graph of `ItemComponent` is acyclic. Core rejects cycles and depth over 5 levels with `VALIDATION`.
- In a package, the package's price is charged. VAT is distributed over the parts in proportion to the parts' list prices.
- `customerId = null` means a catalog item. `customerId` set means a customer-specific package. A quote can also be assembled directly from items, and "Save as package" then creates a customer-specific item.
- When an item is added to a ticket, core expands it into program items, occupancy and order lines. The rows copy name, price, VAT and tags (snapshot).
- Requirements are never linked to a person. There is no personal data about individual guests.

## Consequences
- `Room` is migrated to `Item` of a type with `BOOKABLE` + `SETUPS`. The room's fields (floor, area, ceiling height, daylight) become the organization's own fields. `room.*` is replaced by `item.*` and the parity test is updated in the same change. Venue (`Venue`) remains.
- `Allergen` as global reference data (ADR 0011) goes away. The EU's 14 become an importable vocabulary template.
- Participants are dropped from the MVP. Self-registration with allergies per person is no longer a differentiator.
- The operations are generic (`item.*`, `entityType.*`, `fieldDefinition.*`, `vocabulary.*`, `requirement.*`, `sheet.*`, `setup.*`). GraphQL and REST expose fields as `fields: JSON` plus the definitions. The MCP tools describe the organization's fields dynamically, so the AI sees "Cabins" at the boat company and "Daylight" at the conference estate.
- UI and AI must read the configuration to know what applies. Each behavior and field type therefore gets its own Zod schema and its own component in `@okazi/ui`.
- Reports that should work in all organizations build on behaviors and phases, never on type names.

## Addendum 2026-10-20 – capabilities and resources
- The flat behaviour list becomes capability sections in the UI, `CHOICES` no longer requires `COMPOSABLE`, bundles expand into linked lines, and items can demand pooled equipment and staff (ADR 0059).
- `behaviour` becomes `capability`, `COMPOSABLE` becomes `BUNDLE` and `CHOICES` becomes `CUSTOMISATIONS` end to end, with `ItemComponent` renamed `ItemPart` and `ItemChoiceGroup` renamed `ItemCustomisationGroup` (ADR 0059).
