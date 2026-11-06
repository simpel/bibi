# 0062 – Organization in the URL

- **Date:** 2026-10-22
- **Status:** Accepted
- **Related:** 0004 (multi-tenancy), 0061 (welcome flow), 0050 (permissions)

## Context
- The active organization lived only in the Better Auth session, so a link could not say which organization it was about and switching kept the URL.
- The organization slug was unique but invisible.

## Decision
1. Every app route lives under `/:locale/:org/...`, where `:org` is the slug. Login, sign-up, invitations, OAuth, docs, mothership, pay and welcome stay unscoped.
2. The proxy keeps the session in step with the URL. When the URL's organization is not the active one, it calls `setActiveOrganization`. The `[org]` layout returns 404 when the slug is not the session's active organization, which means the user is not a member. Operations keep reading the session, so the URL never grants access.
3. Navigation goes through one web-local wrapper that prefixes scoped paths with the current slug.
4. Slugs are chosen by the user and validated server-side: lowercase letters, digits and dashes, 3 to 40 characters. A taken or reserved slug gets a free suggestion. A reserved list covers every top-level route, and a test fails when a route is missing from it.

## Rejected
- Subdomain per organization: wildcard TLS and cross-subdomain cookies on Coolify, with no gain for an internal staff tool.
- Unscoped URLs: a shared link opens in whatever organization the reader last used.
- Organization from the URL only, with no session sync: operations and the MCP token read the session, so two sources would disagree.

## Consequences
- Navigation imports moved to the wrapper, and path parsers drop the org segment.
- URLs built outside the web app need the slug, for example the Stripe onboarding return URL.
- Links can be shared between members of the same organization.
