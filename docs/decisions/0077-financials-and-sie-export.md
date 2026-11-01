# 0077 – Financials overview and SIE-4 export

- **Date:** 2026-11-01
- **Status:** Accepted
- **Related:** 0029 (invoicing, defers Fortnox/Visma), 0036 (sidebar, amends), 0041 (dashboard defers money, amends), 0033 (binary export), 0024 (export), 0050 (permissions), 0051, 0052, 0056, 0057, 0064, 0071

## Context
- A venue's accounting system is its book of record. Bibi holds the sub-ledger facts: invoices (frozen `OrderLine` rows with `vatRows` per rate), deposits and Stripe-mirrored payments. It has no accounts and no ledger.
- ADR 0029 deferred Fortnox, Visma and Peppol, since each needs per-organization OAuth and certification. Lega and Caspeco advertise accounting integration, and venues expect it.
- SIE-4 is the Swedish standard file for moving vouchers between systems. Type 4I (import) needs only `#VER`/`#TRANS`, may leave series and voucher number empty (the receiving program numbers them), must be PC8 (codepage 437) and every voucher must sum to zero (SIE 4B §11, `#VER`, `#TRANS`, `#FORMAT`). One file covers Fortnox, Visma/Spiris, Bokio, Björn Lundén, Hogia and others.
- ADR 0041 reserves the dashboard's money panel until revenue has a decided basis. ADR 0036 gives payments and invoices no menu entry.
- Facts are missing: an invoice's or deposit's send date is lost when `statusChangedAt` is overwritten on VOID, and a refund has no date or row of its own (only the running `Payment.refundedMinor`).

## Decision
1. **A top-level Financials page** at `/financials/{from}/{to}` (period in the path, ADR 0064), in the `primary` nav group. It shows four KPIs (invoiced, received, outstanding, overdue) and four charts: invoiced vs received per month, receivables aging (not due, 1–30, 31–60, 60+ days overdue, with the overdue list), forward-booked value (accepted quotes not yet invoiced, by event month) and revenue by item type with VAT per rate. Each chart has a table beside it. One read model, `finance.overview({ from, to })`, on every surface (ADR 0003, 0071).
2. **Revenue basis is accrual.** Invoiced = SENT invoices by send date, excluding VAT. Received = settled payments by `paidAt`, minus refunds by refund date. Paid and open amounts come from the one money module (`features/payment/settlement.ts`, ADR 0057), extended with an organization-wide query. Nothing is stored.
3. **A new permission feature `finance`** (`read`, `write`). Managers and admins have it by default; members do not. Exporting is `write` (ADR 0050).
4. **Account mapping is organization data.** `AccountingSettings` (one row per organization) holds the receivable, payment clearing, customer advance, fee, rounding and default revenue accounts, one output VAT account per rate, and the fiscal year's first month. A new row is prefilled with BAS defaults (1510, 1580, 2420, 6570, 3740, 3001; 2611/2621/2631). The revenue account inherits: item → item type → organization default (`null` = inherit, ADR 0051). Set in Settings → Accounting.
5. **Vouchers are derived from facts**, one per event, each summing to zero:
   - invoice sent: receivables (incl. VAT) against revenue per account and VAT per rate from `vatRows`; deposits paid on the ticket move from customer advances to receivables;
   - invoice voided after it was exported: the reversal;
   - payment: clearing against receivables (invoice), customer advances (deposit) or revenue and VAT pro rata from the accepted quote (quote paid by card);
   - refund: the reverse of its payment, on the refund date;
   - application fee: fee expense against clearing.
   The ticket reference is `#OBJEKT` in dimension 6 (Projekt). Voucher text holds the invoice number and ticket reference, never customer or guest names.
6. **Exports are incremental batches.** `accountingExport.create` (a command: AI proposes, staff approve, audited) writes every event not exported before into one SIE 4I file. `AccountingExport` snapshots the file bytes; `AccountingExportEntry` records each source event once (unique on kind and source id, ADR 0056). Re-downloading returns the same bytes. Re-importing a batch never duplicates vouchers, because the next batch holds only new events. `accountingExport.preview` lists what is pending and what blocks an export (an unmapped account, no organization number).
7. **New owned facts.** `Invoice` and `Deposit` get `sentAt` and `voidedAt`. `PaymentRefund` (amount, date, provider refund id) is written only by `payment.applySignal`; `Payment.refundedMinor` stays the Stripe mirror and gets a reconciliation check against the sum of refunds.
8. **Transport is inline bytes for now.** `accountingExport.download` returns `{ filename, mime, size, contentBase64 }`, like `ticket.export` returns inline content, because ADR 0033's signed URL is not built. The file is a few hundred kilobytes at most. Moving to the signed URL is a follow-up.
9. **Dates are local.** A voucher date is the instant converted with `effectiveTimeZone` (ADR 0064).

