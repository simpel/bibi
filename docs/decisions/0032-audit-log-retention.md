# 0032 – AuditLog retention and pseudonymisation

- **Date:** 2026-10-15
- **Status:** Accepted

## Context
- `AuditLog` is never purged and grows quickly (ADR 0006, issue #10). `SystemLog` has `SYSTEM_LOG_RETENTION_DAYS`.
- The Swedish Bookkeeping Act requires source documents to be kept 7 years. GDPR limits personal data in `before` and `after`.

## Decision
- **Rows are kept 7 years.** No partitioning until the table is large enough to need it.
- **Pseudonymise `before` and `after` after 1 year:** a pg-boss cron job (ADR 0027) replaces personal fields with a redacted marker. Actor, entity, action, timestamps, `requestId` and `surface` stay.
- **Ownership:** the job runs as SYSTEM and is logged like any operation.
- The period is configured in `@okazi/config`.

## Consequences
- **To verify:** whether `AuditLog` itself counts as bookkeeping source material or whether bookings and invoices are the source documents. The 7-year period is the safe default.
- Follow-up ticket: the pseudonymisation job.
- ADR 0006 is updated to point here.
