# @okazi/auth – context for Claude

Better Auth 1.7.7 (Prisma adapter) + plugins: email/password, magic link, email OTP, organization, API key (`@better-auth/api-key`), MCP/OAuth 2.1 (`@better-auth/mcp` + `jwt` + `cimd`). See ADR 0004 and 0005. Security-critical: changes are reviewed at Opus level.

## The contract
- `resolveExecuteContext({ headers })` → `Result<ExecuteContext>` is the **only** caller lookup for web, GraphQL, REST and MCP. Never build `createExecuteContext` yourself in a surface.
  - Order: `x-api-key` / `Authorization: Bearer okz_…` (API key) → `Authorization: Bearer <jwt>` (OAuth token) → session cookie.
  - Org: session = `session.activeOrganizationId`; API key = `apikey.organizationId` (Better Auth's `referenceId`, plugin `references: "organization"`); OAuth = claim `okazi_org` (the active org when the user approved the client).
  - The role is read **live** from `member` on every call and resolved to `permissions` with the constant map `ROLE_PERMISSIONS` (`roles/role-permissions.ts`, ADR 0034). A stored name that is not a fixed role gives nothing (`roles: []`).
  - API key: owner = `metadata.userId`, role = `metadata.role` (`viewer`, `member` or `admin`, never `owner`). The key acts with the weaker of its role and the owner's live role (`roles` = that one role); an owner who left the organization gives nothing. Revoked (`enabled = false`), expired and unknown keys → `UNAUTHENTICATED`. Keys are issued, listed and revoked only by core `apiKey.*` (the plugin's HTTP endpoints are disabled).
  - OAuth: a token for (user, `azp`, `okazi_org`) issued at or before an `OauthGrantRevocation.revokedAt` → `UNAUTHENTICATED` (`resolve/grant-revocation.ts`). JWTs are stateless, so this is what makes `oauthGrant.revoke` immediate.
  - `UNAUTHENTICATED` = missing/invalid credential. `FORBIDDEN` = no org, not a member, or a disallowed AI actor.
  - `credential` on the execute context (`session`, `accessToken` or `apiKey`) says how the caller signed in; `apiKey.create` accepts only `session` (ADR 0005).
- `getAuth()` (lazy singleton), `authHandler` (`export const { GET, POST } = authHandler;` in `app/api/auth/[...all]/route.ts`), `requireSession({ headers })`.
- Web client: `createAuthClient({})` from `@okazi/auth/client` (imports no server code).
- `Organization.id` = `organizationId` on all business rows. No FK (Better Auth owns the tables).

## Platform admin (ADR 0015)
- Admin plugin: `user.role` (`user`/`admin`) and ban. **All** `/admin/*` endpoints are disabled (`DISABLED_ADMIN_PATHS`). Roles are set with `pnpm --filter @okazi/auth grant-admin <email> [--revoke]` (`setPlatformAdmin`, writes AuditLog).
- `resolvePlatformContext({ headers })`: session cookie only, the role is read live (`isPlatformAdmin`), impersonated sessions are denied. API keys and OAuth tokens give `FORBIDDEN`.
- The `auth.prisma` fields for the plugin are hand-written: `auth:generate` fails with `withoutDatabase` (memory adapter).

## Trust boundary: AI actor
- `x-okazi-actor: ai` + `x-okazi-conversation-id` give `actor = { type: "ai", userId, conversationId }` (commands then require approval).
- Accepted **only** for OAuth tokens whose `azp` is a first-party client with `allowsAiActor: true` in `FIRST_PARTY_CLIENTS` (today only `assistant` = `WEB_OAUTH_CLIENT_ID`). Cookie, API key, unknown and other OAuth clients → `FORBIDDEN`.
- An AI request that cannot be accepted is never silently downgraded to `user` (the approval would then be skipped).

