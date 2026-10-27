# 0073 – Public site on the apex, the app on `app.`

- **Date:** 2026-10-27
- **Status:** Accepted
- **Related:** 0013 (hosting and deploy), 0062 (organization slug in the URL), 0028 (payment page)

## Context
- Every host served the same app and `/` redirected to the sign-in page. There was no public front page.
- Domains: `heybibi.se` (primary) and `heybibi.tech` (redirect only). ADR 0013 already puts the app on `app.` and MCP on `mcp.`.
- The app's cookies are host-only and the public site needs no session. Organization slugs are top-level URL segments (ADR 0062), so a new top-level path would collide with an organization.

## Decision
- **One Next.js app and one container** serve both hosts. The `Host` header decides in `apps/web/src/proxy.ts` (`server/host-routing.ts`):
  - the apex (`PUBLIC_URL`) serves the public site: `/`, `/sv` and `/en` are rewritten to `/<locale>/site`;
  - any other path on the apex redirects (308) to the same path on the app host (`WEB_URL`);
  - any other host (`www.`, `heybibi.tech`) redirects (308) to the apex;
  - the app host is untouched.
- `PUBLIC_URL` is optional. Unset (development, CI, tests) means one host and no rules; the public page is then at `/<locale>/site`.
- `site` is a reserved slug. Public pages live under that prefix so they cannot collide with organization slugs.
- `robots.txt` allows the apex and disallows every other host. The sitemap lists the apex front page.
- `/pay/*`, sign-in, OAuth and webhooks stay on the app host. Every generated link already comes from `WEB_URL`. MCP stays on `mcp.`.
- No cookie is shared between the hosts.

## Rejected
- **A separate static site** (own repository and Coolify resource): cleaner split, but a second codebase, deploy and copy of the translations and design tokens, for a front page of a few sections. Reversal is cheap: move `(site)` out and point the apex at it.
- **Sharing the session across hosts** (`crossSubDomainCookies`): the public site has no logged-in state, and a wider cookie scope is a security cost for no gain.

## Consequences
- Coolify serves four more names on the `web` service (`heybibi.se`, `www.heybibi.se`, `heybibi.tech`, `www.heybibi.tech`) and issues a certificate for each, which the redirects need.
- A new public page is a new route under `(site)/site/` that the apex rewrite (or a new rule) can reach. Anything under the apex that is not listed redirects to the app.
