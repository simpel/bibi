# 0057 – What is owed and paid is derived; payments settle something

- **Date:** 2026-10-19
- **Status:** Accepted
- **Related:** 0028 (payments with Stripe), 0029 (invoicing via Stripe), 0051, 0052

## Context
- `payment.create` takes a free `amountMinor`. A payment is linked to the ticket only, not to a quote, deposit or invoice. Nothing says what it pays for.
- `Deposit` and `Invoice` are modelled with their own `status` and amounts but are not built. Built as modelled, each would hold a status that duplicates the sum of its payments.
- `Payment.refundedMinor` and `status` mirror Stripe. That is correct (Stripe owns them) as long as only the signal path writes them.

## Decision
1. **Receivables are snapshots.** A sent quote (ADR 0052), a deposit request and an invoice are frozen documents. Each has a fixed amount, set once.
2. **Payments settle a receivable.** `Payment` gets exactly one of `quoteId`, `depositId` or `invoiceId` as a foreign key. A payment for "something else" is a deposit request with its own description.
3. **Nothing stores a balance.** These are all derived:
   - paid = sum of `SUCCEEDED` payments minus refunds, per receivable,
   - receivable status (`OPEN`, `PARTLY_PAID`, `PAID`, `OVERPAID`),
   - the ticket's balance = accepted quote (or invoices once invoiced) minus settled deposits and payments.
   `Deposit.status` and `Invoice.status` keep only owned lifecycle facts (`DRAFT`, `SENT`, `VOID`). Payment progress is derived.
4. **Stripe owns payment facts.** `Payment.status`, `paidAt` and `refundedMinor` are a mirror written only by `payment.applySignal` (as today). An invoice raised in Stripe is owned by Stripe too, and our `Invoice` row mirrors its number and status.
5. **External calls happen after commit.** A payment row is inserted as `PENDING` first. The provider call runs after the transaction commits, with the row id as idempotency key, and never runs during a preview or dry run. Fixed in the payment-preview session; this ADR records the rule for all external effects (mail, Stripe, later Fortnox).
6. The application fee is stored per payment (owned, it was agreed at charge time) and shown to the venue on each payment and in the published price list.

## Consequences
- `payment.create` takes a receivable id instead of a free amount (the amount defaults to the open balance and may be lower for partial payment).
- Reports on revenue and outstanding money are queries, not stored counters.
- ADR 0028 and 0029 get addenda when this is accepted.
