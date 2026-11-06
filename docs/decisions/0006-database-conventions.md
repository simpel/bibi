# 0006 – Database conventions

- **Date:** 2026-10-13
- **Status:** Accepted

## Context
- Entities link across many boundaries. Data must be traceable, recoverable and auditable.
- IDs appear in URLs, external systems and AI tools, so they must not reveal counts or order.
- Conventions only hold if a new handler cannot forget them.

## Decision
1. IDs are cuid2 strings.
2. Soft delete: entities are removed by setting `status` (for example `ARCHIVED`), not with `DELETE`. Hard deletes happen only in migrations, by operations staff and for listed models.
3. Every table has `createdAt`, `updatedAt` and `createdBy`. Every row has `organizationId`.
4. `AuditLog` records every mutation: actor (`user` or `ai`), operation, entity, before and after images, and the conversation id for assistant mutations.
5. The org-scoped client `scopedDb({ organizationId, actorId })` enforces the conventions. It forces `organizationId` and `createdBy` on create and strips `createdBy` from updates.
6. `scopedDb` rejects nested relation writes (`ScopeViolationError`), because the forced columns and the soft-delete and append-only rules apply only to the top-level model. Only `connect`, `disconnect` and `set` nest.
7. Every exception to these rules is a constant in `packages/db/src/scoped/`, and a test checks every Prisma model against them. A new model must be classified before the suite passes. Exceptions are Better Auth tables, platform tables, per-user tables across organizations (ADR 0039, 0046), append-only tables, derived indexes and replacement sets.
8. `Skill` has a nullable `organizationId`: SYSTEM skills are global rows written only by the seeder.

## Rejected
- Integer or UUID v4 ids: integers leak counts, UUIDs index worse and carry no benefit over cuid2.
- Hard delete by default: it breaks traceability and recovery.
- Setting `createdBy` and audit in each handler: handlers forget.

## Consequences
- Lists and searches must filter on `status`; core and the scoped client do it, not each query.
- `AuditLog` grows quickly. Retention and pseudonymisation: ADR 0032.
- cuid2 indexes are larger than integers; we accept that so ids stay opaque.
