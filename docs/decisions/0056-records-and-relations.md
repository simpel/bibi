# 0056 – One record table for configurable entities; references are relations

- **Date:** 2026-10-19
- **Status:** Accepted
- **Related:** 0006 (database conventions), 0021 (configurable items), 0034, 0051, 0053, 0055

## Context
- Seven tables carry an org-defined type and `fields` JSON. Every rule about types and fields queries all seven, and today loads rows into memory.
- Many references have no foreign key: ids inside JSON, `String[]` id lists, and polymorphic type/id pairs.
- Every "cannot archive while in use" rule re-implements a foreign key by hand.

## Decision
1. A `Record` supertable (class-table inheritance) holds id, organization, entity type, base, `fields` (JSONB) and status. Each of the seven tables shares its primary key with a `Record` row.
2. Scalars and choices stay in `Record.fields` with a GIN index. Choice values are vocabulary value ids, which cannot dangle because values are archived, not deleted. Links move to a `RecordLink` table with composite foreign keys. Core merges links back into `fields` on read, so APIs keep one object.
3. Id lists become join tables with composite foreign keys.
4. Polymorphic pairs point at `Record`.
5. Archiving stays a status change. The foreign keys prove the target exists in the same organization and make "in use" queries cheap. Every `CONFLICT` refusal lists the blocking rows.

## Rejected
- Per-table GIN indexes without a supertable: fixes the memory scan, but references stay unchecked and rules still query seven tables.
- Full EAV (one typed row per value): every list needs a pivot.
- Choice values in a reference table: a merge on every read for little gain.

## Consequences
- Creating a record writes two rows in one transaction, behind one helper per base.
- Filtering and sorting by org-defined fields becomes possible in SQL.
- Reporting and search can use one table instead of seven.
- Large migration touching every configurable entity. No production data existed, so tables were recreated and the demo seed is the test.
