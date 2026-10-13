# @okazi/web – kontext för Claude

Next.js 16 (App Router, Turbopack), React 19, next-intl 4, Better Auth-klient, `@okazi/ui`. Ytan för personal i venues. Se ADR 0003, 0005, 0007, 0009 och 0010.

## Struktur
- `src/app/[locale]/` – sidor (`(auth)` = login, sign-up, select-organization, oauth/consent, accept-invitation/[id]; `(app)` = skyddat skal med sidomeny och `venues`). `page.tsx`/`layout.tsx`/`route.ts` är tunna: de läser params och renderar en feature.
- `src/app/api/auth/[...all]` (Better Auth), `api/graphql`, `api/v1/[...path]` (REST + OpenAPI), `.well-known/oauth-authorization-server` och `oauth-protected-resource` (discovery för MCP/OAuth, vidarebefordras till Better Auth).
- `src/features/<entitet>/ui/` – komponenter per entitet (fasta namn `venue`, `room`; `auth/ui` för inloggning). `actions.ts` bredvid `ui/` = server actions. `web-surfaces.ts` = vilka operationer som har UI.
- `src/components/` – app-nivå: `shell/` (sidomeny, org-växlare, språk, tema, användarmeny, ⌘K, `assistant-panel-slot`), `form/`, `states/`, `confirm-dialog`.
- `src/server/` – endast serverkod: `run-operation.ts`, `operations.ts` (registrering), `embed.ts`, `handlers.ts`, `session.ts`, `guard.ts`, `auth-pages.ts`, `load-error.ts`, `to-action-result.ts`.
- `src/lib/` – rena hjälpfunktioner (felmappning, formulärhjälp, rutter). Vitest-testade.
- `src/proxy.ts` – next-intl-routing (Next 16:s namn för middleware). `src/i18n/request.config.ts` är `*.config.ts` för att få default export.

## Dataåtkomst (en enda väg)
- Läsningar i server components: `runOperation({ operation, input })`. Kommandon: server action → `runOperation` → `toActionResult`. Anroparen kommer från `resolveExecuteContext({ headers: await headers() })` (samma som GraphQL/REST/MCP) och `execute` gör validering, behörighet, audit och sökindexering.
- Aldrig `@okazi/db`, egen `ExecuteContext` eller `fetch` mot `/api/graphql` i webben. Varför inte GraphQL: ADR 0010 (samma process, ingen cookie-vidarebefordran, typer direkt från Zod). GraphQL/REST finns för externa anropare.
- Fel: `Result` → `handleLoadError` (401 → login, 404 → not-found, annars `ErrorState`) eller `ActionResult` + `useActionSubmit` → `ErrorBanner`. AppError-kod → `errors.*` i `lib/error-key.ts`; Better Auth-fel i `lib/auth-error-key.ts`; Zod-fel i `lib/issue-message-key.ts`.
- Klientkomponenter får inte importera värden från `@okazi/core` (barrel drar in Prisma). Zod-scheman nås via alias `@core-schema/venue|room` (tsconfig `paths`, speglat i `vitest.config.ts`). Nytt alias per ny entitet.
- Formulär: `formSchema({ schema, toInput })` gör om råa strängvärden till coreschemats indata, `zodResolver` + `useZodMessages()` ger lokaliserade fel.

## Lägga till en sida/feature
1. Core-operation först (`packages/core`), sedan GraphQL/REST/MCP.
2. `src/features/<entitet>/actions.ts` (server actions) och `ui/` (lista = server component, formulär/dialog = client). Kopiera `venue/ui` och `room/ui`.
3. Sida: `src/app/[locale]/(app)/<route>/page.tsx` (tunn), nav i `components/shell/nav-items.ts`.
4. Lägg operationerna i `WEB_SURFACES` (eller `UI_EXEMPT` med skäl) i `features/web-surfaces.ts`.
5. Texter i `packages/i18n/messages/sv.json` och `en.json` (nyckelparitet testas).

