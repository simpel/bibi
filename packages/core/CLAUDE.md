# @okazi/core – context for Claude

The parity core: every capability is defined **once** as an operation and then exposed the same way in web, GraphQL, REST and MCP.

## Operations
- `defineOperation({ name, kind, description, input, output, permission, handler, approval?, aiAllowed?, embeddable?, entityType? })`.
  - `name` = `<entity>.<verb>` (e.g. `venue.create`), stable across all surfaces. `description` is written for both humans and LLMs.
  - `input`/`output` are Zod schemas; `permission` = `<feature>:<action>` (ADR 0050).
  - `handler({ input, context })` returns `Result` (`ok({ value })` / `err({ error: AppError })`) – never throw strings.
  - Commands call `context.recordChange({ entityId, before, after })` for the audit row.
- Always run via `execute({ operation, input, context, afterCommit? })`: Zod validation → permission → handler → output validation → AuditLog (commands, in the same transaction) → `afterCommit` hooks (e.g. `createIndexingHook({ embed })`).
- Calls to the outside world (a payment provider, mail to a customer) go in the operation's `external({ input, output, context })`, never in `handler`: `execute` runs it only after the commit, and a change preview, dry run or nested run never does (ADR 0058). It is outside the transaction; a failure leaves the record in a failure state and is returned.
- `execute` logs exactly one line per call: `operation.completed` / `operation.rejected` (VALIDATION, FORBIDDEN, NOT_FOUND etc.) / `operation.failed` (INTERNAL, with cause). Failed `afterCommit` hooks are logged as `operation.afterCommitFailed`; the indexing hook never throws and logs `search.index_failed` instead, so the command result is unchanged (ADR 0030). The AuditLog row gets `requestId` and `surface` from the request context (`surface: system` outside a request). See ADR 0014.
- `context.db` is `scopedDb` – org scoping cannot be bypassed. Build the context with `createExecuteContext({ organizationId, actor, roles, permissions })`. `permissions` (`PermissionSet`) is resolved by `packages/auth`; `hasPermission({ permissions, permission })` looks up exactly. `roles` are names for display only.
- `requiresApproval({ operation, actor })`: commands require human approval when `actor.type === "ai"` (default `approval: true`).
- `aiAllowed: false` (default true): the AI actor may never run the operation. `authorize` refuses it (also after an approval) and MCP hides the tool from the AI actor, so the assistant cannot propose it. Used by `apiKey.create` (the secret must not enter a chat).
- `context.credential` (`session`, `accessToken`, `apiKey`) is set by `packages/auth`; absent for system and test contexts. `apiKey.create` requires `session` (ADR 0005). An API key caller has `actor = { type: "apiKey", userId: null, apiKeyId }` (audit actor type `API_KEY`) and cannot run `self:*` operations.
- Client-safe subpackage `@okazi/core/schemas` (`src/schemas.ts`): only the zod files (`features/*/schema.ts`, `search/search-schema.ts`). Import it in client code and in `@okazi/ai/ui`; add one line per new entity's `schema.ts` there. Never Prisma/fs/operations in it.
- The registry: `registerOperations({ operations: createCoreOperations({ embed }) })`, `listOperations()`, `getOperation({ name })`. Adapters generate tools/endpoints from the registry.

## Platform operations (ADR 0015)
- `src/platform/`: `definePlatformOperation` and `executePlatform({ operation, input, context })` with `PlatformContext` (`createPlatformContext`, built only by `resolvePlatformContext` in auth). The same chain as `execute`. Audit with `PLATFORM_SCOPE`. Handlers see only `PlatformDb` (`systemLog`, `aiSetting`).
- `createPlatformOperations({ listModels })`: `systemLog.list/get`, `aiFeature.list/update`, `aiModel.list`. **Not** registered in the org registry. Not in GraphQL, REST or MCP.
- `resolveAiModel({ feature })` → `Result<string>`: the admin's choice (cache 30 s). No default: unchosen → `UNAVAILABLE` and `ai.modelNotConfigured` (error). `AI_FEATURES` is the registry.

## User preferences (ADR 0039)
- `userPreference.list({ prefix? })` and `userPreference.set({ key, value })` (upsert, audited): the caller's own UI preferences (e.g. `table.columns.<tableId>`), user-scoped, not org-scoped. Permission `self:read|edit`: `SELF_FEATURE` is not in `FEATURES`, `hasPermission` grants it to every member (not to API keys), and `scopedDb` pins the rows to the actor. The system actor gets `FORBIDDEN`.

