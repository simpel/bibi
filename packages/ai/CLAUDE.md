# @okazi/ai – kontext för Claude

Serverlagret för assistenten (ADR 0007, 0008). Ramverksoberoende: Web `Request` → `Response`, monteras i Next-rutter av webben. Vercel AI SDK `ai` 7.0.138 och `@ai-sdk/mcp` 2.0.74 (v7: `instructions` i stället för `system`, `isStepCount`, `toUIMessageStream({ stream })`, `onEnd`). Säkerhetskritiskt: ändringar granskas på Opus-nivå.

## Flödet (en chattur, `createChatHandler`)
1. `resolveContext({ headers })` (webben: `resolveExecuteContext`) → måste vara en **användare** (AI-aktör → 403, ingen inloggning → 401).
2. Body (Zod `ChatRequestSchema`): bara **sista** meddelandet (användarens text) används. Tidigare turer läses från databasen (`message.list` som användaren), så klienten kan inte förfalska historik.
3. Konversation: `conversation.get` eller `conversation.create` (titel = första raden, max 80 tecken) via core `execute` som användaren.
4. Token: `getFirstPartyAccessToken({ client: "assistant" })` från `@okazi/auth` (token åt användaren, aktiv org, `azp` = webbklienten).
5. MCP-klient mot `${MCP_URL}/mcp` med `Authorization: Bearer`, `x-okazi-actor: ai`, `x-okazi-conversation-id`. Verktyg = `tools/list` för AI-aktören (+ lokala `skill_search`/`load_skill`). `approval_confirm` syns aldrig (servern döljer det, och det filtreras igen här).
6. USER-meddelandet sparas med core `message.append` som användaren.
7. `streamText` (gräns: 8 steg, 4096 tokens, 120 s totalt/60 s per steg; `ASSISTANT_LIMITS`) → UI message stream (SSE).
8. När strömmen slutar (även vid fel/avbrott: en kopia dräneras): ASSISTANT-meddelandet sparas via MCP `message_append` som AI-aktören (audit `AI` + konversation), sedan stängs MCP-klienten **alltid**.

## Förtroendegränser
- Modellen kan inte godkänna sig själv: kommandon från AI-aktören blir `approval_required`. Bara `createApprovalHandler`/`confirmApproval` anropar `approval_confirm`, med användarens token och **utan** AI-headrar, efter användarens klick. AuditLog: `actorType=AI`, `approvedBy=<användaren>`.
- Token-minting ligger i `@okazi/auth` (`src/first-party/`, se dess CLAUDE.md). Sessionscookien ger redan allt token kan; token ger bara AI-läget (mer begränsat).
- Skills är data: `load_skill` kan bara **smalna av** verktygen (`allowedTools` ∩ användarens verktyg ∩ tidigare skill; tom lista = ingen extra begränsning). Gäller både `activeTools` per steg och en vakt i `execute`.
- Sidkontext och skill-texter JSON-kodas i prompten (kan inte lägga till regler).

