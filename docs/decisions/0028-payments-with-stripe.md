# 0028 – Payments with Stripe, Swish deferred

- **Date:** 2026-10-15
- **Status:** Accepted

## Context
- A ticket created from a ticket template is paid by the customer through a payment link, or against invoice (ADR 0022, 0043). The customer only sees the payment page and never uses the app.
- A payment attaches to the ticket and records its own status. Payments do not move the ticket between phases.
- No provider was chosen (issue #16).

## Decision
- **Stripe** is the payment provider. Cards first; Stripe's Swish support may be enabled later without a new provider.
- **Swish Handel direct is deferred.** It needs per-venue onboarding with a bank and is not required for the first venues.
- **Public payment page:** a route outside login, addressed by an unguessable token. It shows the amount and a Stripe-hosted or embedded checkout. No personal data beyond what Stripe needs.
- **Webhook:** Stripe's signed webhook is verified (Zod at the boundary) and runs as a core operation per ADR 0003 that updates the payment as SYSTEM.
- **Idempotency:** events are deduplicated on the Stripe event id. A repeated event never applies a payment twice.
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
- A paid payment only sets the payment to `SUCCEEDED`. The ticket's phase is changed by staff.

## Public payment page
- The page is `/pay/<token>` (locale-prefixed by next-intl), outside the signed-in app. The token is `Payment.publicToken`: 32 random bytes, base64url, unique. It is not the payment id, so ids that staff see (audit log, MCP, GraphQL) never open the page. It is never part of the payment DTO and never logged.
- It is read through the SYSTEM-only operation `payment.getPublic` (no adapters, like `payment.applySignal`): the customer has no session and no surface may read a payment by token. One cross-organization lookup (token to organization, ADR 0004) pins the SYSTEM context. An unknown or malformed token is `NOT_FOUND`.
- The page shows organization name, ticket reference, amount, status and the Stripe-hosted checkout link. No customer or ticket details. A `PENDING` payment past `expiresAt` shows as expired without a pay link. Stripe returns to the same page, with `?checkout=success` after paying. The status comes from the webhook, so while it is still `PENDING` that return shows a "processing" state (no pay button) that refreshes itself every 3 seconds, up to 20 times, until the payment is `SUCCEEDED`.
- A Next page is not a `Request` handler, so `withRequestLogging` does not apply; the request context is opened with `runWithLogContext` (surface `web`, ADR 0014).

## Stripe after the commit (ADR 0058)
- `payment.create` inserts the `PENDING` row first and calls Stripe in its `external` step, after the commit, with the row id as idempotency key. A change preview of an AI proposal therefore never creates a checkout or sends an invoice. A refused charge leaves the row `FAILED`.

## Addendum 2026-10-19 – single source of truth (ADR 0051, 0057)
- A payment settles exactly one receivable: a sent quote, a deposit request or an invoice (`quoteId`, `depositId` or `invoiceId`). `payment.create` takes the receivable instead of a free amount; the amount defaults to the open balance and may be lower.
- Balances and receivable progress (`OPEN`, `PARTLY_PAID`, `PAID`, `OVERPAID`) are derived from `SUCCEEDED` payments minus refunds. Nothing stores a balance.
- `status`, `paidAt` and `refundedMinor` stay a mirror of Stripe, written only by `payment.applySignal`.
- The application fee is shown to the venue on every payment and in the published price list.
