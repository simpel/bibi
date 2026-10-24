# Payments with Stripe

Current behaviour. Why: ADR 0028 (provider and Connect), 0029 (invoicing), 0057 (derived balance), 0058 (after commit).

## Model
- `paymentAccount.startOnboarding` inserts the account row first (`stripeAccountId` null) and calls Stripe only after the commit (ADR 0058): a preview creates no connected account, and a call after a refused one resumes the row instead of creating a second account.
- Stripe is the provider, with Connect: one connected account per organization, direct charges on it (the venue is the merchant and Stripe carries the loss risk, not Bibi; never mix with destination charges). Accounts are created with the Accounts v2 API and onboarded through an account link started from organization settings. The platform account comes from `@bibi/config`.
- A `PaymentProvider` interface keeps the adapter replaceable (like `MailProvider`).
- A payment settles exactly one receivable: a sent quote, a deposit request or an invoice (`quoteId`, `depositId` or `invoiceId`). `payment.create` takes the receivable; the amount defaults to the open balance and may be lower.
- Nothing stores a balance. Paid = `SUCCEEDED` payments minus refunds; receivable progress (`OPEN`, `PARTLY_PAID`, `PAID`, `OVERPAID`) and the ticket balance are derived (`payment.balance`). `status`, `paidAt` and `refundedMinor` mirror Stripe and are written only by `payment.applySignal`. The application fee is stored per payment and shown to the venue.
- A paid payment only sets the payment to `SUCCEEDED`; staff change the ticket's status. Payments never move a ticket.
- `payment.create` inserts the `PENDING` row first and calls Stripe in its `external` step after commit, with the row id as idempotency key. A refused charge leaves the row `FAILED`. A change preview never creates a checkout or sends an invoice.

## Webhook
- `POST /api/webhooks/stripe`: one Connect webhook for the platform. The `Stripe-Signature` header is verified against the raw body with `STRIPE_WEBHOOK_SECRET` (HMAC-SHA256, constant-time, 5 minute window); without the secret it answers 503.
- The event is reduced to a signal and applied by SYSTEM-only operations (`payment.applySignal`, `paymentAccount.applySignal`) with no adapters, so no surface can mark a payment paid. The organization comes from the connected account the event happened on (the one cross-organization lookup, ADR 0004); the payment must belong to that account.
- Handled: `checkout.session.completed`, `checkout.session.async_payment_succeeded|failed`, `checkout.session.expired`, `invoice.paid`, `invoice.voided`, `charge.refunded`, `account.updated` and Accounts v2 `v2.core.account*`. Others are acknowledged and ignored. `invoice.payment_failed` is ignored on purpose: Stripe retries.
- Idempotency: the Stripe event id is claimed in the platform table `StripeWebhookEvent` before applying and released on failure so Stripe's retry is processed. A payment never moves backwards.

## Public payment page
- `/pay/<token>` (locale-prefixed, route group `(public)`), outside the signed-in app. The token is `Payment.publicToken`: 32 random bytes, base64url, unique. It is not the payment id, is never part of the payment DTO and never logged.
- Read through the SYSTEM-only `payment.getPublic` (one cross-organization lookup, token to organization). An unknown or malformed token is `NOT_FOUND`.
- Shows organization name, ticket reference, amount, status and the Stripe-hosted checkout link; no customer or ticket details. A `PENDING` payment past `expiresAt` shows as expired without a pay link. Stripe returns with `?checkout=success`; while the status is still `PENDING` the page shows a "processing" state that refreshes every 3 seconds up to 20 times.
- A Next page is not a `Request` handler, so the request context is opened with `runWithLogContext` (surface `web`).

## Not built
- Swish for customers (needs per-venue bank onboarding). Update the differentiators in `CLAUDE.md` when it is added.
- Open: the application fee amount, Stripe's EU data handling, the exact Accounts v2 responsibilities for fees and losses.
