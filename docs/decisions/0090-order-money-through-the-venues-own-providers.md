# 0090 – Order money through the venue's own providers

- **Date:** 2026-11-02
- **Status:** Accepted
- **Amends:** 0028, 0029, 0087
- **Amended by:** 0100 (providers as ports: one connection table, routes per method, payment attempts, refunds, credit notes), 0106 (the ledger provider issues every money document; Bibi numbers nothing, no SIE or own vouchers; orders are business or private)
- **Related:** 0051, 0052, 0057, 0058, 0077, 0091, 0093
- **Spec:** `docs/specs/payments.md`

## Context
- Bibi must never sit in the money flow for orders. Customers pay the venue, into its own Stripe or against an invoice in its own Fortnox. Bibi sends links and invoices and mirrors what happened.
- ADR 0028 already charges directly on the venue's connected account. Missing: a deposit rule, Fortnox invoices, invoices that count a paid deposit and a choice of invoice provider.
- Neither Stripe nor Fortnox has a "deposit percentage" setting, so the rule lives in Bibi.

## Decision
1. Money stays with the venue. Card payments are direct charges on its connected account. Invoices are raised in its Stripe or its Fortnox. Bibi never holds, routes or pays out order money. Refunds are made in the provider and mirrored.
2. Stripe moves to Settings, Integrations next to Fortnox. Payments settings hold the deposit rule and the invoice provider.
3. The deposit rule is an admin setting (`PaymentSettings`): a percentage and a minimum below which an order is paid in full. A deposit keeps the amount it was created with (a snapshot, ADR 0057).
4. Deposits are collected with payment links and need an active Stripe account.
5. `PaymentSettings.invoiceProvider` is `STRIPE` or `FORTNOX`. `invoice.send` raises the invoice there after commit (ADR 0058). The SIE export stays available.
6. A final invoice deducts paid deposits. The invoice stays billed at the gross total and `amountDueMinor` is what payments settle.
7. Fortnox invoicing asks for the `invoice`, `customer` and `payment` scopes in addition; connected organizations reconnect once. Customers are matched by email, then name.
8. Fortnox payments are pushed, not polled. The worker keeps one WebSocket to Fortnox's Topics API for all connected organizations and records payments idempotently. A last-applied offset per topic lets a restart resume within Fortnox's 14-day replay window, and a catch-up at worker start covers longer gaps.
9. `Payment` and `Invoice` get a `provider`. Card checkouts exist only on Stripe.

## Rejected
- Deposit rule from Stripe or Fortnox. Neither has one.
- Deduct deposits by voiding and re-raising them. A paid deposit is a settled receivable (ADR 0057).
- Poll Fortnox on a timer. It spends rate limit on unchanged invoices.
- One WebSocket per organization. Fortnox asks for one connection for all customers.
- Take payments on Bibi's account and pay venues out. Bibi would hold venue funds and carry the loss risk.

## Consequences
- Without an active Stripe account there are no payment links and no invoice fallback for deposits; they refuse with `CONFLICT` (addendum 2026-11-02).
- Fortnox payments are written inside `invoice.sync`, also a user operation, rather than only through `payment.applySignal`.
- `invoice.void` does not reach Fortnox. A cancelled Fortnox invoice with a mirrored payment stays `SENT`.
- Each deducted deposit is a negative Fortnox row on the customer advances account, split by VAT rate (ADR 0093).