## First-party token (`src/first-party/`)
- `getFirstPartyAccessToken({ client, headers, caller })` → `Result<string>`: an MCP token for the user behind the session cookie, issued to one of Okazi's own OAuth clients. Runs authorization code + PKCE **in-process** through `getAuth().handler` (authorize with only the `cookie` header, then `/oauth2/token`). No custom signing, no browser round trip.
- `client` is a key in `FIRST_PARTY_CLIENTS` (`first-party/clients.ts`, not exported): `clientId` (from config), `scope` (`openid`, no refresh token), `redirectPath` (must be registered on the client but is never followed: the code is read from the authorize response) and `allowsAiActor`. A new client (⌘K, scheduled skills, integrations) = one entry here + provisioning with `skipConsent`.
- Today only `assistant` exists: `WEB_OAUTH_CLIENT_ID`, redirect `${WEB_URL}/api/assistant/oauth/callback` (`provision:oauth`), `allowsAiActor: true`.
- The token gets `okazi_org` = the session's active org and `azp` = the client's id. Cached per process, key (client, user, org) where user+org come from `resolveExecuteContext`; max 1000 entries, renewed 2 min before expiry (15 min).
- Trust boundary: whoever has the session cookie can already do everything the token allows. The `assistant` token only *additionally* gives the AI mode, which is more limited (commands become proposals). `approval_confirm` is called with the same token but **without** AI headers, and only when the user has clicked Approve.
- Exports: `getFirstPartyAccessToken` + the types `GetFirstPartyAccessToken`, `GetFirstPartyAccessTokenInput`, `FirstPartyClient`. Server code (`node:crypto`, the Better Auth server): never import in client components.

## API keys and OAuth grants (ADR 0005)
- Issued, listed and revoked **only** by core `apiKey.create|list|revoke` (`integration:admin`) and `oauthGrant.list|revoke` (`integration:read|write`, the caller's own grants). Audited there; the secret is returned once and never logged or audited.
- Core writes the `apikey` row itself with the plugin's hashing (`hashApiKey` = `defaultKeyHasher`, guarded by `test/api-key.test.ts`), prefix `okz_` and rate limit (`API_KEY_RATE_LIMIT`). The plugin is used for `verifyApiKey` only; all its HTTP endpoints are closed (`DISABLED_API_KEY_PATHS`).
- `apiKey.create` refuses the AI actor: the secret must never enter a conversation.

## OAuth/MCP
- Tokens are JWTs with `aud` = `${MCP_URL}/mcp`, `iss` = `${BETTER_AUTH_URL}/api/auth`, 15 min lifetime. Only `authorization_code` + `refresh_token` (no `client_credentials`). DPoP-bound and opaque tokens are rejected.
- If the session has no active org, the user is sent to `/select-organization` before consent. The web app needs the pages `/login`, `/oauth/consent`, `/select-organization`, `/accept-invitation/[id]`.
- Users may not create OAuth clients via the API. The web client is provisioned by ops and its id is set in `WEB_OAUTH_CLIENT_ID`.

## Roles and permissions (ADR 0034)
- Fixed roles `viewer < member < admin < owner`, no `organizationRole` table and no `dynamicAccessControl`. `ROLE_PERMISSIONS` (`roles/role-permissions.ts`) is the only role → permission map:
  - `viewer`: `read` on every resource, plus `write` on its own `conversation` and personal `skill` (the assistant).
  - `member`: viewer + `write` on operational data (`customer`, `contact`, `ticket`, `programItem`, `occupancy`, `requirement`, `payment`, `sheet`).
  - `admin` and `owner`: `admin` on everything. What only an owner may do (change or remove owners, keep the last owner, the organization itself) is checked by core `member.*` (rank in `FIXED_ROLES`) and Better Auth's owner statements.
- Better Auth roles (`orgRoles` in `permissions.ts`): only `owner` keeps Better Auth statements; `admin`/`member`/`viewer` have none. `beforeAddMember` refuses anything but a fixed role.
- Better Auth's own role paths are closed: `owner` has no `ac`, and `updateMemberRole` is blocked with `organizationHooks.beforeUpdateMemberRole` (the creator would otherwise bypass the check). Roles are assigned via `member.assignRole`.

## Adding a permission
1. Add the resource to `RESOURCES` in `packages/core/src/permissions/resources.ts`.
2. Use `"<resource>:read|write|admin"` as `permission` in the core operation.
3. Decide in `ROLE_PERMISSIONS` whether `member` writes it (operational data) or only admins do (configuration). Every role reads every resource.

Resources today: see `RESOURCES` (`venue`, `item`, `customer`, …, `member`, `audit`, `payment`, `integration`).

## Schema and tests
- `auth.prisma` is generated: `pnpm --filter @okazi/auth auth:generate`. Remove `generator`/`datasource` from the result, then run `pnpm --filter @okazi/db migrate:dev --name <name>`.
- Mail: `sendAuthMail({ to, subject, text })` (`src/mail.ts`) sends through `@okazi/mail` and rethrows a failed send as `AppError` (Better Auth callbacks report failure by throwing). Tests install `createMemoryMailProvider` via `setMailProvider` (`test/fake-mail.ts`).
- Tests run against a real Postgres, including a full OAuth flow (authorize + PKCE + token) through `getAuth().handler`.
