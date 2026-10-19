# 0056 – One record table for configurable entities; references are relations

- **Date:** 2026-10-19
- **Status:** Accepted
- **Related:** 0006 (database conventions), 0021 (configurable items), 0034, 0051, 0053, 0055

## Context
- Seven tables carry an org-defined type and `fields` JSON: `Item`, `Customer`, `Contact`, `Ticket`, `TicketTemplate`, `ProgramItem`, `Requirement`. Every rule about types and fields ("refuse while records have a value", `LINK` targets, search) has to query all seven. Today it loads every row into memory (`field-usage.ts`). That does not scale past a few thousand tickets.
- References without a foreign key:
  - `LINK` and `CHOICE` / `MULTI_CHOICE` field values: ids inside JSON,
  - `Responsibility.entityTypeIds`, `defaultFollowerIds`; `SheetDefinition.entityTypeIds`, `fieldIds`, `vocabularyIds`, `roleId`: `String[]` id lists,
  - polymorphic pairs: `Assignment.subjectType/subjectId`, `Occupancy.sourceType/sourceId`, `Embedding.entityType/entityId`.
- Every "cannot archive while in use" rule re-implements a foreign key by hand.

## Decision
1. **A `Record` supertable** (class-table inheritance): `id`, `organizationId`, `entityTypeId`, `base`, `fields` (JSONB), `status`, timestamps. Each of the seven tables (`Item`, `Customer`, `Contact`, `Ticket`, `TicketTemplate`, `Line`, `Requirement`) shares its primary key with a `Record` row (`id` is both PK and FK, composite with `organizationId`).
2. **Field values:**
   - Scalars and choices (`TEXT`, `NUMBER`, `BOOLEAN`, `DATE`, `CHOICE`, `MULTI_CHOICE`) stay in `Record.fields`, with a GIN index (`jsonb_path_ops`). Choice values are vocabulary value ids, validated by core on write. Since values are archived and never deleted, an id cannot dangle. "In use" checks are one indexed query (`fields ? key`, `fields @> {key: [id]}`).
   - Links move to `RecordLink`: `recordId`, `fieldId`, `targetRecordId`, all composite foreign keys. A link field with several targets is several rows. "Cannot archive a record while a link points to it" is an indexed `EXISTS`.
   - Core merges links into `fields` on read, so APIs keep one `fields` object.
3. **Id lists become join tables** with composite foreign keys: `ResponsibilityEntityType`, `ResponsibilityDefaultFollower`, `SheetDefinitionEntityType`, `SheetDefinitionField`, `SheetDefinitionVocabulary`. `SheetDefinition.roleId` is renamed `responsibilityId` with a foreign key.
4. **Polymorphic pairs point at `Record`:** `Assignment.recordId`, `Embedding.recordId` and the audit log's entity reference for records. Occupancy loses its source pair (ADR 0053).
5. Archiving is still a status change (ADR 0006). Because nothing is hard-deleted, the foreign keys' value is proof at write time (the target exists, in the same organization) and cheap "in use" queries, not delete protection. Every `CONFLICT` refusal lists the rows that block it.

Alternatives considered:
- Per-table GIN indexes without a supertable: fixes the in-memory scan, but links and polymorphic references stay without foreign keys and every rule queries seven tables.
- Full EAV (one typed row per value): integrity and indexing, but every list needs a pivot. Rejected.
- Choice values in a reference table too: stronger integrity, but a merge on every read for little gain, since vocabulary values are never deleted.

## Consequences
- Creating a record writes two rows in one transaction. Core hides this behind one `createRecord` helper per base.
- GraphQL, REST and MCP keep exposing `fields` as one JSON object. Core merges scalars and references on read, so the API shape does not change.
- Filtering and sorting lists by org-defined fields becomes possible in SQL (GIN for scalars, joins for references) instead of in memory.
- Custom-field reporting and search can use one table instead of seven.
- Large migration touching every configurable entity. No production data, so the migration recreates tables, and the demo seed is the test.
