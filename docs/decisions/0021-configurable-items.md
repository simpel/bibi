# 0021 – Configurable domain

- **Date:** 2026-10-14
- **Status:** Accepted
- **Supersedes:** 0011
- **Related:** 0026 (implementation choices), 0059 (capabilities, amends)
- **Spec:** `docs/specs/configurable-domain.md`

## Context
- Venues differ. A conference estate has kitchens, allergens and room setups. A boat company has boats, tours and accessibility needs, and for a museum food may be irrelevant.
- If the system assumes concepts such as "dish", "allergen" or "kitchen order", it takes two seconds before a customer wants something similar but different.

## Decision
- **The code contains no domain words.** Each organization sets up its own types, fields, vocabularies, requirements, sheets and setups once, as data. The code provides only generic behaviour: a few capabilities on item types (priced, bundle, customisations, bookable, setups), matching of requirements against tags, and inherited tags for bundles.
- **New organizations start empty.** Templates (the EU's 14 allergens, a starter configuration) are optional data created through ordinary operations. Rejected: preinstalled domain concepts such as the global `Allergen` table (ADR 0011).
- **A capability cannot be turned off while data exists for it** (`CONFLICT`): data loss is never silent.
- **There is no personal data about guests.** Requirements are counts against a list value, never linked to a person.
- **The assistant can suggest a configuration**; the user approves as usual (ADR 0007).

## Consequences
- `Room` became an `Item` of a bookable type with setups; `room.*` was replaced by `item.*`. Participants were dropped from the MVP, since self-registration with allergies per person is no longer a differentiator.
- Operations are generic. GraphQL and REST expose `fields: JSON` plus definitions; the MCP tools describe the organization's fields dynamically. Each capability and field kind has its own Zod schema and `@bibi/ui` component.
- Reports build on capabilities and phases, never on type names.

## Addendum 2026-10-20 – capabilities and resources
- The behaviours are renamed to capabilities (`COMPOSABLE` → `BUNDLE`, `CHOICES` → `CUSTOMISATIONS`), bundles will expand into linked lines, and items can demand pooled equipment and staff (ADR 0059).
