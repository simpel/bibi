# 0100 – Payment providers as ports

- **Date:** 2026-11-09
- **Status:** Accepted
- **Amends:** 0028, 0029, 0087, 0090
- **Related:** 0051, 0052, 0056, 0057, 0058, 0077, 0093

## Context
- Stripe (card links, Connect) and Fortnox (OAuth, invoices, Topics stream) are wired by hand: one gateway singleton each, a table per provider (`PaymentAccount`, `IntegrationConnection`), four enums for the same providers and `=== "FORTNOX"` branches in core, worker, routes and UI. Adding Swish or Visma would touch all of them.
- Payments arrive two ways: Stripe through `payment.applySignal`, Fortnox written directly in `invoice.sync`.
- The lifecycle stops at "paid". Refunds and voids happen only in the provider, there are no credit notes, `invoice.void` does not reach Fortnox, a Fortnox invoice can also be charged on Stripe, and Fortnox payments are exported to SIE although Fortnox already books them.
- Venues want to offer card and Swish side by side and raise invoices in Fortnox or Visma.

## Decision
1. **Adapters behind ports.** A provider is one folder in `packages/core/src/providers/<key>/` that registers a `ProviderAdapter` with the capabilities it has: `connect` (OAuth, hosted onboarding or credentials), `collect` (payment methods, attempts, cancel, refund), `invoicing` (issue, void, credit, list payments, optionally register a payment) and `signals` (webhook, stream or poll). Core dispatches by provider key through one registry; no code outside a provider folder names a provider.
2. **One provider enum and one connection table.** `Provider` replaces `PaymentOperator`, `InvoiceProvider` and `IntegrationProvider`. `ProviderConnection` replaces `PaymentAccount` and `IntegrationConnection`: one row per organization and provider, with status, external account id and sealed credentials (ADR 0087's sealing).
3. **Routing by method.** `PaymentMethodRoute` maps each method (`CARD`, `SWISH`, `INVOICE`) to one connected provider. No row means the only connected provider that can take it; a route to a provider that is not connected is `CONFLICT`, never a silent switch. The pay page offers every routed method.
4. **Payment request and attempts.** A `Payment` is the request the customer pays (amount, receivable, public token). Each try at a provider is a `PaymentAttempt` with its own reference, link and expiry; the first that succeeds settles the payment. Attempts that expire in minutes (Swish) are started from the pay page.
5. **One inbound path.** Every provider event becomes a normalized `ProviderSignal` applied by SYSTEM-only `payment.applySignal`, `invoice.applySignal` or `integration.applySignal`, with idempotency in `ProviderEventReceipt (provider, eventId)`. Fortnox payment mirroring moves onto it.
6. **Bibi starts the rest of the lifecycle.** `payment.refund` (new permission `payment:refund`), `payment.cancel`, `payment.recordManual`, `invoice.void` reaching the provider and `invoice.credit` with a `CreditNote` (a snapshot of lines, ADR 0052). Each writes its row first and calls the provider after the commit (ADR 0058); the signal completes it. A refund is one `PaymentRefund` row with its own amount, and `refundedMinor` is derived (ADR 0057).
7. **A ledger provider owns its bookkeeping.** An invoice raised in a provider that keeps books (Fortnox, Visma) takes only payments that provider receives or can register, and the SIE export leaves its documents and payments out. Awaits an accountant's confirmation (as ADR 0093).
8. Swish Handel and Visma eEkonomi are added as adapters in the same change to prove the ports.

## Rejected
- **Keep one table and gateway per provider.** Every provider would repeat connection, token and signal handling, and the branches would grow with each one.
- **One provider per organization.** Venues want card and Swish at once.
- **Choose the provider per order.** Staff would have to pick a provider on every order; the route per method is set once by an admin.
- **Mirror only.** Staff would have to work in each provider's own app to refund, void or credit.
- **Poll Stripe.** Its webhooks already push every change.

## Consequences
- One migration renames and merges tables and backfills attempts, refund steps and routes. Old webhook and callback URLs stay as aliases, since they are registered at Stripe and Fortnox.
- Admins with a `paymentAccount:write` override get the same `integration:write` override, because Stripe connecting moves under `integration`.
- Swish certificates are per venue and sealed under `INTEGRATION_SECRET_KEY`. Swish callbacks are unsigned, so Bibi reads the payment again from Swish before applying it.
- `payment.create` with method `INVOICE` is removed; a Stripe invoice is a real invoice raised by `invoice.send`.
