---
name: parity-check
description: Debug a red parity test or verify 1:1 parity between web, GraphQL, REST and MCP. Use when `pnpm test` fails in parity or after an operation has been added.
---

# Parity check

1. Run `pnpm --filter @okazi/mcp test -- parity` (test files: `apps/mcp/test/parity.test.ts`, `parity-graphql.ts`, `parity-rest.ts`, `parity-entities.ts`) and `pnpm --filter @okazi/web test -- web-surfaces`, `pnpm --filter @okazi/api test -- parity`, `pnpm --filter @okazi/ai test -- ui-contract`.
2. Map the failure to the missing surface:
   - Missing in REST: `packages/api/src/features/<entity>/rest.ts`.
   - Missing in GraphQL: `packages/graphql/src/features/<entity>/graphql.ts` (`markExposed` is called by `*FromOperation`).
   - Missing in MCP: `apps/mcp/src/features/<entity>/mcp.ts`.
   - Missing in web: a line in `apps/web/src/features/web-surfaces.ts`, or `UI_EXEMPT` with a reason.
   - Missing generative UI: a line in `packages/ai/src/ui-contract/tool-ui-registry.ts`, or `GENERIC_UI_TOOLS`.
3. Fix it by adding the surface. Never remove an operation or add exemptions just to get green.
4. Run `pnpm check:structure` (requires `graphql.ts`, `rest.ts`, `mcp.ts` per core entity) and `pnpm test` again.
