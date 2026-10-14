# 0005 – Authentication

- **Date:** 2026-10-13
- **Status:** Accepted

## Context
Okazi has several kinds of clients: staff in the web UI, REST integrations from other systems, the AI assistant and MCP clients such as Claude Desktop. Each needs its own sign-in path, but all must produce the same permission result. Swedish requirements such as BankID are used for signing, not for regular sign-in in the MVP.

## Decision
- Better Auth is the authentication solution.
- Web (staff and customers): email and password, plus magic link or one-time code (OTP).
- REST: API keys (Better Auth API key plugin). The key is bound to a user and an organization.
- MCP: OAuth through the Better Auth OAuth plugin. The client gets a token that represents the signed-in user. No separate service-account path.
- The AI assistant in the web app uses the same MCP surface with the user's token. It gets no higher permissions than the user.
- BankID is introduced later for contract signing (see the domain model, Contracts and signing). It is not part of sign-in in the MVP.
- All clients go through the same session and permission resolution in `packages/auth`.

## Consequences
- One authentication path per client type, but one permission model. This reduces the risk of divergence.
- API keys and OAuth tokens must be revocable. Revocation must be a core operation and therefore exist on all surfaces.
- MCP auth and the OAuth flow are security-critical and are reviewed at Opus level.
- The BankID integration is its own track. No ADR is needed until it starts.
