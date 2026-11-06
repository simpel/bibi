# 0011 – Allergy and dietary preference as separate entities

- **Date:** 2026-10-14
- **Status:** Superseded by 0021

The single dietary-deviation entity mixed safety-critical allergies with dietary choices. This ADR split it into an allergy entity (tied to the EU's 14 allergens, a clash is a blocker) and a dietary preference entity, with `Allergen` as global reference data. Both were replaced by organization-defined lists and needs as counts (ADR 0021), so no personal data per guest is stored.
