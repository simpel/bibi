---
name: new-core-operation
description: Add or change a core operation (query/command) and expose it on all surfaces. Use for a new capability on an existing entity, e.g. a new command.
---

# New core operation

Template: `packages/core/src/features/setup/operations.ts` (simple) or `features/item/` (split into read/write/lifecycle).

1. **Schema** in `features/<entity>/schema.ts`: Zod for input and output. Make the input one object, no positional arguments.
2. **Operation** with `defineOperation({ name, kind, description, input, output, permission, handler })`.
   - `name`: `<entity>.<verb>` (e.g. `item.archive`).
   - `permission`: `<resource>:read|write|admin`.
   - `kind: "command"` requires approval by default (AI proposes, human confirms). Set `approval` only if an exception is justified.
   - The handler uses `context.db` (org-scoped), never writes `organizationId` itself in `where`, sets `organizationId` and `createdBy` on create, and calls `context.recordChange({ entityId, before?, after })` for audit.
   - Errors: `err({ error: new AppError({ code, message }) })`. Never `throw`.
   - If it changes searchable fields: set `embeddable`.
3. Add the operation to the entity's list and to `core-operations.ts`. Call it through `execute`, never `handler` directly.
4. **Adapters in the same change:** `rest.ts` (`restRoute`), `graphql.ts` (`*FromOperation`), `mcp.ts`, `apps/web/src/features/web-surfaces.ts` (or `UI_EXEMPT` in `ui-exempt.ts` with a reason) and `tool-ui-registry.ts`.
5. Tests against a real Postgres in `packages/core`. Run `pnpm test`.

Should the state be changeable by AI? See `docs/decisions/0007-ai-first-ux.md`.
