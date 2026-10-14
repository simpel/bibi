# 0006 – Database conventions

- **Date:** 2026-10-13
- **Status:** Accepted

## Context
Okazi has many entities that link to each other across organization and company boundaries. Data must be traceable, recoverable and auditable. IDs must work in URLs, in external systems and in AI tools without revealing counts or ordering.

## Decision
- IDs are cuid2 strings.
- Soft delete: entities are removed by setting `status` (for example `ARCHIVED`), not with `DELETE`. Hard deletes happen only in migrations and by operations staff.
- Every table has `createdAt`, `updatedAt` and `createdBy`.
- The `AuditLog` table logs every mutation: who (`actor` = `user` or `ai`), what (operation), which entity, before and after images, and the conversation ID when the mutation comes from the assistant.
- Every row has `organizationId`. Exceptions are global system tables, for example users and system skills, which are listed explicitly.
- Tables and columns follow the Prisma schema in `packages/db`. Migrations run with `pnpm db:migrate`.

## Consequences
- Soft delete means all lists and searches must filter on `status`. This is handled in core and in the org-scoped client, not in each query.
- `AuditLog` grows quickly. Retention and archiving need to be decided later.
- cuid2 is a string format, so indexes are larger than for integers. We accept that so IDs stay opaque.
- Whoever writes a new mutation cannot forget audit, because the audit hook lives in core.
