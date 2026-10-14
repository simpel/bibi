# @okazi/core – context for Claude

The parity core: every capability is defined **once** as an operation and then exposed the same way in web, GraphQL, REST and MCP.

## Operations
- `defineOperation({ name, kind, description, input, output, permission, handler, approval?, aiAllowed?, embeddable?, entityType? })`.
  - `name` = `<entity>.<verb>` (e.g. `venue.create`), stable across all surfaces. `description` is written for both humans and LLMs.
  - `input`/`output` are Zod schemas; `permission` = `<resource>:read|write|admin`.
  - `handler({ input, context })` returns `Result` (`ok({ value })` / `err({ error: AppError })`) – never throw strings.
  - Commands call `context.recordChange({ entityId, before, after })` for the audit row.
- Always run via `execute({ operation, input, context, afterCommit? })`: Zod validation → permission → handler → output validation → AuditLog (commands, in the same transaction) → `afterCommit` hooks (e.g. `createIndexingHook({ embed })`).
- `execute` logs exactly one line per call: `operation.completed` / `operation.rejected` (VALIDATION, FORBIDDEN, NOT_FOUND etc.) / `operation.failed` (INTERNAL, with cause). Failed `afterCommit` hooks are logged as `operation.afterCommitFailed`; the indexing hook never throws and logs `search.index_failed` instead, so the command result is unchanged (ADR 0030). The AuditLog row gets `requestId` and `surface` from the request context (`surface: system` outside a request). See ADR 0014.
- `context.db` is `scopedDb` – org scoping cannot be bypassed. Build the context with `createExecuteContext({ organizationId, actor, roles, permissions })`. `permissions` (`PermissionSet`) is resolved by `packages/auth`; `hasPermission({ permissions, permission })` looks up exactly. `roles` are names for display only.
- `requiresApproval({ operation, actor })`: commands require human approval when `actor.type === "ai"` (default `approval: true`).
- `aiAllowed: false` (default true): the AI actor may never run the operation. `authorize` refuses it (also after an approval) and MCP hides the tool from the AI actor, so the assistant cannot propose it. Used by `apiKey.create` (the secret must not enter a chat).
- `context.credential` (`session`, `accessToken`, `apiKey`) is set by `packages/auth`; absent for system and test contexts. `apiKey.create` requires `session` (ADR 0005).
- Client-safe subpackage `@okazi/core/schemas` (`src/schemas.ts`): only the zod files (`features/*/schema.ts`, `search/search-schema.ts`). Import it in client code and in `@okazi/ai/ui`; add one line per new entity's `schema.ts` there. Never Prisma/fs/operations in it.
- The registry: `registerOperations({ operations: createCoreOperations({ embed }) })`, `listOperations()`, `getOperation({ name })`. Adapters generate tools/endpoints from the registry.

## Platform operations (ADR 0015)
- `src/platform/`: `definePlatformOperation` and `executePlatform({ operation, input, context })` with `PlatformContext` (`createPlatformContext`, built only by `resolvePlatformContext` in auth). The same chain as `execute`. Audit with `PLATFORM_SCOPE`. Handlers see only `PlatformDb` (`systemLog`, `aiSetting`).
- `createPlatformOperations({ listModels })`: `systemLog.list/get`, `aiFeature.list/update`, `aiModel.list`. **Not** registered in the org registry. Not in GraphQL, REST or MCP.
- `resolveAiModel({ feature })` → `Result<string>`: the admin's choice (cache 30 s). No default: unchosen → `UNAVAILABLE` and `ai.modelNotConfigured` (error). `AI_FEATURES` is the registry.

## Errors
- `AppError` with codes `NOT_FOUND | FORBIDDEN | UNAUTHENTICATED | VALIDATION | CONFLICT | INTERNAL | UNAVAILABLE` (503: the feature lacks configuration, e.g. an AI model). `INTERNAL` and `UNAVAILABLE` are logged as `operation.failed` (error).
- Surfaces map with `toHttpStatus`, `toGraphqlExtensions`, `toMcpError` – no custom mappings.

