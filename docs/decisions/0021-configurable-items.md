# 0021 – Configurable domain

- **Date:** 2026-10-14
- **Status:** Accepted
- **Supersedes:** 0011
- **Related:** 0026 (implementation choices), 0059 (capabilities, amends)
- **Spec:** `docs/specs/configurable-domain.md`

## Context
- Venues differ: a conference estate has kitchens and room setups, a boat company has boats and tours, a museum may have no food at all.
- If the code assumes "dish", "allergen" or "kitchen order", the first customer who wants something similar but different breaks it.

## Decision
1. The code contains no domain words. Each organization defines its own types, fields, lists, requirements, sheets and setups as data. The code provides only generic capabilities on item types (priced, bundle, customisations, bookable, setups; ADR 0059), matching of requirements against tags, and inherited tags for bundles.
2. New organizations start empty. Templates (for example the EU's 14 allergens) are optional data created through ordinary operations.
3. A capability cannot be turned off while data exists for it (`CONFLICT`). Data loss is never silent.
4. No personal data about guests. Requirements are counts against a list value, never linked to a person.
5. The assistant may suggest a configuration; the user approves as usual (ADR 0007).

## Rejected
- Preinstalled domain concepts such as a global `Allergen` table (ADR 0011): it hard-codes one venue type.
- Per-guest requirements and participant registration: personal data, and no longer a differentiator.

## Consequences
- `Room` became an `Item` of a bookable type; operations are generic.
- GraphQL and REST expose `fields: JSON` plus definitions, and MCP tools describe the organization's fields dynamically.
- Reports build on capabilities and statuses, never on type names.
