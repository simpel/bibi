# 0077 – Financials overview and SIE-4 export

- **Date:** 2026-11-01
- **Status:** Accepted
- **Related:** 0029 (invoicing), 0041 and 0036 (amended), 0050, 0051, 0052, 0056, 0057, 0064, 0071, 0079, 0080, 0087, 0093

## Context
- A venue's accounting system is its book of record. Bibi holds sub-ledger facts: frozen invoices with VAT per rate, deposits and Stripe-mirrored payments. It has no accounts and no ledger.
- ADR 0029 deferred Fortnox, Visma and Peppol, since each needs per-organization OAuth and certification. Venues still expect accounting integration.
- SIE-4 type 4I is the Swedish standard file for moving vouchers. One file covers Fortnox, Visma, Bokio and others. It needs PC8 encoding and every voucher must sum to zero.
- Some facts were missing: send dates for invoices and deposits, and refunds as rows of their own.

## Decision
1. A top-level Financials page shows invoiced, received, outstanding and overdue, receivables aging, forward-booked value and revenue by item type. One read model, `finance.overview({ from, to })`, on every surface.
2. Revenue basis is accrual. Invoiced is sent invoices by send date excl. VAT. Received is settled payments by `paidAt` minus refunds by refund date. Nothing is stored; the money module (ADR 0057) computes it.
3. A new permission feature `finance` (`read`, `write`). Managers and admins have it; exporting needs `write`.
4. Account mapping is organization data (`AccountingSettings`, prefilled with BAS defaults). The revenue account inherits item, then item type, then organization default.
5. Vouchers are derived from facts, one per event, each summing to zero: invoice sent, invoice voided after export, payment, refund and application fee. The order reference goes in a dimension; voucher text never holds customer or guest names.
6. `accountingExport.create` is a command (AI proposes, staff approve, audited). It writes one SIE 4I file and `AccountingExport` snapshots the bytes, so re-downloading returns the same file. Amended 2026-11-01: staff choose a date range and the same range may be exported several times.
7. New owned facts: `sentAt` and `voidedAt` on `Invoice` and `Deposit`, and `PaymentRefund` written only by `payment.applySignal`, with a reconciliation check against `Payment.refundedMinor`.
8. The file is returned inline as base64 until the signed-URL transport of ADR 0033 exists.
9. Voucher dates are instants converted with `effectiveTimeZone` (ADR 0064).

## Rejected
- Direct Fortnox and Visma APIs first. Per-organization OAuth and certification for two vendors, against one file every vendor imports. A direct integration can follow behind the same vouchers (ADR 0087).
- Export each event only once. Replaced by date ranges at the user's request; the cost is that overlapping imports duplicate vouchers, so the preview warns.
- A ledger table in Bibi. It would duplicate facts invoices and payments hold (ADR 0051).
- Gate on `payment:read`. Organization-wide totals are broader than one order's payments.
- Money on the dashboard. Rejected, then briefly accepted (ADR 0079), then rejected again (ADR 0080). The dashboard shows only the overdue count.

## Consequences
- Vouchers are derived and only the exported file is a snapshot.
- Importing two overlapping files duplicates vouchers in the accounting program.
- A refund of a paid invoice reopens it as a receivable. It should be a credit; this needs a decision.
- A quote paid by card and later invoiced counts revenue twice. Needs a follow-up decision.
- VAT on deposits is covered by ADR 0093.
