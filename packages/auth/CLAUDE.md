# @okazi/auth – kontext för Claude

Better Auth 1.7.7 (Prisma-adapter) + plugins: e-post/lösenord, magic link, e-post-OTP, organization, API-nyckel (`@better-auth/api-key`), MCP/OAuth 2.1 (`@better-auth/mcp` + `jwt` + `cimd`). Se ADR 0004 och 0005. Säkerhetskritiskt: ändringar granskas på Opus-nivå.

## Kontraktet
- `resolveExecuteContext({ headers })` → `Result<ExecuteContext>` är den **enda** uppslagningen av anroparen för webb, GraphQL, REST och MCP. Bygg aldrig `createExecuteContext` själv i en yta.
  - Ordning: `x-api-key` / `Authorization: Bearer okz_…` (API-nyckel) → `Authorization: Bearer <jwt>` (OAuth-token) → sessionscookie.
  - Org: session = `session.activeOrganizationId`; API-nyckel = `metadata.organizationId`; OAuth = claim `okazi_org` (aktiv org när användaren godkände klienten).
  - Roller läses **live** från `member` vid varje anrop. API-nyckelns roll begränsas av ägarens roll.
  - `UNAUTHENTICATED` = saknad/ogiltig credential. `FORBIDDEN` = ingen org, inte medlem, eller otillåten AI-aktör.
- `getAuth()` (lazy singleton), `authHandler` (`export const { GET, POST } = authHandler;` i `app/api/auth/[...all]/route.ts`), `requireSession({ headers })`, `createOrgApiKey({ headers, organizationId, name, role })`.
- Webbklient: `createAuthClient({})` från `@okazi/auth/client` (importerar inget serverkod).
- `Organization.id` = `organizationId` på alla affärsrader. Ingen FK (Better Auth äger tabellerna).

## Plattformsadmin (ADR 0015)
- Admin-plugin: `user.role` (`user`/`admin`) och ban. **Alla** `/admin/*`-endpoints är avstängda (`DISABLED_ADMIN_PATHS`). Roller sätts med `pnpm --filter @okazi/auth grant-admin <email> [--revoke]` (`setPlatformAdmin`, skriver AuditLog).
- `resolvePlatformContext({ headers })`: endast sessionscookie, rollen läses live (`isPlatformAdmin`), impersonerade sessioner nekas. API-nycklar och OAuth-token ger `FORBIDDEN`.
- `auth.prisma`-fälten för pluginet är handlagda: `auth:generate` misslyckas med `withoutDatabase` (minnesadapter).

## Förtroendegräns: AI-aktör
- `x-okazi-actor: ai` + `x-okazi-conversation-id` ger `actor = { type: "ai", userId, conversationId }` (kommandon kräver då godkännande).
- Accepteras **endast** för OAuth-tokens vars `azp` är en förstapartsklient med `allowsAiActor: true` i `FIRST_PARTY_CLIENTS` (i dag bara `assistant` = `WEB_OAUTH_CLIENT_ID`). Cookie, API-nyckel, okända och övriga OAuth-klienter → `FORBIDDEN`.
- En AI-begäran som inte kan godtas nedgraderas aldrig tyst till `user` (då skulle godkännandet hoppas över).

## Förstapartstoken (`src/first-party/`)
- `getFirstPartyAccessToken({ client, headers, caller })` → `Result<string>`: MCP-token åt användaren bakom sessionscookien, utfärdad till en av Okazis egna OAuth-klienter. Kör authorization code + PKCE **i processen** genom `getAuth().handler` (authorize med enbart `cookie`-headern, sedan `/oauth2/token`). Ingen egen signering, ingen webbläsarrunda.
- `client` är en nyckel i `FIRST_PARTY_CLIENTS` (`first-party/clients.ts`, inte exporterad): `clientId` (från config), `scope` (`openid`, ingen refresh-token), `redirectPath` (måste vara registrerad på klienten men följs aldrig: koden läses ur authorize-svaret) och `allowsAiActor`. Ny klient (⌘K, schemalagda skills, integrationer) = en post här + provisionering med `skipConsent`.
- I dag finns bara `assistant`: `WEB_OAUTH_CLIENT_ID`, redirect `${WEB_URL}/api/assistant/oauth/callback` (`provision:oauth`), `allowsAiActor: true`.
- Token får `okazi_org` = sessionens aktiva org och `azp` = klientens id. Cache per process, nyckel (klient, användare, org) där användare+org kommer från `resolveExecuteContext`; max 1000 poster, förnyas 2 min före utgång (15 min).
- Förtroendegräns: den som har sessionscookien kan redan allt token tillåter. `assistant`-token ger bara *dessutom* AI-läget, som är mer begränsat (kommandon blir förslag). `approval_confirm` anropas med samma token men **utan** AI-headrar, och bara när användaren klickat Godkänn.
- Export: `getFirstPartyAccessToken` + typerna `GetFirstPartyAccessToken`, `GetFirstPartyAccessTokenInput`, `FirstPartyClient`. Serverkod (`node:crypto`, Better Auth-servern): importera aldrig i klientkomponenter.

## OAuth/MCP
- Tokens är JWT med `aud` = `${MCP_URL}/mcp`, `iss` = `${BETTER_AUTH_URL}/api/auth`, 15 min livslängd. Endast `authorization_code` + `refresh_token` (ingen `client_credentials`). DPoP-bundna och opaka tokens avvisas.
- Saknar sessionen aktiv org skickas användaren till `/select-organization` före consent. Webben behöver sidorna `/login`, `/oauth/consent`, `/select-organization`, `/accept-invitation/[id]`.
- Användare får inte skapa OAuth-klienter via API. Webbklienten provisioneras av drift och dess id sätts i `WEB_OAUTH_CLIENT_ID`.

## Lägga till en behörighet
1. Lägg resursen i `RESOURCES` i `src/permissions.ts` (enda mappningen). Roll → åtgärder kommer från core:s `hasPermission`.
2. Använd `"<resurs>:read|write|admin"` som `permission` i core-operationen.
3. Befintliga API-nycklar saknar den nya resursen och tappar därmed sin roll. Utfärda nya nycklar.

Resurser i dag: `venue`, `room`, `search`, `conversation`, `skill`. `conversation` och `skill` lades till 2026-10-13: nycklar utfärdade dessförinnan måste utfärdas på nytt.

## Schema och tester
- `auth.prisma` genereras: `pnpm --filter @okazi/auth auth:generate`. Ta bort `generator`/`datasource` ur resultatet och kör sedan `pnpm --filter @okazi/db migrate:dev --name <namn>`.
- Mail: `sendMail({ to, subject, text })` via `SMTP_URL` (mailpit). Tester byter avsändare med `setMailSender`.
- Tester körs mot riktig Postgres, inklusive ett fullständigt OAuth-flöde (authorize + PKCE + token) genom `getAuth().handler`.
