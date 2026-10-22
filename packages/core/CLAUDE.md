# @bibi/core – context for Claude

The parity core: every capability is defined **once** as an operation and then exposed the same way in web, GraphQL, REST and MCP (ADR 0003). Operations are the only way to read or change data.

## Operations
- `defineOperation({ name, kind, description, input, output, permission, handler, approval?, aiAllowed?, embeddable?, entityType? })`.
  - `name` = `<entity>.<verb>` (e.g. `venue.create`), stable across all surfaces. `description` is written for both humans and LLMs.
  - `input`/`output` are Zod schemas; `permission` = `<feature>:<action>`.
  - `handler({ input, context })` returns `Result` (`ok({ value })` / `err({ error: AppError })`), never throws strings.
  - Commands call `context.recordChange({ entityId, before, after })` for the audit row.
- Always run via `execute({ operation, input, context, afterCommit? })`: Zod validation → permission → handler → output validation → AuditLog (commands, same transaction) → `afterCommit` hooks.
- Calls to the outside world (a payment provider, mail to a customer) go in the operation's `external({ input, output, context })`, never in `handler`: `execute` runs it only after the commit, and a change preview, dry run or nested run never does. A failure leaves the record in a failure state and is returned. Why: ADR 0058.
- `execute` logs exactly one line per call: `operation.completed|rejected|failed`. Failed `afterCommit` hooks are logged as `operation.afterCommitFailed`; the indexing hook never throws and logs `search.index_failed`, so the command result is unchanged (ADR 0030, 0014).
- `context.db` is `scopedDb`: org scoping cannot be bypassed. Build the context with `createExecuteContext({ organizationId, actor, roles, permissions })`. `permissions` is resolved by `packages/auth`; `roles` are names for display only.
- AI actor: commands require human approval by default (`approval: true`, `requiresApproval`). `aiAllowed: false` means the AI actor may never run the operation (`authorize` refuses it, also after approval; MCP hides the tool). `Actor.approvedBy` is set only by the approval flow. Conversation bookkeeping uses `approval: false`.
- `context.credential` (`session`, `accessToken`, `apiKey`) is set by `packages/auth`. `apiKey.create` requires `session` and refuses the AI actor (the secret must not enter a chat). An API key caller has `actor = { type: "apiKey", userId: null, apiKeyId }` and cannot run `self:*` operations.
- Client-safe subpackage `@bibi/core/schemas` (`src/schemas.ts`): only zod files. Import it in client code and in `@bibi/ai/ui`; add one line per new entity's `schema.ts`. Never Prisma, fs or operations in it.
- Adapters generate tools and endpoints from the registry (`registerOperations`, `listOperations`, `getOperation`).
- `seedSystemSkills` and `seedDemo` are imported from `@bibi/core/seed` and `@bibi/core/seed/demo`, never from the index: they read files and must not end up in the web bundle.

## Errors
- `AppError` codes: `NOT_FOUND | FORBIDDEN | UNAUTHENTICATED | VALIDATION | CONFLICT | INTERNAL | UNAVAILABLE` (503: the feature lacks configuration, e.g. an AI model). Build them with `shared/errors.ts` (`notFound`, `conflict`, `invalid`).
- Surfaces map with `toHttpStatus`, `toGraphqlExtensions`, `toMcpError`; no custom mappings.
- Data other users own returns `NOT_FOUND`, not `FORBIDDEN`, so existence does not leak.

## Feature folders (`src/features/<entity>/`)
- Fixed filenames: `schema.ts`, `operations.ts`, `embeddable.ts`. Adapters (`graphql.ts`, `rest.ts`, `mcp.ts`, `ui/`) are added by their surface. New entity: `pnpm gen entity`.
- Archiving = soft delete (`status: ARCHIVED`), never hard delete.
- Pagination: `shared/page-input.ts`.

## Permissions (ADR 0034, 0050)
- A permission is `<feature>:<action>`. Features and actions: `FEATURE_SPECS` (`permissions/features.ts`); actions are `read|write|delete`, `write` and `delete` imply `read`. The owner feature of every entity type is `ENTITY_FEATURE` (`permissions/entity-features.ts`).
- Roles are fixed presets (`member < manager < admin`, `permissions/fixed-roles.ts`, `PRESET_PERMISSIONS` in `permissions/presets.ts`). Admins add per-member and per-API-key allow/deny overrides (`PermissionOverride`, `applyOverrides`, `permission.get|update`). Denying `read` hides the feature. Locked features (`member`, `apiKey`, `paymentAccount`, every action but `read`) come only from the `admin` preset.
- `self` (own conversations, skills, preferences, settings, connected apps) is always on and is not a feature: `self:read|write`. The system actor gets `FORBIDDEN` on user-scoped data.
- Anti-escalation (`features/member/role-access.ts`, by rank): nobody gives a role above their own or changes a member above them. The organization always keeps one admin (`checkAdminKept`, also for system). `parseMemberRole` turns an unknown stored role into `null`, which grants nothing.
- Adding a permission: see "Adding a permission" in `packages/auth/CLAUDE.md`.