## i18n
- All text via `useTranslations` / `getTranslations`; inga hårdkodade strängar eller färger. Länkar och router från `@okazi/i18n/navigation` (locale-medvetna), inte `next/link`.
- Server components och layouts anropar `setRequestLocale(locale)`; `locale` från params görs om med `resolveLocale`.
- Typade nycklar: `sv.json` är sanningen. Dynamiska nycklar måste vara unioner (se `ErrorKey`).

## Miljövariabler
Läses endast via `@okazi/config`: `DATABASE_URL`, `BETTER_AUTH_SECRET` (>= 32 tecken), `BETTER_AUTH_URL`, `WEB_URL`, `MCP_URL`, `SMTP_URL`, `MAIL_FROM`, `AI_GATEWAY_API_KEY` (valfri), `WEB_OAUTH_CLIENT_ID` (efter provisionering). `next.config.ts` och scripten läser repots rot-`.env` via `@next/env`. (Enda undantaget: `NEXT_RUNTIME` i `instrumentation.ts`, Nexts egen flagga.)

## Kommandon
- `pnpm --filter @okazi/web dev | build | start | typecheck | test`
- E2E: `docker compose up -d postgres`, `pnpm db:migrate`, `pnpm --filter @okazi/web build`, sedan `pnpm --filter @okazi/web test:e2e` med `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL=http://localhost:3000` satta. Använder förinstallerad Chromium (`/opt/pw-browsers/chromium`), kör aldrig `playwright install`.
- `pnpm --filter @okazi/web provision:oauth [--redirect-uri <url>]` – skapar/uppdaterar förstapartsklienten för assistenten (publik, PKCE, `skip_consent`, kopplad till MCP-resursen) och skriver ut `WEB_OAUTH_CLIENT_ID=...`. Lägg raden i `.env` för både web och mcp. Idempotent (hittar klienten på namn). Redirect-URI standard: `${WEB_URL}/api/assistant/oauth/callback`; AI-fasen bestämmer slutlig URL och kör om skriptet.

## Förlängningspunkter för AI-fasen (ADR 0007)
- `components/shell/assistant-panel-slot.tsx` – tom på varje sida i skalet. Montera assistentpanelen här.
- `components/shell/command-bar.tsx` + `command-groups.tsx` – ⌘K utan LLM (navigation, skapa anläggning, öppna/lägg rum i anläggning). Lägg naturligt språk som en egen grupp.
- `server/embed.ts` – platshållare (hash-embedding, modell `okazi-placeholder-hash-v1`). Byt mot AI SDK `embedMany` när `AI_GATEWAY_API_KEY` finns; rader taggas med modellnamn så de kan indexeras om.
- `features/web-surfaces.ts` – `UI_EXEMPT` listar conversation/message/skill-operationer tills UI finns. Ta bort posterna när sidorna byggs.
- `WEB_OAUTH_CLIENT_ID` + `x-okazi-actor: ai` hanteras av `packages/auth` (bara denna klient får agera som AI).
- `/login` och `/select-organization` fortsätter OAuth-flödet via `authClient.oauth2.continue({ postLogin: true })` när URL:en har signerad `sig`-query; `/oauth/consent` visar samtycke.

## Fallgropar
- `loading.tsx`/`error.tsx`/`not-found.tsx` är inte tillåtna default exports i Biome-konfigen: använd `// biome-ignore lint/style/noDefaultExport` (se `[locale]/error.tsx`).
- Auth-sidor som öppnas av OAuth (`sig` i query) får inte omdirigera inloggade användare (`login/page.tsx`).
- Magic link under pågående OAuth-flöde återvänder inte automatiskt till authorize (ej verifierat). Lösenord och OTP fortsätter flödet.
- Webbtypsnitt för `--font-serif` (Source Serif 4) laddas inte än; systemets serif används tills Claude Design-exporten finns.
