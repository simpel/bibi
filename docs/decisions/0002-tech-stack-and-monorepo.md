# 0002 – Tech stack and monorepo

- **Date:** 2026-10-13
- **Status:** Accepted

## Context
Okazi must expose the same functionality in web, GraphQL, REST and MCP, and the AI assistant must use the same surfaces. That requires a shared codebase with shared packages. The tech stack has been open in CLAUDE.md.

## Decision
- Monorepo with pnpm workspaces and Turborepo.
- TypeScript in strict mode everywhere.
- Web: Next.js (App Router).
- Database: Prisma against Postgres with pgvector.
- Lint and format: Biome.
- Tests: Vitest for the service layer (against a real Postgres), Playwright for e2e and Storybook for `packages/ui`.
- Styling: Tailwind v4 with CSS-first tokens, cva and shadcn primitives.
- i18n: next-intl (sv and en).
- Operations: Docker Compose for local development and `turbo prune`-based Dockerfiles for apps.

The package layout is described in CLAUDE.md under "Package layout".

## Consequences
- Shared logic lives in `packages/*` and is imported by both apps, so no logic is duplicated between web and MCP.
- Turborepo controls build order and cache. Tasks such as `build`, `typecheck` and `test` depend on `^build`.
- The requirement for Node 22+ and pnpm 10 applies to all developers and CI.
- Prisma requires generation before typecheck. Generated code lives in `packages/db/src/generated` and is excluded from lint and the structure check.
- We commit to Next.js App Router and Prisma. Replacing either requires a new ADR.
