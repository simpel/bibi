# 0011 – Allergy and dietary preference as separate entities

- **Date:** 2026-10-14
- **Status:** Superseded by 0021

## Context
`Kostavvikelse` (dietary deviation) mixed allergies (safety-critical, tied to the EU's 14 allergens) with dietary choices (vegetarian, halal and others). That gave a polymorphic entity with a nullable `allergen` that applied to only one type.

## Decision
- `Kostavvikelse` is replaced by `Allergi` (`Allergy`) and `Kostpreferens` (`DietaryPreference`).
- `Allergi`: required FK to `Allergen`, severity (intolerance / allergy / anaphylaxis), note. Matched against `Artikel.allergener` (item allergens); a clash is a blocker.
- `Kostpreferens`: enum (vegetarian / vegan / halal / kosher / other) and free text for other. Matched against the item's diet labeling.
- `Allergen` is global, read-only reference data (seeded), not per organization. An exception to the `organizationId` rule in ADR 0004 and 0006. `ikon` (icon) belongs to the UI, not the domain.
- Both entities are scoped on `organizationId` and get their own feature folders with full parity (ADR 0003).
- The kitchen order compiles both, in separate sections: allergies first (per allergen and per name), then dietary preferences (count and names).

## Consequences
- No nullable discriminators or check constraints. Zod schemas become simple.
- Two matching paths against `Artikel` (item) that can evolve independently.
- More tables and feature folders, but each is small and clear.