## Feature scope: no cross-feature data (ADR 0050)
- An operation returns only data of its own feature. Another feature's record is an id, resolved through that feature's own operation.
- Inputs that reference another feature's id are checked with `checkReadable(<feature>:read)`. Errors never describe records the caller cannot view.
- Snapshots copied from another feature need its `read` at copy time. Audit, search text and approval previews only show what the caller may view.
- If a feature needs another feature's data in its output, the scope is wrong: fix the scope.

## Configurable domain (ADR 0021, 0026, 0059)
- No domain words in code. Base entities and capabilities: `features/entity-type/capability-kinds.ts`. Field kinds: `features/field-definition/field-kinds.ts`.
- Field values live in `Item.fields` (JSON) under the field's `key`; `buildFieldsSchema({ specs })` (client-safe) validates them.
- "Data exists → `CONFLICT`" is enforced in `entity-type/capabilities.ts`, `field-definition/field-rules.ts` and in the archiving operations.
- `BUNDLE` parts (`ItemPart`) are replaced as a set via `parts`; `item/part-graph.ts` rejects cycles and more than 5 levels. Capabilities, demands and buffers are accepted but only partly built: plan and issues in `docs/plans/type-capabilities-and-resources.md`.
- Setup and teardown buffers (ADR 0059): derive effective minutes only with `effectiveBuffers` (`shared/buffers.ts`); `sync_line_occupancy.sql` applies the same rule to holds, so change both together.
- Pool targets (ADR 0059): free units and the prepick are derived on read (name then id order, soft holds do not take a unit) from `poolUnitsWhere` and `takenIn` (`item/pool-free-units.ts`), shared by `item.freeUnits` and allocations. Demands store the selector (`PoolTargetShape`; tags as `ItemDemandTag` rows).
- Demands and allocations (ADR 0059): only `syncAllocations` (`line-allocation/sync-allocations.ts`) creates, fills and archives a line's `LineAllocation` slots; call it after any change to a line's item, time or status, or to a demand (`resyncDemandLines`). A mandatory demand is met only when a unit is allocated (`CONFLICT` naming the pool and windows); the prepick also checks the unit's own mandatory demands (`chainShortfall`). Never write allocation holds: the trigger does.
- Templates are data (`templates/vocabularies/`, `templates/configuration/`) imported through the shared insert helpers; imports are idempotent (existing names are skipped).

## Assignments and responsibilities (ADR 0034, 0055, 0056)
- Assignment rows store only explicit choices. Applicable responsibilities, default assignees and default followers are derived on read (`deriveAssignment`). Never create or archive rows when lines change.
- Rows reference the subject's `Record` (`recordId`, composite FK) while the API keeps `subjectType`/`subjectId`.
- Id lists on responsibilities and sheet definitions are join rows: read and write them through the `*-rows.ts` helpers, never as JSON.

## Platform operations (ADR 0015)
- `src/platform/`: `definePlatformOperation` and `executePlatform` with a `PlatformContext` built only by `resolvePlatformContext` in auth. Same chain as `execute`; handlers see only `PlatformDb`. They are **not** registered in the org registry and not in GraphQL, REST or MCP.
- `resolveAiModel({ feature })` returns the admin's choice (cached 30 s). No default: unchosen → `UNAVAILABLE` and `ai.modelNotConfigured`. New AI feature: an entry in `AI_FEATURES`, `resolveAiModel` where it runs, texts in `admin.aiModels.features`.

## AI data layer
- Conversations are private to `ownerUserId`; an admin (`assistant:read`) and the system actor may read all, only the owner renames and appends. Rule in `features/conversation/access.ts`.
- `message.append`: `parts` are AI SDK `UIMessage` parts stored as is (max 256 kB); the AI actor may only append `ASSISTANT`/`TOOL` in its own conversation.
- Skills: SYSTEM is read-only, ORGANIZATION requires admin, PERSONAL only the owner (`features/skill/access.ts`). SYSTEM skills are English markdown in `src/skills/system/`, seeded with `pnpm --filter @bibi/core seed:skills`.

## Search
- A searchable entity implements `Embeddable` and is registered in `search/embeddables.ts`. `embed` is injected by the app; core has no AI SDK dependency.
- `search` filters each hit through `load({ ids, db, viewer })`, so archived rows and things the user may not see are removed. `load` without `viewer` is for the indexer.

## Demo data
- `seedDemo()` in `src/seed/demo/`, CLI `seed:demo`; the spec is `docs/demo-seed.md`. Everything goes through `execute` as SYSTEM, except the Better Auth rows. Checks are in `checks.ts` and `config-checks.ts`.

## Tests
- Vitest against a real Postgres (`docker compose up -d postgres`, `pnpm db:migrate`), no mocks. Each test creates its own org via `testContext()`; tests that create members need a real organization (`testOrg()` in `test/org-helpers.ts`). `testContext({ role })` resolves permissions from the preset; pass `permissions` to test overrides. Deterministic `fakeEmbed` in `test/fake-embed.ts`.
