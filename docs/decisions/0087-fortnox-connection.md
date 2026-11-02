# 0087 – Fortnox connection per organization

- **Date:** 2026-11-02
- **Status:** Accepted (approved by the user on 2026-11-02)
- **Related:** 0029 (invoicing, defers Fortnox), 0077 (SIE export covers accounting until a direct integration), 0003 (parity), 0050 (permissions), 0051 (single source of truth), 0058 (external effects after commit), 0027 (worker jobs), 0028 (Stripe Connect, the closest pattern)

## Context
- Venues want invoices created in their own Fortnox, not only an SIE file to import (ADR 0077). Every later Fortnox feature needs the organization's Fortnox company connected first.
- Fortnox uses OAuth 2 Authorization Code (`https://apps.fortnox.se/oauth-v1/auth`, `/token`, `/revoke`). The access token lives 1 hour. The refresh token lives 45 days and rotates on every refresh: the old one stops working at once. API calls do not extend either. Revoking the refresh token ends the connection.
- Bibi has no third-party OAuth callback and no way to store a secret it must read back: API keys are hashed, Stripe uses one platform key from env.
- Fortnox scopes are read and write together, and a new scope needs a new authorization. A service account (`account_type=service`) belongs to the Fortnox company, not a person; only a Fortnox system administrator can authorize it.

## Decision
1. **This slice is the connection only.** An admin opens Settings → Integrations, chooses Connect Fortnox, approves on Fortnox and returns connected. Bibi shows the Fortnox company name and organization number. Nothing is sent to Fortnox yet.
2. **Scope `companyinformation`, service account, PKCE.** The authorize URL asks for `companyinformation`, `access_type=offline`, `account_type=service` and an S256 code challenge. When invoicing lands, organizations reconnect to grant the new scopes.
3. **One generic table, `IntegrationConnection`,** one row per organization and provider (`provider` enum, `FORTNOX` now, Visma later). Status `PENDING`, `CONNECTED`, `EXPIRED` or `DISCONNECTED`. It holds the sealed tokens and their expiries, the Fortnox company name, organization number and database number (snapshots from Fortnox at connect, ADR 0051), and the pending OAuth state.
4. **Tokens are encrypted at rest** with AES-256-GCM under `INTEGRATION_SECRET_KEY` (32 bytes, from env via `@bibi/config`). A sealed value carries a version prefix so the key can rotate. Tokens never appear in an operation's output, a log or the audit log.
5. **OAuth state lives on the pending row.** `integration.connect` stores a hash of a random `state`, the sealed PKCE verifier and the start time, and returns the authorize URL. The callback accepts the code only if the state hash matches, the row is `PENDING`, it is at most 10 minutes old and the caller is a member of that organization with `integration:write`.
6. **The callback is a web route,** `/api/integrations/fortnox/callback`, using the signed-in session. It runs `integration.completeConnect`, which is not registered on any surface (like `paymentAccount.applySignal`): a browser redirect is its only caller. The code exchange and the company lookup run in its `external` step (ADR 0058). The route then redirects to Settings → Integrations with the outcome.
7. **One function hands out access tokens:** `getFortnoxAccessToken({ organizationId })`. It locks the row (`FOR UPDATE`), refreshes when less than 5 minutes remain and stores the rotated refresh token in the same transaction, so two callers never spend the same refresh token. If Fortnox refuses the refresh token, the row becomes `EXPIRED` and an admin reconnects.
8. **A daily worker job** refreshes every connected row whose refresh token expires within 14 days, so an organization that sends nothing for 45 days stays connected.
9. **A new permission feature `integration`** (`read`, `write`), admin only and locked like `apiKey` and `paymentAccount` (ADR 0050). `integration.list`, `integration.connect` and `integration.disconnect` exist in web, GraphQL, REST and MCP (ADR 0003). `disconnect` clears the tokens and revokes the refresh token at Fortnox after the commit.
10. **Settings → Integrations becomes a real page** with the Fortnox card and a link to API keys, replacing today's redirect to API keys.

## Consequences
- Config: `FORTNOX_CLIENT_ID` and `FORTNOX_CLIENT_SECRET` (set together) and `INTEGRATION_SECRET_KEY` (required when they are set). Unset, Fortnox shows as not configured and the operations return `UNAVAILABLE`.
- Fortnox Developer Portal, by hand: register `${WEB_URL}/api/integrations/fortnox/callback` as the redirect URI and enable service accounts for the app.
- Data: one migration for `IntegrationConnection`, org-scoped. `docs/domain-model.md` and its artifact.
- Losing `INTEGRATION_SECRET_KEY` disconnects every organization: the tokens cannot be read and admins must reconnect.
- The demo seed has no connection, since it needs a real Fortnox company.
- Not covered: sending invoices, customers or vouchers to Fortnox, Visma, and webhooks from Fortnox.

## Alternatives rejected
- **State and PKCE verifier in a cookie or a signed state.** A cookie adds the web app's first cookie handling and still needs the verifier kept secret; the row already exists for the connection and expires with it.
- **Hash the tokens like API keys.** Bibi must send them to Fortnox, so they must be readable.
- **A `FortnoxConnection` table.** Visma is the next provider with the same shape; one table with a provider column avoids a second copy.
- **User account instead of a service account.** The connection would break when the person who connected leaves the Fortnox company.
- **Request the invoicing scopes now.** Avoids a reconnect later, but asks for write access to invoices and bookkeeping before Bibi uses it. Rejected at the user's choice.
- **Refresh only on use.** An organization with no Fortnox traffic for 45 days would silently lose its connection.

## Addendum 2026-11-02 – as built
- **A refresh lease instead of `FOR UPDATE`.** The org-scoped client hides raw SQL, so decision 7 is built as a compare-and-swap lease: `refreshClaimedAt` is claimed only while the row still holds the same sealed refresh token and no live claim (30 seconds) exists. The holder calls Fortnox and stores the rotated pair; any other caller polls the row (up to 10 seconds) and uses the new access token. An outage releases the lease, since the old token is still valid. Only a refusal of the stored token marks the row `EXPIRED`.
- **Refreshes run outside the transaction.** `integration.refreshExpiring` and the code exchange in `integration.completeConnect` call Fortnox in `external` (ADR 0058): a rolled-back refresh would throw away the only valid refresh token. `getFortnoxAccessToken` documents the same rule for later callers.
- **Reconnecting keeps a working connection.** `integration.connect` on a `CONNECTED` row stores the new state but keeps the status, so Fortnox keeps working until the new approval replaces the tokens.
- **The callback uses the session's active organization** to find the pending row by its state hash. Approving in a browser whose active organization changed in the meantime is refused as expired; the admin starts again.
- **`INTEGRATION_SECRET_KEY` is not required by the env schema.** Fortnox counts as configured only when all three variables are set; otherwise it shows as not configured and `connect` is `UNAVAILABLE`. This keeps an `.env` with only the Fortnox credentials from refusing to start.
- `completeConnect` also requires a session credential (`FORBIDDEN` for an API key or access token) and is `aiAllowed: false`.

## Addendum 2026-11-02 – invoicing scopes (as built)
- The scope is now `companyinformation invoice customer payment` (ADR 0090). A connection made before holds the old scope only; its organization reconnects once to grant the rest.
- Fortnox's Topics stream (ADR 0090) is how Bibi learns of invoice payments. Fortnox sends no webhook to Bibi.
