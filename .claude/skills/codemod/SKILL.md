---
name: codemod
description: Do a mechanical change across many files (a rename, a move) with scripts in layers and a residue check, instead of editing files by hand. Use for tickets of Kind Codemod and for any rename of a domain term.
---

# Codemod

A text replace is wrong for code symbols: it hits strings, comments and unrelated scopes. Work in layers.

1. **Inventory first.** The ticket's `### Renames` table lists the old names (first column, in backticks) and the new ones. Add what it misses: identifiers, Prisma models and columns, enum values, file and directory names, strings (i18n keys, GraphQL and REST field names, MCP tool names, values stored as text), SQL under `packages/db/sql`, docs. Count matches per old name.
2. **Work in a scratch directory outside the git tree** (`bibi-worktrees/.scratch/t-<N>`), so scripts are never committed.
3. **Layer 1, database:** edit `schema.prisma`, run `pnpm db:generate`, write the migration (an in-place rename; no data migration while there are no production users). Never edit an applied migration.
4. **Layer 2, TypeScript symbols through the compiler:** install `ts-morph` in the scratch directory (it brings its own TypeScript) and rename each symbol with the language service (`identifier.rename()`), and move files with `sourceFile.move()` so imports follow. This handles shadowing, shorthand properties, imports and exports. Give the script a dry run that prints what changes per file, check it, then run it. Properties that come from the regenerated Prisma client follow the schema.
5. **Layer 3, text:** for strings and non-TypeScript files (i18n JSON, SQL functions, Markdown skills, docs, templates) use a script with word boundaries and every case variant (camelCase, PascalCase, UPPER_SNAKE, kebab-case, i18n keys). Rename the more specific names first. Rename directories and the remaining files with plain `mv`.
6. **Let the compiler find the rest:** run `pnpm typecheck`, fix what it lists, repeat.
7. **By hand, only what scripts cannot do:** SQL functions and triggers (and the test that applies them verbatim), name collisions, and the wording of user-facing strings in sv and en.
8. **Residue check:** search every old name, case-insensitively. Only applied migrations, ADR history, `node_modules` and generated code may still match. The run's `residue.sh` does this check and sends the ticket back while matches are left. Put the final counts in `notes`.
9. The commit and PR title is `refactor: <summary>` (ADR 0060).
