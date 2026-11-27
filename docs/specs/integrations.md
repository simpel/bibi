# Integrations

Behaviour of an organization's connections to outside systems (providers). Decisions: [ADR 0087](../decisions/0087-fortnox-connection.md) (OAuth connection) and [ADR 0100](../decisions/0100-payment-providers-as-ports.md) (providers as ports). Entity: `ProviderConnection` in `docs/domain-model.md`. What providers do with money: `docs/specs/payments.md`. Runbooks: `docs/runbooks/swish.md`, `docs/runbooks/visma.md`.

## Connections
- One `ProviderConnection` per organization and provider: Stripe, Swish, Fortnox, Visma eEkonomi. No row = not connected. Settings → Integrations shows one card per provider from `integration.list`, which also says how it connects (`connectKind`) and what it can do.
- `integration.list` (`integration:read`), `integration.connect`, `integration.disconnect` and `integration.syncAccounts` (`integration:write`, admin only), plus `integration.accounts` (`integration:read`, the last read accounts) work for every provider except Stripe's onboarding, which stays on `paymentAccount.startOnboarding|sync|disconnect` (`paymentAccount:write`). `integration.completeConnect` runs only from the web callback and `integration.refreshExpiring` only from the worker, both unregistered.
- A provider that is not configured on the server (missing credentials in `@bibi/config`) shows as not available.

## Connect by OAuth (Fortnox, Visma)
1. An admin chooses Connect on the card (`integration.connect`).
2. Bibi stores a pending authorization (state hash, sealed PKCE verifier, start time) and returns the provider's consent URL. Fortnox: scope `companyinformation invoice customer payment bookkeeping` (the last reads the chart of accounts, ADR 0123; venues connected before it was added reconnect once), offline access, a Fortnox system administrator approves (service account). Visma: `ea:api ea:sales offline_access`.
3. The provider redirects to `/api/providers/<provider>/callback?code&state` (Fortnox's old `/api/integrations/fortnox/callback` is an alias; both are registered at the provider).
4. The callback runs `integration.completeConnect` as the signed-in user in the session's organization; the state must match and be at most 10 minutes old. After the commit Bibi exchanges the code, reads the company (name, organization number, tenant id) and stores the sealed tokens: CONNECTED.
5. After a successful connect the browser lands on the provider's own settings page (`/admin/integrations/<provider>`); otherwise it lands on Settings → Integrations with `?provider=<KEY>&outcome=denied|expired|notReady|failed`.

Accounts and mappings (ADR 0123, amending 0108): Bibi stores purposes mapped to the connected ledger's own accounts (`AccountMapping`: Deposits, Default revenue and one per item type; `accountMapping.list|set`, `finance:read|write`), not typed numbers. The ledger's accounts are a snapshot on the connection (`chart`, `accountsSyncedAt`), filled by `integration.syncAccounts` after the commit when a ledger connects and on request, never on page load. Fortnox: the chart of accounts, `account` is the number. Spiris: one entry per coding family ("Tjänster") with the VAT rates it has a coding for. Problems (`setupIssues`: `ACCOUNT_MISSING`, `ADVANCES_CODING_MISSING`, `REVENUE_CODING_MISSING`, `ACCOUNTS_UNAVAILABLE`) are derived on read from mappings, snapshot and the VAT rates in use. The mapping is edited on the provider's settings page as lines from purposes to accounts (`MappingCanvas`, a select per purpose as keyboard path); Administration → Accounting only redirects there. A new Fortnox connection is pre-mapped to 2420 and 3001 when they exist. Fortnox now also asks for the `bookkeeping` scope, so connected venues reconnect once. A provider that cannot be read at connect still connects. The Integrations page groups providers by purpose: invoicing and bookkeeping (one at a time), card and Swish.

One accounting system at a time (ADR 0108): `integration.connect` and the callback refuse (`CONFLICT`) a ledger provider (Fortnox, Visma) while the other is connected; the admin disconnects it first, and invoices already raised stay in the system that raised them (Bibi stops reading their payments there). A successful connect moves a saved INVOICE route to the new ledger. Card and Swish providers are not limited. Reconnecting a connected provider keeps it working until the new approval completes. Organizations connected before the Fortnox scopes grew reconnect once.

## Connect by credentials (Swish)
- The card opens a dialog for the Swish number, certificate (.p12, base64) and passphrase. `integration.connect` checks them against the provider's schema in the handler; Swish's certificate must be issued to the Swish number entered (its subject names it), so nobody can claim another venue's number; after the commit the provider verifies them with a harmless read (Swish Handel answers 404 for a request that cannot exist) and they are stored sealed with the number as `externalAccountId`. Nothing is echoed back. Certificates are per venue and expire after two years; connect again with the new file. The assistant may not pass credentials (`FORBIDDEN`, also in a proposal's preview, so they never reach an approval card): an admin enters them in the dialog.

