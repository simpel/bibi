# 0062 – Organization in the URL

- **Date:** 2026-10-22
- **Status:** Proposed
- **Related:** 0004 (multi-tenancy), 0061 (welcome flow), 0050 (permissions)

## Context
- Checked on 2026-10-22 in `apps/web/src/server/session.ts`, `apps/web/src/proxy.ts`, `packages/auth/src/auth.ts` and `apps/web/src/lib/routes.ts`:
  - The active organization lives only in the Better Auth session (`activeOrganizationId`).
  - App URLs are unscoped (`/pipeline`), so a link cannot say which organization it is about, and switching organizations keeps the URL.
- The organization `slug` is globally unique but invisible: `slugify` plus a random suffix.

## Decision
1. **Every app route lives under `/:locale/:org/...`**, where `:org` is the organization slug.
   - Unscoped and top level: `login`, `sign-up`, `accept-invitation`, `oauth`, `docs`, `mothership`, `pay`, `welcome`.
2. **The proxy keeps the session in step with the URL.**
   - For `/:locale/:slug/...` with a non-reserved slug, it resolves the organization.
   - When that organization is not the active one, it calls Better Auth `setActiveOrganization` and forwards the cookie.
   - The `[org]` layout returns 404 when the slug is not the session's active organization, which means the user is not a member.
   - Operations keep reading the session. The URL never grants access.
3. **Navigation goes through one web-local wrapper** (`apps/web/src/lib/navigation.ts`) around `@bibi/i18n/navigation`. `Link`, `useRouter` and `redirect` prefix scoped paths with the current slug. Switching organizations navigates to `/:slug/pipeline`.
4. **Slugs are chosen by the user and validated.**
   - Format: lowercase `a–z`, `0–9` and `-`, 3–40 characters, no dash at either end. Å and ä become a, ö becomes o.
   - A taken or reserved slug gets the first free `-2…-n` suggestion.
   - The reserved list (`packages/auth/src/organization/reserved-slugs.ts`) covers every top-level route plus `api`, `_next`, `_vercel` and the locales. A test fails when a new top-level route is missing from it.
   - `beforeCreateOrganization` enforces the rules on the server.

## Consequences
- About 260 navigation imports move to the wrapper (codemod). Path parsers drop the org segment: breadcrumbs, nav active state, assistant page context.
- URLs built outside the web app that point at org pages need the slug, e.g. the Stripe onboarding return URL.
- Links can be shared between members of the same organization.

## Alternatives rejected
- **Subdomain per organization:** wildcard TLS and cookies across subdomains on Coolify, and no gain for an internal staff tool.
- **Keep unscoped URLs:** a shared link opens in whatever organization the reader last used.
- **Org from the URL only, no session sync:** every operation and the MCP token read the session. Two sources would disagree.
