# {{Pascal}} – UI

Placeholder skapad av `pnpm gen entity {{Pascal}}`. UI för {{Pascal}} läggs i den här mappen.

- Bygg med `@okazi/ui` (cva och tokens). Inga råa färger och inga egna primitiver i appen.
- All text går via next-intl (sv och en).
- Resultat i assistenten visas med en generative UI-komponent. Registrera resultattypen `{{kebab}}` i `packages/ai` (ADR 0007).
- Lista, detalj och formulär följer befintliga mönster i `apps/web`. Sök efter dem innan nya skapas.
