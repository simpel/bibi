# 0015 – Superadmin

- **Date:** 2026-10-14
- **Status:** Accepted

## Context
- Those who run Bibi need a view of the system log and a way to choose the AI model per feature.
- Only organization roles exist (ADR 0004, 0034). An org admin is a customer and must never see other organizations' data.
- Logs and model choices are platform data with no `organizationId`.

## Decision
1. A platform role through the Better Auth admin plugin: `user.role = "superadmin"`. It is not an organization role. All of the plugin's HTTP endpoints are disabled, and roles are set only by a CLI that writes an `AuditLog` row.
2. `resolvePlatformContext` is the only way in. It accepts a session cookie only: API keys, OAuth tokens and therefore the assistant are denied. The role is read live on every call, and banned or impersonated sessions are denied.
3. Platform operations use their own scope (`definePlatformOperation`, `executePlatform`) with the same chain as `execute` and see only platform tables. Their audit rows use `organizationId = PLATFORM_SCOPE`, which `scopedDb` refuses.
4. Exception to 1:1 parity (ADR 0003): platform operations exist only in the web app's `/admin`. Data across all organizations must not be reachable with keys or by the AI. The exception covers only `packages/core/src/platform/`.
5. The system log is also stored in Postgres (`SystemLog`) with env-controlled retention.
6. The AI model per feature is a superadmin choice (`AiSetting`). There are no default models and no model env variables: a feature without a choice answers `UNAVAILABLE` (503). Only models that satisfy the feature's requirements are shown and accepted (chat needs tool use; embeddings must match the 1536-dimension vector column).

## Rejected
- Default models in env: model choice is a product decision and should be visible and audited.
- Exposing platform operations on the API or MCP: a leaked key would reach all tenants.
- A superadmin as a member of every organization: it blurs tenancy.

## Consequences
- Changing the embedding model requires a reindex, since search does not filter on model.
- A new environment has no working AI until a superadmin chooses models.
- `SystemLog` grows with traffic; an external destination may replace it (ADR 0013).
- The first superadmin is created by operations with the CLI.
