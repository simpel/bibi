# 0032 – AuditLog retention and pseudonymisation

- **Date:** 2026-10-15
- **Status:** Accepted
- **Related:** 0006, 0014, 0027

## Context
- `AuditLog` was never purged and grows quickly. `SystemLog` already has a retention setting.
- The Swedish Bookkeeping Act requires source documents to be kept 7 years. GDPR limits personal data in the `before` and `after` snapshots.

## Decision
1. Rows are kept 7 years. No partitioning until the table needs it.
2. After 1 year a nightly worker job, running as SYSTEM, pseudonymises personal values in `before` and `after`. Actor, entity, action, timestamps, `requestId` and `surface` stay, and keys stay so the trail still shows that a field changed.
3. The job is the only writer that changes an `AuditLog` row. Otherwise the table stays append-only through `scopedDb`. The period is configured in `@bibi/config`.
4. Rows are not deleted. Deleting after 7 years is a separate decision.

## Rejected
- Keeping everything unredacted: conflicts with GDPR.
- Deleting early: weakens evidence and may conflict with bookkeeping rules.

## Consequences
- Assessment, to be confirmed by an accountant: `AuditLog` is most likely not accounting information. The source documents are invoices, payments and the bookings they refer to. Seven years stays the safe default until confirmed.
- Organization-defined field content is treated as personal, because the code cannot know what it holds.
