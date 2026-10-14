# 0005 – Authentication

- **Date:** 2026-10-13
- **Status:** Accepted

## Context
Okazi has several kinds of clients: staff in the web UI, REST integrations from other systems, the AI assistant and MCP clients such as Claude Desktop. Each needs its own sign-in path, but all must produce the same permission result. Swedish requirements such as BankID are used for signing, not for regular sign-in in the MVP.

## Decision
- Better Auth is the authentication solution.
- Web (staff only): email and password, plus magic link or one-time code (OTP). Guests and customers see only the payment page, never the booking system UI.
- REST: API keys (Better Auth API key plugin). The key is bound to a user and an organization.
- MCP: OAuth through the Better Auth OAuth plugin. The client gets a token that represents the signed-in user. No separate service-account path.
- The AI assistant in the web app uses the same MCP surface with the user's token. It gets no higher permissions than the user.
- BankID is introduced later for contract signing (see the domain model, Contracts and signing). It is not part of sign-in in the MVP.
- All clients go through the same session and permission resolution in `packages/auth`.

## Consequences
- One authentication path per client type, but one permission model. This reduces the risk of divergence.
- API keys and OAuth tokens must be revocable. Revocation must be a core operation and therefore exist on all surfaces.
- Key and grant management are core operations, not an auth-only or platform exception to parity: `apiKey.create|list|revoke` (resource `integration`, action `admin`: admins and owners, ADR 0034) and `oauthGrant.list|revoke` (the caller's own grants; `integration:write` is personal, every role has it). API keys belong to an organization (`apikey.organizationId`), are owned by a member and carry one fixed role (`viewer`, `member` or `admin`; never `owner`, never above the creating member's own). They act with the weaker of that role and the owner's live role. Better Auth's own API key endpoints are closed. Removing a member revokes their keys. OAuth access tokens are stateless JWTs, so a revoked grant is enforced by a revocation row that rejects older tokens. A grant belongs to the organization the user approved it for.
- `apiKey.create` is exposed on every surface, but only a caller signed in with a web session (`credential = session` on the execute context) may run it. An OAuth client (e.g. a third-party MCP chat) or another API key must not receive a secret that outlives it and survives `oauthGrant.revoke`. This is a deliberate, documented limit on parity: GraphQL and REST work with the session cookie, MCP (always token-based) gets FORBIDDEN.
- The assistant never creates keys: `apiKey.create` is marked `aiAllowed: false`, so the AI actor is not offered the tool, cannot propose it, and `execute` refuses it even with an approval.
- MCP auth and the OAuth flow are security-critical and are reviewed at Opus level.
- The BankID integration is its own track. No ADR is needed until it starts.