## User settings (ADR 0046)
- `userSettings.get` and `userSettings.update({ onboardingStatus })`: the caller's own typed settings (first setup `PENDING|COMPLETED|SKIPPED`, null without a row), `self:read|edit`, user-scoped like preferences. They live in `features/user-preference/` (`settings-schema.ts`, `operations.ts`) with the preference operations.

## User settings (ADR 0046)
- `userSettings.get` and `userSettings.update({ onboardingStatus })`: the caller's own typed settings (first setup `PENDING|COMPLETED|SKIPPED`, null without a row), `self:read|write`, user-scoped like preferences. They live in `features/user-preference/` (`settings-schema.ts`, `operations.ts`) with the preference operations.

## Errors
- `AppError` with codes `NOT_FOUND | FORBIDDEN | UNAUTHENTICATED | VALIDATION | CONFLICT | INTERNAL | UNAVAILABLE` (503: the feature lacks configuration, e.g. an AI model). `INTERNAL` and `UNAVAILABLE` are logged as `operation.failed` (error).
- Surfaces map with `toHttpStatus`, `toGraphqlExtensions`, `toMcpError` – no custom mappings.

## Feature folders (`src/features/<entity>/`)
- Fixed filenames: `schema.ts` (Zod), `operations.ts` (list/get/create/update/archive), `embeddable.ts`. Adapters (`graphql.ts`, `rest.ts`, `mcp.ts`, `ui/`) are added by the respective surface. New entity: `pnpm gen entity`.
- Archiving = soft delete (`status: ARCHIVED`), never hard delete.

