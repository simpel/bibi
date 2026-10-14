# @okazi/web – kontext för Claude

Next.js 16 (App Router, Turbopack), React 19, next-intl 4, Better Auth-klient, `@okazi/ui`. Ytan för personal i venues. Se ADR 0003, 0005, 0007, 0009 och 0010.

## Struktur
- `src/app/[locale]/` – sidor (`(auth)` = login, sign-up, select-organization, oauth/consent, accept-invitation/[id]; `(app)` = skyddat skal med sidomeny och `venues`). `page.tsx`/`layout.tsx`/`route.ts` är tunna: de läser params och renderar en feature.
- `src/app/[locale]/(app)/skills` (`page`, `new`, `[id]`, `[id]/edit`) – Färdigheter-sektionen.
- `src/app/api/auth/[...all]` (Better Auth), `api/graphql`, `api/v1/[...path]` (REST + OpenAPI), `api/chat` (assistentens tur, `createChatHandler`), `api/assistant/approval` (godkännandekortets POST, `createApprovalHandler`), `.well-known/oauth-authorization-server` och `oauth-protected-resource` (discovery för MCP/OAuth, vidarebefordras till Better Auth). Chatt- och godkännanderutterna har `runtime = "nodejs"`, `dynamic = "force-dynamic"` och `maxDuration`.
- `src/features/<entitet>/ui/` – komponenter per entitet (fasta namn `venue`, `room`, `skill`; `auth/ui` för inloggning; `assistant/` se nedan). `actions.ts` bredvid `ui/` = server actions. `web-surfaces.ts` = vilka operationer som har UI (`route` eller `route: "*"` + `component` för UI i skalet, t.ex. assistentpanelen; `UI_EXEMPT` är tom).
- `src/components/` – app-nivå: `shell/` (sidomeny, org-växlare, språk, tema, användarmeny, ⌘K inkl. "Fråga assistenten"), `form/`, `states/`, `confirm-dialog`, `markdown-view` (säker markdown utan rå HTML, parser i `lib/markdown/`).
- `src/server/` – endast serverkod: `run-operation.ts`, `operations.ts` (registrering), `embed.ts` (`createEmbed` från `@okazi/ai/embed`), `handlers.ts` (GraphQL/REST), `assistant-handlers.ts` (chatt + godkännande), `e2e-mock-model.ts` (endast E2E, se nedan), `caller-abilities.ts`, `session.ts`, `guard.ts`, `auth-pages.ts`, `load-error.ts`, `to-action-result.ts`.
- `src/lib/` – rena hjälpfunktioner (felmappning, formulärhjälp, rutter). Vitest-testade.
- `src/proxy.ts` – next-intl-routing (Next 16:s namn för middleware). `src/i18n/request.config.ts` är `*.config.ts` för att få default export.

## Dataåtkomst (en enda väg)
- Läsningar i server components: `runOperation({ operation, input })`. Kommandon: server action → `runOperation` → `toActionResult`. Anroparen kommer från `resolveExecuteContext({ headers: await headers() })` (samma som GraphQL/REST/MCP) och `execute` gör validering, behörighet, audit och sökindexering.
- Aldrig `@okazi/db`, egen `ExecuteContext` eller `fetch` mot `/api/graphql` i webben. Varför inte GraphQL: ADR 0010 (samma process, ingen cookie-vidarebefordran, typer direkt från Zod). GraphQL/REST finns för externa anropare.
- Fel: `Result` → `handleLoadError` (401 → login, 404 → not-found, annars `ErrorState`) eller `ActionResult` + `useActionSubmit` → `ErrorBanner`. AppError-kod → `errors.*` i `lib/error-key.ts`; Better Auth-fel i `lib/auth-error-key.ts`; Zod-fel i `lib/issue-message-key.ts`.
- Klientkomponenter får inte importera värden från `@okazi/core` (barrel drar in Prisma). Zod-scheman nås via `@okazi/core/schemas` (barrel med bara Zod-filerna; ny entitet = en rad i `packages/core/src/schemas.ts`). `import type` från `@okazi/core` är fritt.
- Assistenten går **inte** via `runOperation`: `/api/chat` kör MCP-klienten mot `apps/mcp` som användaren (ADR 0007). Det är `runOperation` som sköter webbens egna sidor, konversationshistoriken (server actions i `features/assistant/actions.ts`) och Färdigheter.
- Formulär: se "Formulär" i rot-`CLAUDE.md` (shadcn `Form`, server action, `useFormAction` med toasts). `formSchema({ schema, toInput })` gör om råa strängvärden till coreschemats indata, `zodResolver` + `useZodMessages()` ger lokaliserade fel.

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
Läses endast via `@okazi/config`: `DATABASE_URL`, `BETTER_AUTH_SECRET` (>= 32 tecken), `BETTER_AUTH_URL`, `WEB_URL`, `MCP_URL`, `SMTP_URL`, `MAIL_FROM`, `AI_GATEWAY_API_KEY` (valfri; utan den kan assistenten inte svara; modellerna väljs i `/admin/ai-models`), `WEB_OAUTH_CLIENT_ID` (efter provisionering; samma värde i `.env` för webb och MCP), `E2E_MOCK_MODEL` (endast E2E, ignoreras i produktion), `NODE_ENV`. `next.config.ts` och scripten läser repots rot-`.env` via `@next/env`. (Enda undantaget: `NEXT_RUNTIME` i `instrumentation.ts`, Nexts egen flagga.)

