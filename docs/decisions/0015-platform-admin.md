# 0015 – Platform admin

- **Date:** 2026-10-14
- **Status:** Accepted

## Context
- Okazi needs a view for those of us who run the product: the system log (ADR 0014) and choice of AI model per AI feature.
- There are only organization roles (ADR 0004). An org admin is a customer and must never see other organizations' data.
- Logs and model choices are platform data, not tenant data. They have no `organizationId` to scope on.
- The system log went only to stdout. No log destination has been chosen (ADR 0013).

## Decision
- **Platform role via the Better Auth admin plugin.** `user.role = "admin"` makes someone a platform admin. All of the plugin's HTTP endpoints are disabled (`disabledPaths`): nobody can promote, forge or ban users through the web. Roles are set with `pnpm --filter @okazi/auth grant-admin <email> [--revoke]`, which writes an `AuditLog` row.
- **`resolvePlatformContext`** in `@okazi/auth` is the only way in. Session cookie only: API keys and OAuth tokens (and therefore the AI assistant) are denied. The role is read live from the database on every call. Banned users and impersonated sessions are denied.
- **Platform scope in core** (`packages/core/src/platform/`): `definePlatformOperation` and `executePlatform` with the same chain as `execute`: Zod in, permission, handler, Zod out, audit and log. Handlers see only the platform tables (`PlatformDb`). Commands are audited with `organizationId = PLATFORM_SCOPE` (`__platform__`), which `scopedDb` refuses.
- **Exception to 1:1 parity (ADR 0003).** Platform operations are not registered in the org registry and are exposed only in the web app (`/admin`). GraphQL, REST and MCP never see them. Reason: data across all organizations must not be reachable with API keys or by the AI. The exception applies only to `platform/`.
- **The system log is stored in Postgres** (`SystemLog`) in addition to stdout. A pino sink writes in batches (every 2 seconds or 200 rows), has an upper buffer limit and deletes rows older than `SYSTEM_LOG_RETENTION_DAYS` (default 30) once an hour. Indexed columns (time, level, event, requestId, org, user, operation) plus the whole row as JSON.
- **AI model per feature.** The registry `AI_FEATURES` (`assistant.chat`, `search.embedding`). `AiSetting` holds the admin's choice. **There are no default models and no model env variables:** a feature without a choice answers `UNAVAILABLE` (new error code, HTTP 503) and logs `ai.modelNotConfigured` at error level on every attempt. `resolveAiModel` reads the choice at runtime (cached 30 s per process). The model list is fetched from Vercel AI Gateway (`GET /v1/models`, cached 10 min). Only **possible** models are shown and accepted, according to `AI_FEATURES[].requires`:
  - chat requires the tag `tool-use`;
  - embeddings must give 1536 dimensions (the pgvector column). The catalog does not state dimensions, so each candidate is tried with a small embed call (cache: approved 24 h, rejected 10 min).
  - Batch variants and deprecated models are always removed.
  - The same list is used both in the UI and for validation in `aiFeature.update`. Prices (USD per 1M tokens) are shown per model.
- **Web:** `/admin` with a shadcn sidebar. Anyone other than platform admins gets 404. The log is shown in a TanStack table with server pagination. Filters and the selected row live in the URL, so links can be shared. Clicking a row shows all fields, raw JSON and "show the whole request". The model page is a TanStack table with one row per AI feature and a shadcn form (select) per row, which saves immediately with toasts.

## Consequences
- Changing the embedding model requires reindexing (`pnpm --filter @okazi/ai reindex`). The UI requires confirmation. Search does not filter on model, so results are misleading until reindexing is done.
- A new environment has no working AI until a platform admin has chosen models. This is intentional: model choice is a product decision and should be visible and audited, not hidden in env.
- A choice cannot be removed, only replaced (no "reset", since there is nothing to reset to).
- Errors from the gateway during a chat stream (for example a model that has been removed) are logged as `ai.streamFailed`.
- `SystemLog` grows with traffic. Retention is controlled with env. It should be replaced or complemented by an external destination when one is chosen (ADR 0013).
- The first platform admin is created by operations with the CLI. There is no UI yet for managing admins.