## Consequences
- Core: features `finance` and `accountingExport` and `accountingSettings`; a pure SIE writer in `packages/core/src/accounting/sie4/` with its own CP437 table (no new dependency). GraphQL, REST, MCP and web for every operation (parity). Generative UI for the overview and an export.
- Data: migrations for `sentAt`/`voidedAt` (backfilled from `statusChangedAt` where SENT), `PaymentRefund`, `AccountingSettings`, `revenueAccount` on item type and item, and the export tables.
- Web: Financials nav entry, page, Export SIE dialog and history table; Settings → Accounting. `@bibi/ui` gets chart components on the existing recharts `ChartContainer`.
- Demo seed: a year of invoices, payments, deposits, one refund, accounting defaults and one export batch.
- On acceptance: addenda on 0029 (SIE export covers the deferred integration until a direct one is needed), 0036 (Financials is a menu entry) and 0041 (money lives on Financials, not the dashboard); `docs/domain-model.md` and its artifact; the CLAUDE.md differentiator wording for Fortnox/Visma.
- Not covered: Stripe processing fees and payouts (needs Stripe balance transactions), the cash method, VAT on advance payments for deposits, the customer ledger (SIE carries none, so payments are matched to invoices by text).

## Alternatives rejected
- **Direct Fortnox and Visma APIs first.** Rejected for now: per-organization OAuth, secrets and certification for two vendors, against one file every vendor imports. A direct integration can come later behind the same vouchers.
- **Regenerate by period.** Simpler, but re-importing a period duplicates vouchers in the accounting program and a later void has nowhere to go.
- **A ledger table in Bibi.** Rejected: it would duplicate facts the invoices and payments already hold (ADR 0051). Vouchers are derived and only the exported file is a snapshot.
- **Snapshot the revenue account on each order line.** Rejected for now: the mapping is resolved once, at export, and the batch freezes it.
- **Gate on `payment:read`.** Rejected: financial totals for the whole organization are broader than one ticket's payments.
- **Money on the dashboard.** Rejected: the dashboard is the operational state (ADR 0041); finance has its own audience and permission.

## Addendum 2026-11-01 – exports report a date range
Supersedes decision 6 and the rejected "Regenerate by period" alternative, at the user's request: staff choose the range, and the same range can be exported several times.
- `accountingExport.preview` and `create` take `{ from, to }` (plain days, inclusive, at most 24 months like the overview). Pressing Export SIE opens a dialog with the two dates (the page's period as default) and a live preview.
- A file holds every event dated in the range, whether exported before or not: invoices by `sentAt`, voids by `voidedAt` (a void always reverses a send, whenever it was), payments and fees by `paidAt`, refunds by refund date. The "exported once" rule and the unique keys on `AccountingExportEntry` are gone; an entry now means "this export contained this event".
- `AccountingExport` keeps `periodStart` and `periodEnd` (instants, end exclusive, in the organization's zone; null on files made before ranges) and shows the range in the history. The fiscal year in the file (`#RAR`) is the one holding the range's first day.
- The cost: importing two files that overlap duplicates vouchers in the accounting program. The preview says how many earlier exports overlap (`earlierExports`) and the dialog warns. Re-downloading an old file still returns the same bytes.
- Concurrent exports are still refused by the unique `(organizationId, number)`.

## Addendum 2026-11-01 – as built
- Revenue accounts are a finance-owned `RevenueAccount` table (one row per item type or per item, exactly one set), not columns on item type and item as Consequences says. Inheritance is unchanged: item, then item type, then `AccountingSettings.revenueAccount`.
- The demo seed has two invoices (Lindholmen L1 paid, L2 overdue) and one export, but no refund yet; refunds are covered by tests.
- A payment against a quote is booked as a sale; if the same ticket is later invoiced, the revenue counts twice. Card-paid predefined tickets are the case it is built for; invoicing a quote-paid ticket needs a follow-up decision.

## Addendum 2026-11-01 – a year of demo history
- The demo seed now has a year of invoices, payments and one refund (L16–L28, `docs/demo-seed.md`), dated through the context clock (ADR 0064 addendum), as Consequences asked.
- Found while seeding: a refund of an invoice payment reopens the invoice, so a paid invoice with a partial refund shows the refunded amount as open and overdue (L19). A refund of a paid invoice should be a credit, not a new receivable; this needs a decision (credit note or a settlement rule).

## Addendum 2026-11-01 – money on the dashboard (ADR 0079)
- "Money on the dashboard" is no longer rejected: the dashboard shows a panel from `finance.overview`, gated by `finance:read`. Financials stays the full view and the only home of the export.
