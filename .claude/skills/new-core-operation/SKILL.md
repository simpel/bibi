---
name: new-core-operation
description: Add or change a core operation (query/command) and expose it on all surfaces. Use for a new capability on an existing entity, e.g. a new command.
---

# New core operation

Template: `packages/core/src/features/setup/operations.ts` (simple) or `features/item/` (split into read/write/lifecycle).

1. **Schema** in `features/<entity>/schema.ts`: Zod for input and output. Make the input one object, no positional arguments.
2. **Operation** with `defineOperation({ name, kind, description, input, output, permission, handler })`.
   - **Feature scope (ADR 0050):** `permission` names the feature that owns the entity (`ENTITY_FEATURE`). The output holds only that feature's data; another feature's record is an id. An input id of another feature is checked with `checkReadable(<feature>:view)` before it is read, and error messages never describe it. Copying another feature's data (a snapshot) needs its `view` at copy time. Audit images are DTOs, not raw rows. If the output seems to need another feature's data, the scope is wrong: stop and fix the scope.
   - `name`: `<entity>.<verb>` (e.g. `item.archive`).
   - `permission`: `<feature>:<action>` (ADR 0050; a new feature goes into `FEATURE_SPECS` in core).
   - `kind: "command"` requires approval by default (AI proposes, human confirms). Set `approval` only if an exception is justified.
   - The handler uses `context.db` (org-scoped), never writes `organizationId` itself in `where`, sets `organizationId` and `createdBy` on create, and calls `context.recordChange({ entityId, before?, after })` for audit.
   - Errors: `err({ error: new AppError({ code, message }) })`. Never `throw`.
   - If it changes searchable fields: set `embeddable`.
3. Add the operation to the entity's list and to `core-operations.ts`. Call it through `execute`, never `handler` directly.
4. **Adapters in the same change:** `rest.ts` (`restRoute`), `graphql.ts` (`*FromOperation`), `mcp.ts`, `apps/web/src/features/web-surfaces.ts` (or `UI_EXEMPT` in `ui-exempt.ts` with a reason) and `tool-ui-registry.ts`.
5. Tests against a real Postgres in `packages/core`, plus an isolation step in `apps/mcp/test/isolation-<area>.test.ts` (organization B calls the tool with A's ids, gets `NOT_FOUND`; `isolation-coverage.test.ts` enforces it). Check every referenced id for organization and read permission. Run `pnpm test`.
6. Run the remaining gates in skill `new-feature` (lifecycle, concurrency, approval label).

Should the state be changeable by AI? See `docs/decisions/0007-ai-first-ux.md`.
