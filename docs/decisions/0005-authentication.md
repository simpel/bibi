# 0005 – Authentication

- **Date:** 2026-10-13
- **Status:** Accepted

## Context
Bibi has several kinds of clients: staff in the web UI, REST integrations from other systems, the AI assistant and MCP clients such as Claude Desktop. Each needs its own sign-in path, but all must produce the same permission result. Swedish requirements such as BankID are used for signing, not for regular sign-in in the MVP.

## Decision
- Better Auth is the authentication solution.
- Web (staff only): magic link only (since 2026-11-06, see the addendum; it was email and password plus magic link). The one-time code (OTP) was dropped 2026-11-06: it duplicated the magic link and added a second code path to secure and translate. Guests and customers see only the payment page, never the booking system UI.
- REST: API keys (Better Auth API key plugin), bound to an organization.
- MCP: OAuth through the Better Auth OAuth plugin. The client gets a token that represents the signed-in user. No separate service-account path.
- The AI assistant in the web app uses the same MCP surface with the user's token. It gets no higher permissions than the user.
- BankID is introduced later for contract signing (see the domain model, Contracts and signing). It is not part of sign-in in the MVP.
- All clients go through the same session and permission resolution in `packages/auth`.

## Consequences
- One authentication path per client type, but one permission model. This reduces the risk of divergence.
- API keys and OAuth tokens must be revocable. Revocation must be a core operation and therefore exist on all surfaces.
- Key and grant management are core operations on every surface, not an auth-only exception to parity: `apiKey.create|list|update|revoke` and `oauthGrant.list|revoke` (the caller's own grants). Better Auth's own API key endpoints are closed. OAuth access tokens are stateless JWTs, so a revoked grant is enforced by a revocation row that rejects older tokens. A grant belongs to the organization the user approved it for.
- `apiKey.create` is exposed on every surface, but only a caller signed in with a web session (`credential = session`) may run it. An OAuth client or another API key must not receive a secret that outlives it and survives `oauthGrant.revoke`. This is a deliberate, documented limit on parity: GraphQL and REST work with the session cookie, MCP (always token-based) gets `FORBIDDEN`.
- The assistant never creates keys: `apiKey.create` is `aiAllowed: false`, so the AI actor is not offered the tool, cannot propose it, and `execute` refuses it even with an approval.
- MCP auth and the OAuth flow are security-critical and are reviewed at Opus level.
- The BankID integration is its own track. No ADR is needed until it starts.

## Addendum 2026-10-19 (ADR 0050)
- API keys belong to the organization, not to a user. The metadata is `{ role, createdBy }`: `role` is the key's own preset (`member`, `manager` or `admin`), `createdBy` only records the admin who made it.
- A key acts with its preset plus its own overrides (`permission.get|update`, subject type `API_KEY`), not the weaker of its role and an owner's role. It keeps working when its creator leaves: `member.remove` no longer revokes keys (it archives the member's overrides).
- `apiKey.create|list|update|revoke` need `apiKey:*`, which comes only from the `admin` preset. `apiKey.update` renames and changes the preset.
- The actor of a key request is `{ type: "apiKey", userId: null, apiKeyId }` and the audit actor type is `API_KEY`. A key cannot run `self:*` operations (they are personal).
- Existing keys were dropped (no production users).

## Addendum 2026-11-06: magic link only
- Web sign-in and sign-up use the magic link only. Email and password is turned off (`emailAndPassword.enabled: false`), with the password reset mail, the password tab and the change-password section. Rejected: keeping password as a second tab. It is a second credential to secure, reset and support, and staff already reach their work mail.
- Sign-up asks for name and email and mails a link; the first link creates the user (Better Auth's magic link sign-up, email verified).
- Inside an OAuth authorize flow the link returns to the login page with the signed query, which resumes the flow with `oauth2.continue({ postLogin: true })`. The signed query expires, so a link opened too late restarts the flow from the client.
- Sign-in depends on mail delivery. Production mail must be verified in Resend before a deploy that relies on it.
- Existing `credential` accounts stay in the database unused; those users sign in with a link to the same email.
- Tests sign users in through the same magic link verification (`@bibi/auth/testing`), not a password.
