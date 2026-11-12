# Integrations

Behaviour of an organization's connections to outside systems (providers). Decisions: [ADR 0087](../decisions/0087-fortnox-connection.md) (OAuth connection) and [ADR 0100](../decisions/0100-payment-providers-as-ports.md) (providers as ports). Entity: `ProviderConnection` in `docs/domain-model.md`. What providers do with money: `docs/specs/payments.md`. Runbooks: `docs/runbooks/swish.md`, `docs/runbooks/visma.md`.

## Connections
- One `ProviderConnection` per organization and provider: Stripe, Swish, Fortnox, Visma eEkonomi. No row = not connected. Settings → Integrations shows one card per provider from `integration.list`, which also says how it connects (`connectKind`) and what it can do.
- `integration.list` (`integration:read`), `integration.connect` and `integration.disconnect` (`integration:write`, admin only) work for every provider except Stripe's onboarding, which stays on `paymentAccount.startOnboarding|sync|disconnect` (`paymentAccount:write`). `integration.completeConnect` runs only from the web callback and `integration.refreshExpiring` only from the worker, both unregistered.
- A provider that is not configured on the server (missing credentials in `@bibi/config`) shows as not available.

## Connect by OAuth (Fortnox, Visma)
1. An admin chooses Connect on the card (`integration.connect`).
2. Bibi stores a pending authorization (state hash, sealed PKCE verifier, start time) and returns the provider's consent URL. Fortnox: scope `companyinformation invoice customer payment`, offline access, a Fortnox system administrator approves (service account). Visma: `ea:api ea:sales offline_access`.
3. The provider redirects to `/api/providers/<provider>/callback?code&state` (Fortnox's old `/api/integrations/fortnox/callback` is an alias; both are registered at the provider).
4. The callback runs `integration.completeConnect` as the signed-in user in the session's organization; the state must match and be at most 10 minutes old. After the commit Bibi exchanges the code, reads the company (name, organization number, tenant id) and stores the sealed tokens: CONNECTED.
5. The browser lands on Settings → Integrations with `?provider=<KEY>&outcome=connected|denied|expired|failed`.

Reconnecting a connected provider keeps it working until the new approval completes. Organizations connected before the Fortnox scopes grew reconnect once.

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
