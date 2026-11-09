# 0028 – Payments with Stripe, Swish deferred

- **Date:** 2026-10-15
- **Status:** Accepted
- **Amended by:** 0100 (providers as ports: one connection table, routes per method, payment attempts, refunds, credit notes)
- **Related:** 0029 (invoicing), 0051, 0057 (derived balance), 0058 (after commit), 0004
- **Spec:** `docs/specs/payments.md`

## Context
- A customer pays an order through a payment link or against invoice. The customer only sees the payment page and never uses the app.
- A payment attaches to the order and has its own status. It never moves the order between phases.
- Money is costly to reverse: the provider, the account model and who carries loss risk are hard to change once venues are onboarded.

## Decision
1. Stripe is the provider. Cards first. Swish through Stripe can be enabled later without a new provider.
2. Swish Handel direct is deferred. It needs per-venue bank onboarding.
3. Stripe Connect with one connected account per organization (Accounts v2). Venues are paid directly and Bibi never holds venue funds.
4. Direct charges on the connected account, so the venue is the merchant and carries the loss risk. Never mix with destination charges.
5. A public payment page, addressed by an unguessable token, shows the amount and a Stripe-hosted checkout.
6. A signed webhook runs a SYSTEM-only core operation, deduplicated on the Stripe event id. No surface can mark a payment paid.
7. A `PaymentProvider` interface keeps the adapter replaceable, like `MailProvider` (ADR 0012).

## Rejected
- Destination charges: they put negative-balance liability on Bibi.
- Swish Handel direct: too much onboarding for the first venues.
- Legacy Stripe account types: Accounts v2 is the supported model.

## Consequences
- Swish for customers is out of the first release.
- A payment settles one receivable and balances are derived (ADR 0057). Stripe calls happen after commit (ADR 0058).
- Still to confirm: the application fee, Stripe's EU data handling and the Accounts v2 fee and loss responsibilities.