## AI data layer (conversations, messages, skills)
- `conversation.*` (list/get/create/rename/archive) and `message.*` (list/append). Permission `self:read|edit`; reading everyone's needs `assistant:read`.
  - Conversations are private to `ownerUserId`. Org admin (`assistant:read`) and the system actor may **read** all (`get`, `message.list`, `conversation.list` with `allUsers: true`), but only the owner renames and appends messages. Archive: owner or admin. Other users get `NOT_FOUND` (not `FORBIDDEN`), so existence does not leak. The rule is in `features/conversation/access.ts`.
  - `message.append`: `parts` = AI SDK `UIMessage` parts (stored as is, only `type`/`text` are checked, max 256 kB), `metadata` free JSON. `sequence` is 0-based and unique per conversation (the conversation row is locked first). The AI actor may only append `ASSISTANT`/`TOOL` and only in its own `conversationId`; `USER`/`SYSTEM` are saved by the app as the user.
  - `conversation.create`, `conversation.rename` and `message.append` have `approval: false` (the chat's own bookkeeping). `conversation.archive` requires approval.
- `skill.*`: list/get/export (`self:read`), create/update/publish/archive/import (`self:write`), share (`assistant:write`).
  - Visibility (`features/skill/access.ts`): SYSTEM + ORGANIZATION for everyone in the org, PERSONAL only for the owner. SYSTEM is read-only, ORGANIZATION requires admin, PERSONAL only the owner.
  - `skill.share` copies one's own personal skill to ORGANIZATION as DRAFT (`source = share:<id>`). `skill.import` parses SKILL.md (frontmatter `name` → slug, `metadata.title` → name, `description`, `allowed-tools`; body → instructions; resources as `<!-- okazi:resource name="x" -->…<!-- /okazi:resource -->`) into DRAFT. `skill.export` gives `{ markdown, filename }`. A content change bumps `version`.
  - SYSTEM skills: `src/skills/system/*.md` (written in English; the assistant still answers in the user's language). `seedSystemSkills({ db?, embed?, directory? })` (imported from `@okazi/core/seed`, **not** from index – it reads files and must not end up in the web bundle) upserts per `source = system:<file>`, idempotent, bumps the version on change, archives removed files and indexes globally if `embed` is given. CLI: `pnpm --filter @okazi/core seed:skills`. No AuditLog row (the rows have no organization; changes are reviewed as code).
- `Actor.approvedBy` is set only by the approval flow and stored in `AuditLog.approvedBy`.

## Members, presets and overrides (ADR 0034, 0050)
- `member.list` (`member:read`), `member.assignRole` (`member:write`), `member.invite|listInvitations|cancelInvitation` (`member:write`), `member.remove` (`member:delete`). Rows in `member`/`invitation` (Better Auth tables, org-scoped in `scopedDb`). `member.role` holds one fixed role; `parseMemberRole` turns anything else into `null` (grants nothing).
- Permissions are `<feature>:<action>` (`permissions/features.ts`, `FEATURE_SPECS`: features grouped bookings/selling/catalog/setup/organization; actions `read|write|delete`; `write` covers creating, changing, sending, exporting and moving a ticket's phase; `write` and `delete` imply `read`). `self` (own conversations, skills, preferences, settings, connected apps) is always on and not a feature. Locked features `member`, `apiKey`, `paymentAccount` (every action but `read`) come only from the `admin` preset. Lines, alternative groups, requirements and line states belong to `program`; receivables, deposits and invoices to `payment`; the owner of every entity type is `ENTITY_FEATURE` (`permissions/entity-features.ts`).
- Presets: `PRESET_PERMISSIONS` in `permissions/presets.ts` (`member`, `manager`, `admin`; this replaces `ROLE_PERMISSIONS` and `RESOURCES`/`RESOURCE_LEVELS`). Overrides: `applyOverrides` in `permissions/overrides.ts` (preset, plus `allow`, minus `deny`; locked and unknown overrides are refused or ignored; denying `read` hides the feature). Stored in `PermissionOverride` (member or API key subject).
- `permission.get({ subjectType, subjectId })` and `permission.update({ subjectType, subjectId, overrides })` (`member:write`, the complete list; audited) in `features/permission/`.
- Fixed roles: `FIXED_ROLES` (`member < manager < admin`, not configurable), `ADMIN_ROLE` and the platform role `SUPERADMIN_ROLE` (`user.role = "superadmin"`) in `permissions/fixed-roles.ts`. Invitations and API keys can carry any fixed role up to the caller's own. What they grant is the preset plus overrides (`permissions/`, resolved by `packages/auth`); anti-escalation compares ranks. `member.remove` archives the member's overrides and no longer revokes API keys.
- Anti-escalation (`features/member/role-access.ts`, by rank of `context.roles`, system excepted): nobody gives a role above their own or changes/removes a member above them; `admin` is the top, so there is no separate owner rule. The organization always keeps at least one admin (`checkAdminKept`, CONFLICT, also for system).
- `responsibility.list|get|create|update|archive` (`responsibility:read|write|delete`, ADR 0034): name, covered item types (`entityTypeIds`), default assignee and followers (`defaultAssigneeId`, `defaultFollowerIds`, user ids). `checkResponsibilityContents` refuses non-item types and non-members (`VALIDATION`); `insertResponsibility` is shared with `configuration.importTemplate`, which makes the importing member the default assignee of the template's responsibilities and creates none for a caller who is not a member.
- `assignment.assign|follow|unfollow|list|listMine` (`ticket:read|write`, ADR 0034, 0050, 0055): rows store only explicit choices: the main assignment per ticket or item (`responsibilityId` null) and a member's choice for a responsibility on a ticket, with explicit follows and unfollows in `AssignmentFollower.effect`. Applicable responsibilities (`applicableResponsibilityIds`, from the active lines' item types), default assignees and default followers are derived on read (`deriveAssignment`, `listSubjectAssignments`, `listMineAssignments`, `derivedSlots` for `ticket.list` filters): never create or archive rows when lines change. Results carry `assigneeSource`/`followers[].source` (`EXPLICIT`, `DEFAULT`). `sheet.send` snapshots the responsibility's derived assignee and followers in `SheetRecipient` (needs `ticket:read`). Rows reference the subject's `Record` (`recordId`, composite FK, ADR 0056) while the API keeps `subjectType`/`subjectId`; `checkSlot` checks the record exists with that base (`NOT_FOUND`); `saveAssignee`/`addFollower`/`removeFollower` (`write-assignment.ts`) record the change. `mainAssigneeId` feeds the `requiresAssignee` phase flag (ADR 0043); `subjectIdFilter` gives `ticket.list` its `assigneeId`/`followerId` filters; `assignOnCreate` sets the main assignee from `assigneeId` on create (a ticket created from a template: the creating member).
- Sheet definitions go to a responsibility (`responsibilityId`, checked by `checkSheetContents`); a sheet version copies it. The id lists of responsibilities and sheet definitions are join rows (ADR 0056): read them with `findResponsibility`/`findSheetDefinition` (`*-rows.ts`), write them with `replaceResponsibilityLinks`/`replaceSheetLinks`; `checkNotOnSheets` refuses archiving a type, field, list or responsibility an active definition uses.
- Tests that create members need a real `organization` row: `testOrg()` in `test/org-helpers.ts`. `testContext({ role })` sets the caller's fixed role (default from `access`: read → preset `member`, write → `manager`, admin → `admin`) and resolves its permissions from the preset; pass `permissions` (e.g. `applyOverrides({ preset, overrides })`) to test fine-tuning.

## Configurable domain (ADR 0021, 0026)
- `entityType.*`, `fieldDefinition.*`, `vocabulary.*` (plus `addValue|updateValue|archiveValue|importTemplate`) and `setup.*` require `configuration:read|create|edit|remove`. `item.*` requires `item:*`.
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
