# 0037 – Public documentation at /docs

- **Date:** 2026-10-17
- **Status:** Accepted

## Context
- Venues should be able to sign up without talking to sales (CLAUDE.md). They need a place to read how Bibi works before and after they sign up.
- Integrators need to know how to authenticate and call REST, GraphQL and MCP. The only reference today is the Scalar page at `/api/v1/docs`, which covers REST only and says nothing about MCP or AI approvals.
- Hand-written endpoint lists drift. The parity architecture (ADR 0003) already gives us one list of operations with Zod schemas, permissions and approval flags.

## Decision
- **`/[locale]/docs` in the web app, public.** Its own route group `(docs)` with a sidebar shell. No session is read.
- **Three sections.** *Guide* for staff, *Developers* for integrators (authentication, REST, GraphQL, MCP, approvals, errors) and *Reference*.
- **Prose lives in next-intl.** Each page is `docs.pages.<section>.<slug>` with `title`, `lead` and a markdown `body`, in sv and en (ADR 0009). Bodies are read with `t.raw` so JSON examples are not parsed as ICU. `{{webUrl}}` and `{{mcpUrl}}` are replaced with the deployment's URLs.
- **REST reference = the existing Scalar page.** The docs link to `/api/v1/docs` (generated from `openapi.json`) instead of rendering their own route list. Scalar already has search, schemas and try-it-out.
- **MCP reference is generated, never written by hand.** `/docs/reference/mcp` lists one entry per core operation with the MCP naming rule (`venue.create` → `venue_create`) plus the generic `graphql_schema` and `graphql_query` tools. Each entry shows the permission, whether it changes data, whether an AI call needs approval, the argument and result schemas and an example `tools/call` request. There is no hosted Scalar equivalent for MCP (the MCP Inspector is a local tool), and describing MCP tools as fake OpenAPI routes in Scalar would make try-it-out fail, so the MCP reference is its own page.
- Markdown is rendered by the existing safe `MarkdownView` (no raw HTML) with a new `document` variant. Root-relative links use the locale-aware `Link`.

## Consequences
- Publishing the MCP tool catalogue is deliberate: it reveals which operations and permissions exist, but no data. `openapi.json` and the Scalar page were already public.
- A new operation shows up in both references without any docs change. Prose pages still need a manual update when behaviour changes.
- The MCP reference mirrors `apps/mcp`'s naming rule instead of importing the app. If the MCP server starts renaming tools, `features/docs/server/mcp-reference.ts` must follow.
- `approval_confirm` is not listed: it is human-only and called by the web app, not by MCP clients.
- Long prose in `sv.json`/`en.json` makes the catalogues larger. If that becomes a problem, docs messages can move to their own namespace file loaded only under `/docs`.
