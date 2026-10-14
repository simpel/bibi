---
name: parity-check
description: Debug a red parity test or verify 1:1 parity between web, GraphQL, REST and MCP. Use when `pnpm test` fails in parity or after an operation has been added.
---

# Parity check

Parity is tested at multiple surfaces; each has its own test:
- **REST, GraphQL, MCP:** `pnpm --filter @okazi/mcp test -- parity` (tests `apps/mcp/test/parity.test.ts`, `parity-graphql.ts`, `parity-rest.ts`, `parity-entities.ts`).
- **Web surfaces:** `pnpm --filter @okazi/web test -- web-surfaces` (tests `apps/web/src/features/web-surfaces.test.ts`, validates `web-surfaces.ts`).
- **REST (double-check):** `pnpm --filter @okazi/api test -- parity`.
- **Generative UI:** `pnpm --filter @okazi/ai test -- ui-contract`.

To fix a failure, map it to the missing surface:
- Missing in REST: add a `restRoute` in `packages/api/src/features/<entity>/rest.ts`.
- Missing in GraphQL: add `fieldFromOperation` or `mutationFromOperation` in `packages/graphql/src/features/<entity>/graphql.ts` (they call `markExposed`).
- Missing in MCP: add `mcpTool({ operation })` in `apps/mcp/src/features/<entity>/mcp.ts` (or `search-mcp.ts`).
- Missing in web: add a line in `apps/web/src/features/web-surfaces.ts` (with `route` and `component`), or add to `UI_EXEMPT` with a reason.
- Missing generative UI: add a line in `packages/ai/src/ui-contract/tool-ui-registry.ts`, or list in `GENERIC_UI_TOOLS`.

Never remove an operation or add exemptions just to get green. Run `pnpm check:structure` and `pnpm test` to verify.
