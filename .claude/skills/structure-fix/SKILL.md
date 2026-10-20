---
name: structure-fix
description: Fix violations of `pnpm check:structure` (150 lines/file, 40 lines/function, named exports, barrel files, one object as parameter, feature files). Use when the structure check or CI fails.
---

# Structure fixes

Rules: root `CLAUDE.md`, "Code rules" (language: `docs/decisions/0009-language-in-code-and-ui.md`). Check: `tools/check-structure.mjs` and `tools/lib/`.

1. Run `pnpm check:structure` and read the output per file.
2. Fix per rule:
   - **File > 150 lines:** split by idea (one idea per file), e.g. schema, form hook, table, dialog as separate files. See `apps/web/src/features/role/` as a pattern.
   - **Function > 40 lines:** extract helper functions in the same or a new file. Extract shared code at the second duplicate.
   - **Default export:** change to named. Allowed only for Next `page`/`layout`/`route`, `*.config.ts` and `*.stories.tsx`.
   - **Barrel file:** remove it. Only `packages/*/src/index.ts` is allowed.
   - **Positional parameters:** one typed object, `fn({ a, b }: FnInput)`. Exception: `cn(...inputs)`.
   - **Missing feature file:** create `schema.ts`, `operations.ts`, `graphql.ts`, `rest.ts` or `mcp.ts` (see skill `new-entity`).
3. Run `pnpm lint` (Biome) and `pnpm typecheck`. Do not change the rules in `tools/` to get green.
