# 0002 – Teknikstack och monorepo

- **Datum:** 2026-10-13
- **Status:** Accepterat

## Kontext
Okazi ska exponera samma funktionalitet i webb, GraphQL, REST och MCP, och AI-assistenten ska använda samma ytor. Det kräver ett gemensamt kodbas med delade paket. Teknikstacken har varit öppen i CLAUDE.md.

## Beslut
- Monorepo med pnpm workspaces och Turborepo.
- TypeScript i strict-läge överallt.
- Webb: Next.js (App Router).
- Databas: Prisma mot Postgres med pgvector.
- Lint och format: Biome.
- Tester: Vitest för tjänstelagret (mot riktig Postgres), Playwright för e2e och Storybook för `packages/ui`.
- Styling: Tailwind v4 med CSS-first tokens, cva och shadcn-primitiver.
- i18n: next-intl (sv och en).
- Drift: Docker Compose för lokal utveckling och `turbo prune`-baserade Dockerfiles för appar.

Paketlayouten beskrivs i CLAUDE.md under "Paketlayout".

## Konsekvenser
- Gemensam logik ligger i `packages/*` och importeras av båda apparna, så ingen logik dupliceras mellan web och MCP.
- Turborepo styr byggordning och cache. Tasks som `build`, `typecheck` och `test` beror på `^build`.
- Kravet på Node 22+ och pnpm 10 gäller för alla utvecklare och CI.
- Prisma kräver generering innan typecheck. Genererad kod ligger i `packages/db/src/generated` och undantas från lint och strukturkontroll.
- Vi binder oss till Next.js App Router och Prisma. Byte av någon av dem kräver ny ADR.
