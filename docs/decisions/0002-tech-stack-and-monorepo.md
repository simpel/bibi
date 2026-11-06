# 0002 – Tech stack and monorepo

- **Date:** 2026-10-13
- **Status:** Accepted

## Context
- Bibi exposes the same functionality in web, GraphQL, REST and MCP, and the AI assistant uses the same surfaces.
- That needs one codebase with shared packages, so logic is never duplicated between apps.

## Decision
1. A monorepo with pnpm workspaces and Turborepo, TypeScript in strict mode everywhere.
2. Next.js (App Router) for the web app.
3. Prisma against Postgres with pgvector.
4. Tailwind v4 with CSS-first tokens, next-intl for sv and en, Biome for lint and format.
5. Vitest runs the service layer against a real Postgres; Playwright covers e2e.
6. Docker Compose locally and `turbo prune` Dockerfiles for apps.

The package layout lives in CLAUDE.md.

## Rejected
- Separate repositories per app: shared logic would need publishing and version juggling.
- Mocked databases in service tests: they hide migration, trigger and constraint behaviour.

## Consequences
- Shared logic lives in `packages/*` and both web and MCP import it.
- We commit to Next.js App Router and Prisma. Replacing either needs a new ADR.
- Prisma must generate its client before typecheck; generated code is excluded from lint and the structure check.
