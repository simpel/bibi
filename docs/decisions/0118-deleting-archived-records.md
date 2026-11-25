# 0118 – Deleting archived records, by hand and after a retention period

- **Date:** 2026-11-25
- **Status:** Accepted (the user, 2026-11-25)
- **Related:** 0006, 0032, 0051, 0054, 0056, 0106, 0113

## Context
- ADR 0006 made archiving the only delete: nothing an organization creates is ever destroyed. Venues now want archived things gone: a task, a customer or an item they will never use again should not linger in the database or in exports.
- Every record with its own page gets one danger area at the bottom of the page (or a last tab), the only place to archive or delete it (spec: `docs/specs/danger-area.md`).
- Swedish bookkeeping law requires accounting records to be kept for seven years. Bibi does not number or issue them (ADR 0106), but it stores money records (payments, refunds, invoices and credit notes as mirrored, deposits, accepted quotes and order versions) and the audit log (ADR 0032).

## Decision
1. A record is deleted only after it is archived. In the danger area, an archived record offers **Delete permanently** (a new `<entity>.delete` operation, `<feature>:delete`, confirmed by typing its name). An active record offers only **Archive**.
2. An organization sets how many days an archived record is kept before it is deleted: default 90, at least 1, at most 180 (`OrganizationProfile.archiveRetentionDays`, admin only). A worker job deletes archived records whose `archivedAt` is older than that, as SYSTEM, every night.
3. Deleting removes the record's row, its `Record` row and its dependent rows that have no meaning alone (links, follower and relation rows, embeddings). It is refused with `CONFLICT` while another active record refers to it (an item used on a line, a customer with orders); the job skips such records and tries again the next night.
4. Never deleted, by hand or by the job: money records (payment, refund, invoice, credit note, deposit, accepted quote, order version), an order with any of them, and `AuditLog`. They stay archived. Their personal data follows ADR 0032.
5. Deleting is audited like any command, with the record's last state as the before image; the audit row outlives the record.
6. `archivedAt` becomes an owned column on every archivable model (set when archived, cleared when restored), so the retention clock does not depend on `updatedAt`.

## Rejected
- Keep ADR 0006 as it is: archived data piles up forever and venues cannot remove what they no longer want.
- Delete active records directly: one click destroys data; archiving first gives a grace period and an undo.
- A fixed retention for every organization: venues differ; the 180-day cap keeps the undo window and our backups meaningful.
- Deleting money records after retention: it would break the bookkeeping trail the ledger relies on.

## Consequences
- ADR 0006 decision 2 is amended: hard deletes also happen through `<entity>.delete` and the retention job, for the models this ADR lists.
- Every archivable model gains `archivedAt` (expand migration, backfilled from `updatedAt` for rows already archived) and a delete operation on every surface (ADR 0003).
- Foreign keys from other tables need an explicit rule per relation (refuse, cascade or set null), listed in `packages/db/CLAUDE.md`.
