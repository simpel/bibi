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

## Implementation (issue #120)
- The worker job `system.pseudonymiseAuditLog` runs nightly at 03:30 (Europe/Stockholm) and calls `pseudonymiseAuditLog` in `@okazi/db`. It is dedicated system code across all organizations: `AuditLog` stays append-only through `scopedDb`, and this is its only writer that changes a row.
- `AUDIT_LOG_PSEUDONYMISE_AFTER_DAYS` (default 365) sets the period.
- Personal values are replaced by `"[redacted]"`; the key stays so the trail still shows that the field changed. Redacted at any depth: contact details (`email`, `phone`, `contactEmail`, `contactPhone`), invoice address, mail content (`fromAddress`, `toAddresses`, `subject`, `text`, `html`), chat `parts`, `statusReason` and the organization's own `fields` (their content is configured per organization, so the code treats it as personal). `name` is also redacted on `customer`, `contact` and `member`, `title` on `conversation`, `metadata` on `message` and `attachments` on `inboundEmail`.
- `AuditLog.pseudonymisedAt` marks a done row, so reruns skip it. The job logs `auditLog.pseudonymised` with the row count inside the job's system log context (`job.started` / `job.completed`).
- Rows are not deleted. Deleting rows after 7 years is a separate decision and ticket.

## Consequences
- **Bookkeeping source material (assessment, to be confirmed by an accountant):** `AuditLog` is most likely not accounting information (räkenskapsinformation) under the Bookkeeping Act. The source documents are the invoices and payments (Stripe, ADR 0028 and 0029) and the bookings they refer to. Okazi is not the bookkeeping system, so the audit trail is not its processing history either. Keeping rows 7 years stays the safe default until this is confirmed, and pseudonymised rows still show who changed what and when.
- ADR 0006 is updated to point here.
