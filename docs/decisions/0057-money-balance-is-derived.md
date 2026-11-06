# 0057 – What is owed and paid is derived; payments settle something

- **Date:** 2026-10-19
- **Status:** Accepted
- **Related:** 0028 (payments with Stripe), 0029 (invoicing via Stripe), 0051, 0052

## Context
- A payment took a free amount and was linked to the order only, so nothing said what it paid for.
- Deposits and invoices were modelled with their own status and amounts. Built as modelled, each would hold a status duplicating the sum of its payments.
- Stripe owns payment status and refunds. That mirror is correct as long as one path writes it.

## Decision
1. Receivables are snapshots. A sent quote (ADR 0052), a deposit request and an invoice are frozen documents with a fixed amount.
2. A payment settles exactly one receivable: a quote, a deposit or an invoice. A payment for something else is a deposit request with its own description.
3. Nothing stores a balance. Paid per receivable, receivable status (`OPEN`, `PARTLY_PAID`, `PAID`, `OVERPAID`) and the order balance are derived. Deposit and invoice status keep only owned lifecycle facts (`DRAFT`, `SENT`, `VOID`).
4. Stripe owns payment facts. Status, paid time and refunded amount are a mirror written only by `payment.applySignal`. An invoice raised in Stripe is owned by Stripe, and our row mirrors its number and status.
5. External calls run after commit (ADR 0058).
6. The application fee is stored per payment, because it was agreed at charge time.

## Rejected
- Stored balances or receivable statuses: they duplicate the sum of payments and drift.
- A free-amount payment tied only to the order: it settles nothing.

## Consequences
- `payment.create` takes a receivable id. The amount defaults to the open balance and may be lower for a partial payment.
- Revenue and outstanding-money reports are queries, not counters.
