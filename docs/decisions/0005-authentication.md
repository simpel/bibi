# 0005 – Authentication

- **Date:** 2026-10-13
- **Status:** Accepted

## Context
- Clients differ: staff in the web UI, REST integrations, the AI assistant and MCP clients. Each needs its own sign-in path but all must give the same permission result.
- Guests and customers never sign in; they only see the payment page.

## Decision
1. Better Auth is the authentication solution.
2. Web (staff only): magic link only. Email and password and the one-time code are turned off; each is another credential to secure, reset and translate, and staff reach their work mail.
3. REST: API keys (Better Auth API key plugin) that belong to the organization, not a user (ADR 0050).
4. MCP: OAuth through the Better Auth OAuth plugin. The token represents the signed-in user; there is no service-account path. The assistant uses the same surface with the user's token.
5. All clients go through the same session and permission resolution in `packages/auth`.
6. A key acts with its own role preset plus overrides and survives its creator leaving. Key and grant management (`apiKey.*`, `oauthGrant.*`) are core operations on every surface; Better Auth's own endpoints are closed.
7. `apiKey.create` runs only with a web session, so an OAuth client or key never mints a secret that outlives it. MCP gets `FORBIDDEN`. It is also `aiAllowed: false`.
8. A revoked OAuth grant is enforced by a revocation row, because access tokens are stateless JWTs.
9. BankID is for contract signing later, not sign-in.

## Rejected
- Keeping password as a second sign-in tab: a second credential to secure, reset and support.
- A separate service-account path for MCP: it would bypass the user's permissions.
- Keys owned by users: they would die with the user or inherit a weaker role.

## Consequences
- One path per client type, one permission model.
- Sign-in depends on mail delivery; production mail must be verified before a deploy that relies on it.
- Existing `credential` accounts stay unused; those users sign in with a link to the same email.
- MCP auth and the OAuth flow are security-critical and get Opus review.
