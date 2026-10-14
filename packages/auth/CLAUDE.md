# @okazi/auth – context for Claude

Better Auth 1.7.7 (Prisma adapter) + plugins: email/password, magic link, email OTP, organization, API key (`@better-auth/api-key`), MCP/OAuth 2.1 (`@better-auth/mcp` + `jwt` + `cimd`). See ADR 0004 and 0005. Security-critical: changes are reviewed at Opus level.

## The contract
- `resolveExecuteContext({ headers })` → `Result<ExecuteContext>` is the **only** caller lookup for web, GraphQL, REST and MCP. Never build `createExecuteContext` yourself in a surface.
  - Order: `x-api-key` / `Authorization: Bearer okz_…` (API key) → `Authorization: Bearer <jwt>` (OAuth token) → session cookie.
  - Org: session = `session.activeOrganizationId`; API key = `metadata.organizationId`; OAuth = claim `okazi_org` (the active org when the user approved the client).
  - Roles are read **live** from `member` on every call and resolved to `permissions` (`resolve/role-permissions.ts`): `owner` = everything, others = the union of the organization's active `organizationRole` rows. Unknown/archived roles give nothing (ADR 0020).
  - API key: `metadata.role` (a role name, never `owner`). Effective permissions = the member's ∩ the key role's, both live.
  - `UNAUTHENTICATED` = missing/invalid credential. `FORBIDDEN` = no org, not a member, or a disallowed AI actor.
- `getAuth()` (lazy singleton), `authHandler` (`export const { GET, POST } = authHandler;` in `app/api/auth/[...all]/route.ts`), `requireSession({ headers })`, `createOrgApiKey({ headers, organizationId, name, role })`.
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

## OAuth/MCP
- Tokens are JWTs with `aud` = `${MCP_URL}/mcp`, `iss` = `${BETTER_AUTH_URL}/api/auth`, 15 min lifetime. Only `authorization_code` + `refresh_token` (no `client_credentials`). DPoP-bound and opaque tokens are rejected.
- If the session has no active org, the user is sent to `/select-organization` before consent. The web app needs the pages `/login`, `/oauth/consent`, `/select-organization`, `/accept-invitation/[id]`.
- Users may not create OAuth clients via the API. The web client is provisioned by ops and its id is set in `WEB_OAUTH_CLIENT_ID`.

## Roles and permissions (ADR 0020)
- Organization plugin with `dynamicAccessControl`: roles per org in `organizationRole` (`permission` = JSON `PermissionSet`, plus `status`/`createdBy`). The rows are written **only** by core `role.*`.
- The only static role is `owner`. Better Auth's `admin`/`member` are overridden without permissions.
- Better Auth's own role paths are closed: `owner` has no `ac`, and `updateMemberRole` is blocked with `organizationHooks.beforeUpdateMemberRole` (the creator would otherwise bypass the check). Roles are assigned via `member.assignRole`.
- Okazi and Better Auth share the resource name `member`; the statements are merged per resource in `permissions.ts`, never overwritten.

## Adding a permission
1. Add the resource to `RESOURCES` in `packages/core/src/permissions/resources.ts`.
2. Use `"<resource>:read|write|admin"` as `permission` in the core operation.
3. Add it to the role templates (`packages/core/src/templates/roles/`) where it belongs. Existing org roles do not get it automatically.

Resources today: `venue`, `item`, `configuration`, `search`, `conversation`, `skill`, `role`, `member`.

## Schema and tests
- `auth.prisma` is generated: `pnpm --filter @okazi/auth auth:generate`. Remove `generator`/`datasource` from the result, then run `pnpm --filter @okazi/db migrate:dev --name <name>`.
- Mail: `sendMail({ to, subject, text })` via `SMTP_URL` (mailpit). Tests swap the sender with `setMailSender`.
- Tests run against a real Postgres, including a full OAuth flow (authorize + PKCE + token) through `getAuth().handler`.