## Kommandon
- `pnpm --filter @okazi/web dev | build | start | typecheck | test`
- Första gången: `docker compose up -d postgres`, `pnpm db:migrate`, `pnpm --filter @okazi/core seed:skills`, `pnpm --filter @okazi/web provision:oauth` (skriver ut `WEB_OAUTH_CLIENT_ID=...`).
- `pnpm --filter @okazi/web provision:oauth [--redirect-uri <url>]` – skapar/uppdaterar förstapartsklienten för assistenten (publik, PKCE, `skip_consent`, kopplad till MCP-resursen). Idempotent (hittar klienten på namn). Redirect-URI är `${WEB_URL}/api/assistant/oauth/callback`, men den följs aldrig: `getFirstPartyAccessToken` kör authorization code + PKCE i processen och läser koden ur authorize-svaret, så **ingen callback-rutt finns eller behövs**. URI:n måste bara vara registrerad.
- E2E (Playwright, förinstallerad Chromium `/opt/pw-browsers/chromium`, kör aldrig `playwright install`): bygg `pnpm --filter @okazi/mcp build` och `pnpm --filter @okazi/web build`, sätt `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL=http://localhost:3000` och `WEB_OAUTH_CLIENT_ID`, kör sedan `pnpm --filter @okazi/web test:e2e`. `playwright.config.ts` startar MCP (`node ../mcp/dist/http.js`, :3001) och webben (`pnpm start`, :3000) med `E2E_MOCK_MODEL=1` och `NODE_ENV=test` (`next start` annars sätter `production`, där flaggan ignoreras). Redan körande servrar återanvänds. Portarna kommer från `WEB_URL`/`MCP_URL` i rot-`.env` (standard 3000/3001; Superset-worktrees får egna portar och egen databas via `.superset/setup.sh`, och `dev`/`start` läser `WEB_PORT`). `E2E_SCREENSHOTS_DIR=<mapp>` aktiverar `e2e/screenshots.spec.ts` (ljust/mörkt, desktop/mobil).