## Feature folders (`src/features/<entity>/`)
- Fixed filenames: `schema.ts` (Zod), `operations.ts` (list/get/create/update/archive), `embeddable.ts`. Adapters (`graphql.ts`, `rest.ts`, `mcp.ts`, `ui/`) are added by the respective surface. New entity: `pnpm gen entity`.
- Archiving = soft delete (`status: ARCHIVED`), never hard delete.

## AI data layer (conversations, messages, skills)
- `conversation.*` (list/get/create/rename/archive) and `message.*` (list/append). Permission `conversation:read|write|admin`.
  - Conversations are private to `ownerUserId`. Org admin/owner (`conversation:admin`) and the system actor may **read** all (`get`, `message.list`, `conversation.list` with `allUsers: true`), but only the owner renames and appends messages. Archive: owner or admin. Other users get `NOT_FOUND` (not `FORBIDDEN`), so existence does not leak. The rule is in `features/conversation/access.ts`.
  - `message.append`: `parts` = AI SDK `UIMessage` parts (stored as is, only `type`/`text` are checked, max 256 kB), `metadata` free JSON. `sequence` is 0-based and unique per conversation (the conversation row is locked first). The AI actor may only append `ASSISTANT`/`TOOL` and only in its own `conversationId`; `USER`/`SYSTEM` are saved by the app as the user.
  - `conversation.create`, `conversation.rename` and `message.append` have `approval: false` (the chat's own bookkeeping). `conversation.archive` requires approval.
- `skill.*`: list/get/export (`skill:read`), create/update/publish/archive/import (`skill:write`), share (`skill:admin`).
  - Visibility (`features/skill/access.ts`): SYSTEM + ORGANIZATION for everyone in the org, PERSONAL only for the owner. SYSTEM is read-only, ORGANIZATION requires admin, PERSONAL only the owner.
  - `skill.share` copies one's own personal skill to ORGANIZATION as DRAFT (`source = share:<id>`). `skill.import` parses SKILL.md (frontmatter `name` → slug, `metadata.title` → name, `description`, `allowed-tools`; body → instructions; resources as `<!-- okazi:resource name="x" -->…<!-- /okazi:resource -->`) into DRAFT. `skill.export` gives `{ markdown, filename }`. A content change bumps `version`.
  - SYSTEM skills: `src/skills/system/*.md` (written in English; the assistant still answers in the user's language). `seedSystemSkills({ db?, embed?, directory? })` (imported from `@okazi/core/seed`, **not** from index – it reads files and must not end up in the web bundle) upserts per `source = system:<file>`, idempotent, bumps the version on change, archives removed files and indexes globally if `embed` is given. CLI: `pnpm --filter @okazi/core seed:skills`. No AuditLog row (the rows have no organization; changes are reviewed as code).
- `Actor.approvedBy` is set only by the approval flow and stored in `AuditLog.approvedBy`.

## Members and fixed roles (ADR 0034)
- `member.list` (`member:read`), `member.assignRole|remove|invite|listInvitations|cancelInvitation` (`member:admin`). Rows in `member`/`invitation` (Better Auth tables, org-scoped in `scopedDb`). `member.role` holds one fixed role; `parseMemberRole` turns anything else into `null` (grants nothing).
- Fixed roles: `FIXED_ROLES` (`viewer < member < admin < owner`) and `GRANTABLE_ROLES` (no `owner`) in `permissions/fixed-roles.ts`. What they grant is `ROLE_PERMISSIONS` in `packages/auth`; core only compares ranks.
- Anti-escalation (`features/member/role-access.ts`, by rank of `context.roles`, system excepted): nobody gives a role above their own or changes/removes a member above them; only an owner changes or removes an owner. The organization always keeps an owner (`checkOwnerKept`, CONFLICT, also for system). Invitations never carry `owner`.
- `responsibility.list|get|create|update|archive` (`configuration:read|write`, ADR 0034): name, covered item types (`entityTypeIds`), default assignee and followers (`defaultAssigneeId`, `defaultFollowerIds`, user ids). `checkResponsibilityContents` refuses non-item types and non-members (`VALIDATION`); `insertResponsibility` is shared with `configuration.importTemplate`, which makes the importing member the default assignee of the template's responsibilities and creates none for a caller who is not a member.
- `assignment.assign|follow|unfollow|list|listMine` (`assignment:read|write`, ADR 0034): one main assignment per inquiry, booking or item (`responsibilityId` null) plus one per responsibility on a booking, with followers in `AssignmentFollower`. `checkSlot` checks the polymorphic subject belongs to the organization (`NOT_FOUND`); `saveAssignee`/`addFollower`/`removeFollower` (`write-assignment.ts`) record the change. `mainAssigneeId` feeds the phase rules (`CONFIRMED`/`COMPLETED`, `QUALIFIED`); `subjectIdFilter` gives `booking.list`/`inquiry.list` their `assigneeId`/`followerId` filters; `assignOnCreate` sets the main assignee from `assigneeId` on create (quick booking: the member who books).
- Sheet definitions still name a fixed role in `roleId` until sheets go to a responsibility.
- Tests that create members need a real `organization` row: `testOrg()` in `test/org-helpers.ts`. `testContext({ role })` sets the caller's fixed role (default from `access`: read → viewer, write → member, admin → owner).

## Configurable domain (ADR 0021, 0026)
- `entityType.*`, `fieldDefinition.*`, `vocabulary.*` (plus `addValue|updateValue|archiveValue|importTemplate`) and `setup.*` require `configuration:read|write`. `item.*` requires `item:read|write`.
- No domain words in the code:
  - Base entities and behaviours: `features/entity-type/behaviour-kinds.ts`.
  - Field kinds: `features/field-definition/field-kinds.ts`.
- Field values live in `Item.fields` (JSON) under the field's `key`. `buildFieldsSchema({ specs })` (client-safe) validates them, and `loadFieldSpecs` fetches specs with the vocabulary values' ids.
- The rule "data exists → CONFLICT" exists in three places:
  - behaviours: `entity-type/behaviours.ts`
  - field changes: `field-definition/field-rules.ts`
  - archiving: in the respective operation
- Behaviour data on the item is checked in `item/item-rules.ts`. `COMPOSABLE` parts (`ItemComponent`) are replaced as a set via `components`; `item/item-components.ts` checks parts and `item/component-graph.ts` rejects cycles and more than 5 levels. `CHOICES` has no data yet.
- Vocabulary templates are data in `templates/vocabularies/` (`eu-14-allergens`).
- `configuration.importTemplate` (`configuration:write`) imports a starter pack from `templates/configuration/` (`conference-venue`): lists, setups, and types with behaviours and fields, via the shared insert helpers (`insertVocabulary`, `insertSetup`, `insertEntityType`, `insertField`). Idempotent: names that exist are skipped and left untouched (an existing type keeps its own fields). Audit rows carry the created kind (`withEntityType`).
- Errors are built with `shared/errors.ts` (`notFound`, `conflict`, `invalid`). Pagination: `shared/page-input.ts`.

## Demo data
- `seedDemo()` in `src/seed/demo/` (`@okazi/core/seed/demo`, CLI `seed:demo`). The spec is `docs/demo-seed.md`, and `data/<org>/*.ts` follows it. Everything goes through `execute` as SYSTEM, except the Better Auth rows in `users.ts`.
- Parts that are built:
  - roles (`seed-roles.ts`)
  - responsibilities (`seed-responsibilities.ts`, after the types)
  - configuration (`seed-config.ts`)
  - venue, bookable spaces and the first composed items (`seed-items.ts`)
- The checks are in `checks.ts` and `config-checks.ts`.

## Search
- A searchable entity implements `Embeddable` (`entityType`, `toText({ entity })`, `load({ ids, db })`) and is set as `embeddable` on its commands.
- `createSearchOperation({ embed, embeddables? })` – hybrid FTS + vector (RRF), org-scoped. `embed({ texts })` is injected by the app; core has no AI SDK dependency.
- A new searchable entity is registered in `search/embeddables.ts` (`SEARCHABLE_ENTITIES`). `search` filters each hit through `load({ ids, db, viewer })`: unregistered types, archived rows and things the user may not see (other people's conversations and personal skills) are removed. `load` without `viewer` is used by the indexer.

## Tests
- Vitest against a real Postgres (`docker compose up -d postgres`, `pnpm db:migrate`), no mocks. Each test creates its own org via `testContext()`. Deterministic `fakeEmbed` in `test/fake-embed.ts`.