## Connect by hosted onboarding (Stripe)
- `paymentAccount.startOnboarding` inserts the connection row first and calls Stripe after the commit (ADR 0058): a preview creates no account and a retry resumes the row. The admin finishes on Stripe's pages; `status` mirrors the account's card payments capability (`ONBOARDING`, `CONNECTED`, `RESTRICTED`), refreshed by `paymentAccount.sync` and the `account.updated` webhook. Disconnect sets `disconnectedAt`: nothing is charged and links already sent keep working; connecting again resumes the same Stripe account.

## Statuses
| Status | Meaning | Card actions |
| --- | --- | --- |
| Not connected | No row | Connect |
| Pending | OAuth approval not completed | Connect (starts again) |
| Onboarding | Stripe onboarding not finished | Continue, Disconnect |
| Connected | Ready to use | Reconnect, Disconnect |
| Restricted | The provider restricted the account | Continue, Disconnect |
| Expired | The provider refused the stored grant | Reconnect, Disconnect |
| Disconnected | An admin disconnected; secrets cleared and revoked | Connect |

## Secrets and tokens
- OAuth tokens and Swish credentials are sealed with AES-256-GCM under `INTEGRATION_SECRET_KEY` (32 bytes, base64: `openssl rand -base64 32`) and never leave core in an output, log or audit row.
- OAuth tokens come only from `getAccessToken` / `authFor`, called outside a transaction. Fortnox: access tokens live 1 hour and are refreshed when under 5 minutes remain; refresh tokens live 45 days and rotate on every refresh. Visma assumes 30 days. One caller at a time spends a refresh token (a 30-second lease); others wait for the rotated one.
- The worker's daily `integration.refreshExpiring` refreshes every OAuth connection whose refresh token is within its window (14 days for Fortnox).

## Events in
- Webhooks and callbacks: `POST /api/providers/<provider>/webhook` (Stripe's `/api/webhooks/stripe` is an alias; Swish `.../swish/webhook`). Streams and polls run in the worker from the registry (`apps/worker/CLAUDE.md`): Fortnox Topics stream (company tenant id learned by the worker, offset in `ProviderStreamOffset`), Visma `provider.poll` every 15 minutes. Details: `docs/specs/payments.md`, Inbound events.

## Configuration
- Common: `INTEGRATION_SECRET_KEY`. Fortnox: `FORTNOX_CLIENT_ID`, `FORTNOX_CLIENT_SECRET` (together), `FORTNOX_AUTH_BASE_URL`, `FORTNOX_API_BASE_URL` (required with them); redirect URI `<WEB_ORIGIN>/api/providers/fortnox/callback` (or the alias) and service accounts enabled. Visma: `VISMA_CLIENT_ID`, `VISMA_CLIENT_SECRET`, `VISMA_IDENTITY_BASE_URL`, `VISMA_API_BASE_URL` (id and secret together, hosts required with them, no defaults). Swish: `SWISH_API_BASE_URL` (no default), and `WEB_ORIGIN` must be public HTTPS for callbacks. Stripe: `STRIPE_API_BASE_URL` (required with the key, and by Bibi's own billing), `STRIPE_SECRET_KEY`, `STRIPE_PLATFORM_ACCOUNT_ID`, `STRIPE_WEBHOOK_SECRET`. Provider hosts come only from env, never from code. A provider missing any of its settings is not available.

## Not built
- Peppol e-invoicing. Visma `registerPayment` (see payments spec) and Visma sandbox verification. A Swish bank onboarding flow.
