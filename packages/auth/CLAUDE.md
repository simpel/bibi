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

## Förtroendegräns: AI-aktör
- `x-okazi-actor: ai` + `x-okazi-conversation-id` ger `actor = { type: "ai", userId, conversationId }` (kommandon kräver då godkännande).
- Accepteras **endast** för OAuth-tokens där `azp` = `WEB_OAUTH_CLIENT_ID` (webbappens förstapartsklient). Cookie, API-nyckel och andra OAuth-klienter → `FORBIDDEN`.
- En AI-begäran som inte kan godtas nedgraderas aldrig tyst till `user` (då skulle godkännandet hoppas över).

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