## Kontrakt för webbfasen
- Rutter (som webben monterar dem): `app/api/chat/route.ts` → `export const POST = createChatHandler({ resolveContext: resolveExecuteContext })` och `app/api/assistant/approval/route.ts` → `createApprovalHandler({ resolveContext: resolveExecuteContext })`. `runtime = "nodejs"`.
- Chat-request: `useChat` med `DefaultChatTransport({ api, body: { conversationId, pageContext: { route, locale: "sv"|"en", entity?: { type, id } } } })`. Svar: SSE (`x-vercel-ai-ui-message-stream: v1`), header `x-okazi-conversation-id`, plus transient datadel `data-okazi-conversation` `{ conversationId, created }`. Fel före strömmen: JSON `{ error: { code, message, issues } }` med status 400/401/403/404/500.
- Godkännandekort: `extractPendingApprovals({ message })` (klientsäker: `@okazi/ai/approvals`) → `{ toolCallId, toolName, operation, input, summary, approvalToken, expiresAt }[]`. Knappar POST:ar `{ decision: "approve"|"reject", approvalToken, conversationId, toolCallId, operation }` → `{ status: "approved", result }` / `{ status: "rejected" }` / fel (409 = redan använd, 403 = ogiltig/utgången/annan användare). Beslutet sparas som TOOL-meddelande (`Approval update: …` + `data-okazi-approval`), så nästa tur vet utfallet.
- Generative UI: `resolveToolUi({ toolName, output })` (klientsäker: `@okazi/ai/ui`) → `{ component, props }` (`ToolUi`, discriminated union). Komponentnycklar: `venue-table|venue-card|item-table|item-card|entity-type-table|entity-type-card|field-definition-table|field-definition-card|vocabulary-table|vocabulary-card|setup-table|setup-card|search-results|skill-table|skill-card|approval-card|error|json`. Typer får importeras från `@okazi/ai` (`import type`), värden i klientkod bara från `/ui` och `/approvals`.
- ⌘K: samma chat-handler, ny konversation per fråga (skicka inget `conversationId`).
- Webbens platshållar-embedding (`server/embed.ts`) ersätts med `createEmbed()` från `@okazi/ai/embed` (samma modell-id `okazi-placeholder-hash-v1` utan nyckel).

## Lägga till en generative-UI-mappning
1. Ny operation → paritetstestet `test/ui-contract.test.ts` fallerar tills verktyget finns i `TOOL_UI_REGISTRY` (`ui-contract/tool-ui-registry.ts`) eller i `GENERIC_UI_TOOLS` (med skäl).
2. Ny komponent: nyckel + props i `ToolUiProps` (`tool-ui-types.ts`), wire-schema i `wire-schemas.ts`. Det härleds ur `@okazi/core/schemas` (`Schema.extend({ createdAt: z.string(), ... })`, aldrig core-barrel: den drar in Prisma), så core-fält följer med automatiskt och ingen handkopia behöver hållas i takt.
3. Bygg React-komponenten i webben med `@okazi/ui`.

## Inbäddningar
- `createEmbed()` = core `EmbedFn` via `embedMany` + AI Gateway med modellen vald i `/admin/ai-models` (`search.embedding`, ingen standard: ovald → `UNAVAILABLE`), batchar om 96, `dimensions: 1536`, Zod-kontroll av svaret (fel antal dimensioner → tydligt `INTERNAL`-fel). Utan `AI_GATEWAY_API_KEY`: deterministisk platshållare (varnar en gång) om `NODE_ENV !== "production"`, annars fel. `isPlaceholderEmbed({ embed })`.
- Kopplad i `apps/mcp/src/embed.ts`. Byte av modell: `pnpm --filter @okazi/ai reindex [--org <id>]` (`reindexAll`) bäddar om rader med annat `model` från lagrad text och indexerar entiteter som saknar rad.

## Modeller
- Inga modeller i env. Chatt (`assistant.chat`) och embeddings (`search.embedding`) använder det en plattformsadmin valt (`resolveAiModel`, ADR 0015). Ovald modell → `UNAVAILABLE` (503) och `ai.modelNotConfigured` på error-nivå. Fel i strömmen (t.ex. okänd modell hos gatewayen) loggas som `ai.streamFailed`.
- `createChatHandler({ model })` och `createEmbed({ model })` är bara test-/E2E-sömmar.

## Miljövariabler (via `@okazi/config`)
`AI_GATEWAY_API_KEY`, `MCP_URL`, `WEB_URL`, `WEB_OAUTH_CLIENT_ID`, `NODE_ENV` (ny, i env-schemat och `turbo.json`).

## Tester
Vitest mot riktig Postgres, mockad modell (`MockLanguageModelV4`, `MockEmbeddingModelV4`), inga nätverksanrop. apps/mcp startas i processen via sökvägsimport (`test/helpers/mcp-server.ts`): ett paketberoende skulle ge en cykel (`apps/mcp` beror på `@okazi/ai/embed`).
