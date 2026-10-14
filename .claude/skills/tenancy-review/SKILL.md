---
name: tenancy-review
description: Granska en ändring för multi-tenant-läckor, behörighet, audit och AI-godkännande. Använd före merge av ändringar i core, db, auth, MCP eller godkännandeflödet.
---

# Tenancy- och säkerhetsgranskning

Underlag: ADR 0004 (multi-tenancy), 0005 (auth), 0006 (databaskonventioner), 0007 (AI-first).

Kontrollera i diffen:
- **Scoping:** all dataåtkomst går via `context.db` (org-scopad klient). Ingen rå `@okazi/db`-klient i core-handlers, adaptrar eller webben. Nya modeller finns i `ORG_SCOPED_MODELS` och har `organizationId`.
- **Behörighet:** varje operation har `permission`. Adaptrar kringgår inte `execute`. Inga egna `ExecuteContext`.
- **Audit:** varje command anropar `context.recordChange`. `actor` (`user`/`ai`), `conversationId` och `approvedBy` sätts rätt.
- **AI:** mutationer från assistenten returnerar `approval_required`. AI-aktören accepteras bara för assistentens OAuth-klient. Ingen särskild väg in i tjänstelagret.
- **Läsning:** sök och listor filtrerar `status` (mjuk radering) och synlighet (`filter-visible-hits`). Inga cross-org-id:n via parametrar.
- **Gränser:** Zod på all input (HTTP, GraphQL-argument, MCP, env, AI-output). Env bara via `@okazi/config`. Inga hemligheter i loggar eller felmeddelanden.
- **Tester:** isoleringstest (`apps/mcp/test/isolation.test.ts`) täcker ny entitet med två organisationer.

Rapportera fynd med fil:rad, scenario och föreslagen åtgärd. Gör ingen ändring utan att fråga.
