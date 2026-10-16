# 0028 – Payments with Stripe, Swish deferred

- **Date:** 2026-10-15
- **Status:** Accepted

## Context
- A quick booking is paid by the customer through a payment link, or against invoice (ADR 0022). The customer only sees the payment page and never uses the app.
- The booking moves to `CONFIRMED` when payment is complete.
- No provider was chosen (issue #16).

## Decision
- **Stripe** is the payment provider. Cards first; Stripe's Swish support may be enabled later without a new provider.
- **Swish Handel direct is deferred.** It needs per-venue onboarding with a bank and is not required for the first venues.
- **Public payment page:** a route outside login, addressed by an unguessable token. It shows the amount and a Stripe-hosted or embedded checkout. No personal data beyond what Stripe needs.
- **Webhook:** Stripe's signed webhook is verified (Zod at the boundary) and runs as a core operation per ADR 0003 that calls `booking.changeStatus` as SYSTEM.
- **Idempotency:** events are deduplicated on the Stripe event id. A repeated event never changes a booking twice.
- **Stripe Connect, one connected account per organization.** Venues get paid directly. Okazi never holds venue funds and can take an application fee later.
  - Platform account: set via `@okazi/config`, never hard-coded.
  - Connected accounts are created with Stripe's Accounts v2 API (capabilities, responsibilities and dashboard properties), not the legacy Standard/Express/Custom types.
  - Venue onboarding runs through a Stripe account link started from organization settings.
- **Charge type: direct charges** on the connected account, so the venue is the merchant and Stripe carries the loss risk, not Okazi. Destination charges would put negative-balance liability on Okazi. Do not mix both.
- Invoices (ADR 0029) use the same Connect model: direct charge on the connected account, optional application fee.
- A `PaymentProvider` interface (like `MailProvider`, ADR 0012) keeps the adapter replaceable.

## Consequences
- Follow-up tickets: Connect onboarding (account per organization), Payment model, public payment page, webhook operation, `PaymentProvider` adapter.
- **To confirm in the follow-up:** the application fee (see the open pricing question), Stripe's EU data handling, and the exact Accounts v2 responsibilities for fees and losses.
- Swish for customers is out of the first release. Update `CLAUDE.md` differentiators when it is added.

## Webhook implementation (#119)
- Endpoint `POST /api/webhooks/stripe`, one Connect webhook for the platform. The `Stripe-Signature` header is verified against the raw body with `STRIPE_WEBHOOK_SECRET` (HMAC-SHA256, constant-time, 5 minute window); without the secret the endpoint answers 503.
- The event is reduced to a signal and applied by SYSTEM-only operations (`payment.applySignal`, `paymentAccount.applySignal`), like `inboundEmail.receive` (ADR 0012): no adapters, so no surface can mark a payment paid. The organization comes from the connected account the event happened on, the one cross-organization lookup (ADR 0004); the payment must belong to that account.
- Events handled: `checkout.session.completed` (paid), `checkout.session.async_payment_succeeded|failed`, `checkout.session.expired`, `invoice.paid`, `invoice.voided`, `charge.refunded`, `account.updated` and Accounts v2 `v2.core.account*` events. Other events are acknowledged and ignored. `invoice.payment_failed` is ignored on purpose: Stripe retries the invoice.
- Idempotency: the Stripe event id is claimed in the platform table `StripeWebhookEvent` before the event is applied and released again on a failure, so Stripe's retry is processed. A payment never moves backwards.
- A paid payment confirms a tentative booking through `booking.changeStatus` to the organization's default `CONFIRMED` status, so its transitions and the coordinator rule still apply. If that is refused the payment stays `SUCCEEDED`, the refusal is logged and staff confirm by hand.
