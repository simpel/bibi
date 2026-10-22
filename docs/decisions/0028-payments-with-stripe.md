# 0028 – Payments with Stripe, Swish deferred

- **Date:** 2026-10-15
- **Status:** Accepted
- **Related:** 0029 (invoicing), 0051, 0057 (derived balance), 0058 (after commit), 0004
- **Spec:** `docs/specs/payments.md`

## Context
- A ticket created from a ticket template is paid by the customer through a payment link, or against invoice (ADR 0022, 0043). The customer only sees the payment page and never uses the app.
- A payment attaches to the ticket and records its own status. Payments do not move the ticket between phases.
- No provider was chosen (issue #16).

## Decision
- **Stripe** is the provider. Cards first; Swish through Stripe may be enabled later without a new provider.
- **Swish Handel direct is deferred.** It needs per-venue onboarding with a bank and is not required for the first venues.
- **Stripe Connect, one connected account per organization.** Venues get paid directly; Bibi never holds venue funds and can take an application fee later. Accounts v2, not the legacy account types.
- **Direct charges** on the connected account, so the venue is the merchant and Stripe carries the loss risk. Rejected: destination charges, which put negative-balance liability on Bibi. Never mix both.
- **A public payment page** outside login, addressed by an unguessable token, shows the amount and a Stripe-hosted checkout.
- **A signed webhook** runs a SYSTEM-only core operation, deduplicated on the Stripe event id; no surface can mark a payment paid.
- **A `PaymentProvider` interface** keeps the adapter replaceable (like `MailProvider`, ADR 0012). Invoices (ADR 0029) use the same Connect model.

## Consequences
- Swish for customers is out of the first release; update the `CLAUDE.md` differentiators when it is added.
- To confirm: the application fee (the open pricing question), Stripe's EU data handling, and the exact Accounts v2 responsibilities for fees and losses.

## Addenda
- 2026-10-19: a payment settles one receivable and balances are derived (ADR 0051, 0057). Stripe calls happen after commit (ADR 0058).