## Assistenten (ADR 0007, 0008)
- `features/assistant/` – `state/` (kontext och hooks: `AssistantProvider` i skalet håller EN `useChat` för panelen, ⌘K och knappen; `chat-transport.ts` = `DefaultChatTransport` mot `/api/chat` som bara skickar sista meddelandet + `pageContext` från `usePathname`), `lib/` (rena hjälpfunktioner med tester: sidkontext, felmappning, lagrade meddelanden → `useChat`), `ui/` (panel, chatt, historik, composer), `ui/generative/` (generativ UI), `actions.ts` (lista/öppna/byt namn/arkivera konversationer via `runOperation`).
- Panelen: dockad och storleksändringsbar från `md`, `Sheet` på mobil, `⌘J`/`Ctrl+J`, knapp i toppraden. Bredden sparas i localStorage (med try/catch). Konversations-id kommer från dataparten `data-okazi-conversation` (och headern `x-okazi-conversation-id`). Fel före strömmen är JSON `{ error: { code } }` och mappas till `errors.*`.
- Generativ UI: `resolveToolUi` (`@okazi/ai/ui`) ger `{ component, props }`; `ui/generative/components.ts` är `{ [K in UiComponent]: ComponentType<GenerativeProps<K>> }` (kompileringstidsutömmande, plus test mot `UI_COMPONENTS`). Ny nyckel i `@okazi/ai` ⇒ typfel här tills komponenten finns. Alla kort byggs av `@okazi/ui`; länkar går till riktiga sidor (`venueRoute`, `skillRoute`).
- Godkännandekort (`ui/generative/approval/`): `extractPendingApprovals` ger kort per tool call. Godkänn/Avslå POST:ar `{ decision, approvalToken, conversationId?, toolCallId?, operation }` till `/api/assistant/approval`; 409 = redan använd, 403 = ogiltig/utgången, 401 = utloggad, nätverksfel kan försökas igen. Efter godkännande visas resultatet via `ToolResultView`, toast och `router.refresh()`. Klienten lägger inget i chatten: servern sparade ett TOOL-meddelande och nästa tur läser historiken ur databasen. Sparade beslut återställs vid öppning av en konversation (`stored-messages.ts`).
- ⌘K: `command-bar.tsx` + `ask-assistant-group.tsx`. Fri text + Enter anropar `ask({ text })`: ny konversation (inget `conversationId`), panelen öppnas och strömmar svaret.
- Endast E2E: `E2E_MOCK_MODEL=1` (och `NODE_ENV` ≠ `production`, se `server/mock-model-policy.ts`) gör att `assistant-handlers.ts` dynamiskt importerar `server/e2e-mock-model.ts` (`MockLanguageModelV4` från `ai/test`): "create venue <namn>" → `venue_create`, "list venues" → `venue_list`, "list skills" → `skill_list`.
- `WEB_OAUTH_CLIENT_ID` + `x-okazi-actor: ai` hanteras av `packages/auth` (bara denna klient får agera som AI).
- `/login` och `/select-organization` fortsätter OAuth-flödet via `authClient.oauth2.continue({ postLogin: true })` när URL:en har signerad `sig`-query; `/oauth/consent` visar samtycke.

## Färdigheter (skills)
- `features/skill/` – lista (`?scope=&status=&q=&semantic=1&cursor=`: `skill.list`, eller core `search` för sökning på betydelse), detalj (renderade instruktioner, verktyg, resurser, version), formulär (react-hook-form + `SkillCreateInputSchema` via `@okazi/core/schemas`), publicera, arkivera, dela (personlig → organisation, bara admin: knappen visas via `server/caller-abilities.ts`, operationen kontrollerar ändå), exportera (`skill.export` → `.md`-nedladdning) och importera (fil eller inklistrad SKILL.md). `skill-abilities.ts` är enda platsen för vilka knappar som visas.

## Plattformsadmin (ADR 0015)
- `src/app/[locale]/(admin)/admin/` (`logs`, `ai-models`) med eget skal (`features/admin/ui/admin-shell.tsx`, shadcn-sidomeny). `server/platform-guard.ts`: anonym → login, annars 404 om inte plattformsadmin.
- Data: `runPlatformOperation` (`server/run-platform-operation.ts`) med `platformOperations()` (gateway-katalogen injicerad). Aldrig `runOperation` för plattformsdata.
- AI-modeller: TanStack-tabell med en rad per AI-funktion. Varje rad har ett shadcn-formulär med en `Select` som bara visar *möjliga* modeller (`aiModel.list({ feature })`), med pris per 1M tokens. Valet sparas direkt via `useFormAction`. Embedding-funktionen kräver bekräftelse först.
- Loggvyn: URL:en är vyns tillstånd (`page`, `pageSize`, `level`, `q`, `requestId`, `surface`, `log`). Se `features/admin/logs/log-params.ts`.
- `"use client"` bara på öarna som serverkomponenter renderar (`admin-nav`, `log-table`, `log-filters`, `log-detail-sheet`, `ai-feature-table`). Barn och hooks ärver klientgränsen.

## Fallgropar
- `loading.tsx`/`error.tsx`/`not-found.tsx` är inte tillåtna default exports i Biome-konfigen: använd `// biome-ignore lint/style/noDefaultExport` (se `[locale]/error.tsx`).
- Auth-sidor som öppnas av OAuth (`sig` i query) får inte omdirigera inloggade användare (`login/page.tsx`).
- Magic link under pågående OAuth-flöde återvänder inte automatiskt till authorize (ej verifierat). Lösenord och OTP fortsätter flödet.
- Webbtypsnitt för `--font-serif` (Source Serif 4) laddas inte än; systemets serif används tills Claude Design-exporten finns.
