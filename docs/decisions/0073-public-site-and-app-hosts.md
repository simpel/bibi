# 0073 – Public site on the apex, the app on `app.`

- **Date:** 2026-10-27
- **Status:** Accepted
- **Related:** 0013 (hosting and deploy), 0062 (organization slug in the URL), 0028 (payment page)

## Context
- Every host served the same app and `/` redirected to sign-in. There was no public front page.
- ADR 0013 already puts the app on `app.` and MCP on `mcp.`. Cookies are host-only and the public site needs no session.
- Organization slugs are top-level URL segments (ADR 0062), so a new top-level path would collide with an organization.

## Decision
1. One Next.js app and one container serve both hosts. The `Host` header decides in the proxy.
2. The apex serves the public site and redirects any other path to the same path on the app host. Other hosts (`www.`, the second domain) redirect to the apex. The app host is untouched.
3. The apex URL is optional config. Unset means one host and no rules.
4. `site` is a reserved slug and public pages live under it, so they cannot collide with organizations.
5. `/pay/*`, sign-in, OAuth and webhooks stay on the app host. No cookie is shared between hosts.
6. The front page renders on every host and never redirects to sign-in. Its header reads the session only to choose its buttons.

## Rejected
- A separate static site: a second codebase, deploy and copy of translations and tokens for a few sections. Reversal is cheap.
- Sharing the session across hosts: the public site has no logged-in state, and a wider cookie scope is a security cost for no gain.

## Consequences
- Coolify serves four more names on the web service, each needing a certificate for the redirects.
- A new public page is a route under `(site)/site/`. Unlisted apex paths redirect to the app.
