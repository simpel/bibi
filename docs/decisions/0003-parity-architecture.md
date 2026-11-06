# 0003 – Parity architecture

- **Date:** 2026-10-13
- **Status:** Accepted

## Context
- Bibi is used through the web UI, GraphQL, REST and MCP, and the AI assistant must be able to do what the user can.
- Without one source, permission, validation and audit rules diverge between surfaces.

## Decision
1. Core operations in `packages/core` are the single source of truth: Zod input and output, a permission check and a handler, defined with `defineOperation`.
2. Every command exists on web, GraphQL, REST and MCP. Every entity can be read through graph, REST and MCP.
3. REST under `/api/v1` and its OpenAPI spec are derived from the operations. The GraphQL schema is generated from entities and operations.
4. MCP offers curated tools (one per command and common read) plus generic read-only `graphql_schema` and `graphql_query` with depth and cost limits.
5. `AppError` is mapped to HTTP, GraphQL and MCP errors by one mapper.
6. A parity test in CI blocks merge when a surface misses a command or entity.
7. A new capability starts as a core operation, in the same change as its adapters.

The web app does not read through GraphQL; it runs the same operations in-process (ADR 0010). Parity is unchanged.

## Rejected
- Adapter-specific business logic: rules drift between surfaces.
- Curated MCP tools only: the assistant could not answer free-form questions.

## Consequences
- Logic and permissions live in one place and the adapters are thin.
- New entities cost more up front. Feature folders with fixed file names and a generator make it mechanical.
- Generic GraphQL reads make depth limits, cost limits and org scoping mandatory.
