# 0003 – Parity architecture

- **Date:** 2026-10-13
- **Status:** Accepted

## Context
Okazi must be usable through the web UI, GraphQL, REST and MCP. Without a common source, rules for permissions, validation and audit would diverge between surfaces. This matters most when the AI assistant must be able to perform the same actions as the user.

## Decision
- Core operations in `packages/core` are the single source of truth. Each operation has a Zod schema for input and output, a permission check and a handler. Operations are defined with `defineOperation`.
- Every command exists on all surfaces: web, GraphQL, REST and MCP.
- Reads via GraphQL. The schema is generated from the entities and gives full graph access in the org-scoped context.
- REST under `/api/v1` with OpenAPI, derived from the same operations. `POST /api/graphql` is also available.
- MCP in `apps/mcp` exposes two kinds of tools:
  - curated tools, one per command and per common read, with good descriptions and Zod schemas.
  - generic `graphql_schema` and `graphql_query` for free-form reads. Read only, with depth and cost limits.
- Errors are mapped from `AppError` to HTTP status, GraphQL error extension and MCP `isError` through a single mapper.
- A parity test in CI verifies that every operation exists on all surfaces and that every entity can be read through graph, REST and MCP.
- A new capability always starts as a core operation, in the same change as the adapters.

## Consequences
- Business logic and permissions live in one place. The adapters are thin.
- New entities cost more at first, because all surfaces must get them. The generator (`pnpm gen entity`) and feature folders with fixed file names make it mechanical.
- The parity test blocks merge when a surface misses a command. That is intentional.
- The generic GraphQL surface for MCP means the AI assistant can read more than the curated tools show. Depth and cost limits and org scoping are therefore mandatory.
- The adapters (`packages/graphql`, `packages/api`, `apps/mcp`) need their own CLAUDE.md notes as they are built out.
