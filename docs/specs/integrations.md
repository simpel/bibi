# Integrations

Behaviour of an organization's connections to outside systems. Decision: [ADR 0087](../decisions/0087-fortnox-connection.md). Entity: `IntegrationConnection` in `docs/domain-model.md`.

## Connect Fortnox
1. An admin opens Settings → Integrations and chooses Connect on the Fortnox card (`integration.connect`).
2. Bibi stores a pending authorization (state hash, sealed PKCE verifier, start time) and sends the browser to Fortnox's consent page: scope `companyinformation`, offline access, service account.
3. A Fortnox system administrator approves. Fortnox redirects to `/api/integrations/fortnox/callback?code&state`.
4. The callback runs `integration.completeConnect` as the signed-in user in the session's active organization. The state must match and be at most 10 minutes old.
5. After the commit Bibi exchanges the code, reads the Fortnox company (name, organization number, database number) and stores the sealed tokens. The connection is CONNECTED.
6. The browser lands on Settings → Integrations with `?fortnox=connected`, `denied` (refused at Fortnox), `expired` (state too old or from another organization) or `failed` (Fortnox refused or was unreachable).

## Statuses
| Status | Meaning | Card actions |
| --- | --- | --- |
| Not connected | No row | Connect |
| Pending | Waiting for the approval at Fortnox | Connect (starts again) |
| Connected | Tokens stored | Reconnect, Disconnect |
| Expired | Fortnox refused the stored refresh token | Reconnect, Disconnect |
| Disconnected | An admin disconnected; tokens revoked and cleared | Connect |

Reconnecting a connected Fortnox keeps it working until the new approval completes.

## Tokens
- Access tokens live 1 hour; Bibi refreshes one when less than 5 minutes remain. Refresh tokens live 45 days and rotate on every refresh.
- Only one caller spends a refresh token at a time (a 30-second lease); others wait for the rotated token.
- A daily worker job refreshes every connection whose refresh token expires within 14 days.

## Configuration
- `FORTNOX_CLIENT_ID`, `FORTNOX_CLIENT_SECRET` (set together) and `INTEGRATION_SECRET_KEY` (32 bytes, base64: `openssl rand -base64 32`). Missing any of them: the card shows Fortnox as not available.
- The Fortnox Developer Portal needs the redirect URI `<WEB_URL>/api/integrations/fortnox/callback` and service accounts enabled.
