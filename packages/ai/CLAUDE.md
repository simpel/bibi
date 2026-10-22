# @bibi/ai – context for Claude

The server layer for the assistant (ADR 0007, 0008). Framework-independent: Web `Request` → `Response`, mounted in Next routes by the web app. Vercel AI SDK `ai` 7.0.138 and `@ai-sdk/mcp` 2.0.74 (v7: `instructions` instead of `system`, `isStepCount`, `toUIMessageStream({ stream })`, `onEnd`). Security-critical: changes are reviewed at Opus level.

## The flow (one chat turn, `createChatHandler`)
1. `resolveContext({ headers })` (web: `resolveExecuteContext`) → must be a **user** (AI actor → 403, not signed in → 401).
2. Body (Zod `ChatRequestSchema`): only the **last** message (the user's text) is used. Earlier turns are read from the database (`message.list` as the user), so the client cannot forge history.
3. Conversation: `conversation.get` or `conversation.create` (title = first line, max 80 characters) via core `execute` as the user.
4. Token: `getFirstPartyAccessToken({ client: "assistant" })` from `@bibi/auth` (token for the user, active org, `azp` = the web client).
5. MCP client against `${MCP_URL}/mcp` with `Authorization: Bearer`, `x-bibi-actor: ai`, `x-bibi-conversation-id`. Tools = `tools/list` for the AI actor (+ local `skill_search`/`load_skill`). `approval_confirm` is never visible (the server hides it, and it is filtered again here).
6. The USER message is saved with core `message.append` as the user.
7. `streamText` (limits: 8 steps, 4096 tokens, 120 s total/60 s per step; `ASSISTANT_LIMITS`) → UI message stream (SSE).
8. When the stream ends (also on error/abort: a copy is drained): the ASSISTANT message is saved via MCP `message_append` as the AI actor (audit `AI` + conversation), then the MCP client is **always** closed.

## Trust boundaries
- The model cannot approve itself: commands from the AI actor become `approval_required`. Only `createApprovalHandler`/`confirmApproval` call `approval_confirm`, with the user's token and **without** AI headers, after the user's click. AuditLog: `actorType=AI`, `approvedBy=<the user>`.
- Token minting lives in `@bibi/auth` (`src/first-party/`, see its CLAUDE.md). The session cookie already grants everything the token can; the token only gives the AI mode (more limited).
- Skills are data: `load_skill` can only **narrow** the tools (`allowedTools` ∩ the user's tools ∩ the previous skill; empty list = no extra restriction). Applies to both `activeTools` per step and a guard in `execute`.
- Page context and skill texts are JSON-encoded in the prompt (they cannot add rules).

## Contract for the web phase
- Routes (as the web app mounts them): `app/api/chat/route.ts` → `export const POST = createChatHandler({ resolveContext: resolveExecuteContext })` and `app/api/assistant/approval/route.ts` → `createApprovalHandler({ resolveContext: resolveExecuteContext })`. `runtime = "nodejs"`.
- Chat request: `useChat` with `DefaultChatTransport({ api, body: { conversationId, pageContext: { route, locale: "sv"|"en", entity?: { type, id } } } })`. Response: SSE (`x-vercel-ai-ui-message-stream: v1`), header `x-bibi-conversation-id`, plus a transient data part `data-bibi-conversation` `{ conversationId, created }`. Errors before the stream: JSON `{ error: { code, message, issues } }` with status 400/401/403/404/500.
- Approval cards: `extractPendingApprovals({ message })` (client-safe: `@bibi/ai/approvals`) → `{ toolCallId, toolName, operation, input, summary, approvalToken, expiresAt }[]`. Buttons POST `{ decision: "approve"|"reject", approvalToken, conversationId, toolCallId, operation }` → `{ status: "approved", result }` / `{ status: "rejected" }` / error (409 = already used, 403 = invalid/expired/other user). The decision is saved as a TOOL message (`Approval update: …` + `data-bibi-approval`), so the next turn knows the outcome.
- Generative UI: `resolveToolUi({ toolName, output })` (client-safe: `@bibi/ai/ui`) → `{ component, props }` (`ToolUi`, discriminated union). Component keys are `UiComponent` in `src/ui-contract/tool-ui-types.ts`. Types may be imported from `@bibi/ai` (`import type`), values in client code only from `/ui` and `/approvals`.
- ⌘K: the same chat handler, a new conversation per question (do not send a `conversationId`).
- The web app's placeholder embedding (`server/embed.ts`) is replaced by `createEmbed()` from `@bibi/ai/embed` (the same model id `bibi-placeholder-hash-v1` without a key).

## Adding a generative UI mapping
1. New operation → the parity test `test/ui-contract.test.ts` fails until the tool is in `TOOL_UI_REGISTRY` (`ui-contract/tool-ui-registry.ts`) or in `GENERIC_UI_TOOLS` (with a reason).
2. New component: key + props in `ToolUiProps` (`tool-ui-types.ts`), wire schema in `wire-schemas.ts`. It is derived from `@bibi/core/schemas` (`Schema.extend({ createdAt: z.string(), ... })`, never the core barrel: it pulls in Prisma), so core fields follow automatically and no hand copy has to be kept in sync.
3. Build the React component in the web app with `@bibi/ui`.

## Embeddings
- `createEmbed()` = core `EmbedFn` via `embedMany` + AI Gateway with the model chosen in `/admin/ai-models` (`search.embedding`, no default: unchosen → `UNAVAILABLE`), batches of 96, `dimensions: 1536`, Zod check of the response (wrong number of dimensions → a clear `INTERNAL` error). Without `AI_GATEWAY_API_KEY`: a deterministic placeholder (warns once) if `NODE_ENV !== "production"`, otherwise an error. `isPlaceholderEmbed({ embed })`.
- Wired in `apps/mcp/src/embed.ts`. Changing model: `pnpm --filter @bibi/ai reindex [--org <id>]` (`reindexAll`) re-embeds rows with a different `model` from stored text and indexes entities whose row is missing or out of date (content hash), e.g. after `search.index_failed` (ADR 0030).

## Models
- No models in env (a superadmin chooses them in `/admin/ai-models`). New AI feature: an entry in `AI_FEATURES` (core), `resolveAiModel({ feature })` where it runs, texts in `admin.aiModels.features`. Chat (`assistant.chat`) and embeddings (`search.embedding`) use what a superadmin chose (`resolveAiModel`, ADR 0015). Unchosen model → `UNAVAILABLE` (503) and `ai.modelNotConfigured` at error level. Errors in the stream (e.g. an unknown model at the gateway) are logged as `ai.streamFailed`.
- `createChatHandler({ model })` and `createEmbed({ model })` are test/E2E seams only.

## Tests
Vitest against a real Postgres, mocked model (`MockLanguageModelV4`, `MockEmbeddingModelV4`), no network calls. apps/mcp is started in-process via a path import (`test/helpers/mcp-server.ts`): a package dependency would create a cycle (`apps/mcp` depends on `@bibi/ai/embed`).
