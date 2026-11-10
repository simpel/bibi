# 0087 – Fortnox connection per organization

- **Date:** 2026-11-02
- **Status:** Accepted
- **Amended by:** 0100 (providers as ports: one connection table, routes per method, payment attempts, refunds, credit notes)
- **Related:** 0029, 0077, 0090, 0003, 0050, 0051, 0058, 0027, 0028

## Context
- Venues want invoices created in their own Fortnox, not only an SIE file (ADR 0077). Every later Fortnox feature needs the company connected first.
- Fortnox uses OAuth 2. The access token lives one hour. The refresh token lives 45 days and rotates on every refresh, so the old one stops working at once.
- Bibi had no third-party OAuth callback and no way to store a secret it must read back. API keys are hashed.
- A service account belongs to the Fortnox company, not a person.

## Decision
1. The first slice is the connection only. An admin connects in settings and sees the company name. Nothing is sent yet.
2. Service account with PKCE. The first scope is `companyinformation`; later scopes need a reconnect (ADR 0090 added invoicing scopes).
3. One generic table, `IntegrationConnection`, one row per organization and provider, with status, sealed tokens, snapshots of company data and the pending OAuth state.
4. Tokens are encrypted at rest with AES-256-GCM under `INTEGRATION_SECRET_KEY`, with a version prefix for rotation. Tokens never appear in output, logs or audit.
5. OAuth state lives on the pending row: a hash of the state, the sealed PKCE verifier and a 10-minute lifetime.
6. The callback is a web route using the signed-in session. `integration.completeConnect` is registered on no surface. The code exchange runs in its `external` step (ADR 0058).
7. One function, `getFortnoxAccessToken`, hands out access tokens. It refreshes under a lease so two callers never spend the same rotated refresh token. Refreshes run outside any database transaction, since a rolled-back refresh would lose the only valid token. A refused refresh token marks the row `EXPIRED`.
8. A daily worker job refreshes tokens expiring within 14 days, so quiet organizations stay connected.
9. A new permission feature `integration`, admin only. `list`, `connect` and `disconnect` exist on every surface.

## Rejected
- State and verifier in a cookie. The row already exists and expires with the connection.
- Hash the tokens like API keys. Bibi must send them.
- A `FortnoxConnection` table. Visma is next with the same shape.
- A user account instead of a service account. The connection breaks when the person leaves.
- Request invoicing scopes now. Asks for write access before Bibi uses it.
- Refresh only on use. A quiet organization would lose its connection after 45 days.

## Consequences
- Losing `INTEGRATION_SECRET_KEY` disconnects every organization.
- Fortnox counts as configured only when its credentials and the secret key are all set.
- The Fortnox developer portal needs the redirect URI registered by hand.
