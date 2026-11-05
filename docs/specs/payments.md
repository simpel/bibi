# Payments with Stripe

Current behaviour. Why: ADR 0028 (provider and Connect), 0029 (invoicing), 0057 (derived balance), 0058 (after commit).

## Model
- `paymentAccount.startOnboarding` inserts the account row first (`stripeAccountId` null) and calls Stripe only after the commit (ADR 0058): a preview creates no connected account, and a call after a refused one resumes the row instead of creating a second account.
- Stripe is the provider, with Connect: one connected account per organization, direct charges on it (the venue is the merchant and Stripe carries the loss risk, not Bibi; never mix with destination charges). Accounts are created with the Accounts v2 API and onboarded through an account link started from Settings → Integrations, next to Fortnox (ADR 0090). Customers pay the venue's own account; Bibi never holds order money. The platform account comes from `@bibi/config`.
- A `PaymentProvider` interface keeps the adapter replaceable (like `MailProvider`).
- A payment settles exactly one receivable: a sent quote, a deposit request or an invoice (`quoteId`, `depositId` or `invoiceId`). `payment.create` takes the receivable; the amount defaults to the open balance and may be lower.
- Nothing stores a balance. Paid = `SUCCEEDED` payments minus refunds; receivable progress (`OPEN`, `PARTLY_PAID`, `PAID`, `OVERPAID`) and the order balance are derived (`payment.balance`). `status`, `paidAt` and `refundedMinor` mirror Stripe and are written only by `payment.applySignal`. The application fee is stored per payment and shown to the venue.
- A paid payment only sets the payment to `SUCCEEDED`; staff change the order's status. Payments never move an order.
- `payment.create` inserts the `PENDING` row first and calls Stripe in its `external` step after commit, with the row id as idempotency key. A refused charge leaves the row `FAILED`. A change preview never creates a checkout or sends an invoice.

## Webhook
- `POST /api/webhooks/stripe`: one Connect webhook for the platform. The `Stripe-Signature` header is verified against the raw body with `STRIPE_WEBHOOK_SECRET` (HMAC-SHA256, constant-time, 5 minute window); without the secret it answers 503.
- The event is reduced to a signal and applied by SYSTEM-only operations (`payment.applySignal`, `paymentAccount.applySignal`) with no adapters, so no surface can mark a payment paid. The organization comes from the connected account the event happened on (the one cross-organization lookup, ADR 0004); the payment must belong to that account.
- Handled: `checkout.session.completed`, `checkout.session.async_payment_succeeded|failed`, `checkout.session.expired`, `invoice.paid`, `invoice.voided`, `charge.refunded`, `account.updated` and Accounts v2 `v2.core.account*`. Others are acknowledged and ignored. `invoice.payment_failed` is ignored on purpose: Stripe retries.
- Idempotency: the Stripe event id is claimed in the platform table `StripeWebhookEvent` before applying and released on failure so Stripe's retry is processed. A payment never moves backwards.

## Public payment page
- `/pay/<token>` (locale-prefixed, route group `(public)`), outside the signed-in app. The token is `Payment.publicToken`: 32 random bytes, base64url, unique. It is not the payment id, is never part of the payment DTO and never logged.
- Read through the SYSTEM-only `payment.getPublic` (one cross-organization lookup, token to organization). An unknown or malformed token is `NOT_FOUND`.
- Shows organization name, order reference, amount, status and the Stripe-hosted checkout link; no customer or order details. A `PENDING` payment past `expiresAt` shows as expired without a pay link. Stripe returns with `?checkout=success`; while the status is still `PENDING` the page shows a "processing" state that refreshes every 3 seconds up to 20 times.
- Under the amount it lists what is paid for: the lines of the quote or invoice the payment settles, read only from that document's frozen `OrderLine` rows (ADR 0052), never the order's live lines, plus its totals (excl. VAT, VAT, incl. VAT, "from" while an alternative group is unchosen). Each line has name, quantity, unit price, discount, VAT rate, line total, `role` and `inTotal`; sub-lines (ADR 0088) follow their parent and are indented, an add-on or option labelled, a part shown without price. No ids, item, tags or anything the document did not show. A deposit payment has no lines (`lines: []`, `totals: null`). The pinned SYSTEM context may read `payment` and `quote` (ADR 0071) and reads only that payment's document in the token's organization.
- A Next page is not a `Request` handler, so the request context is opened with `runWithLogContext` (surface `web`).

## Refunds and dates (ADR 0077)
- A refund signal (`charge.refunded`) appends one `PaymentRefund` row through `payment.applySignal`: the step, the refunded total after it and `refundedAt`, the time the signal was applied. A repeated signal with the same total adds no row. `Payment.refundedMinor` stays the Stripe mirror; the `payment refunds` reconciliation checks that the rows sum to it.
- `Invoice` and `Deposit` keep `sentAt` (set by send) and `voidedAt` (set by void). A void keeps `sentAt`. These dates are the accounting dates of the SIE vouchers.

## Deposit rule and invoice provider (ADR 0090)
- The venue's money stays with the venue: card payments and invoices go to its own Stripe or Fortnox. Bibi sends the links and mirrors the results.
- `PaymentSettings` (one row per organization) holds the deposit rule (`depositPercent`, 1–100, and `depositMinimumMinor`) and the `invoiceProvider` (`STRIPE` or `FORTNOX`, null = whichever is connected). `paymentSettings.get|update` use `paymentAccount:read|write`.
- `deposit.suggest` applies the rule to the order's live priced lines incl. VAT and returns the basis (`PERCENT`, `FULL` for an order under the minimum, or `NONE`) and the amount. `deposit.request` creates the deposit, sends it and creates a `CARD` payment against it in one step, and returns the payment with its `/pay` link. Its amount defaults to the rule.
- Settings → Payments holds the rule and the invoice provider. The Stripe connection is on Settings → Integrations, next to Fortnox.
- A final invoice deducts the order's paid deposits (ADR 0090): `invoice.create` freezes one `InvoiceDeposit` per deposit that is not VOID and has something paid, at what is paid on it then. The invoice's `amountDueMinor` (total incl. VAT minus the deductions) is what payments settle, what the order's receivables, aging and the pay page show, and the default of `payment.create`. The order is still billed the gross total, so its balance is unchanged. The SIE voucher moves exactly the deducted amounts from customer advances to receivables and reverses the VAT reported when each deposit was paid. A deposit paid after the invoice was created is not deducted; void and recreate the invoice.
- `paymentAccount.disconnect` (admin) sets `PaymentAccount.disconnectedAt`: the account reads `DISCONNECTED`, nothing is charged on it, and links already sent keep working until they expire and are still recorded by the webhook. `status` keeps mirroring Stripe. `paymentAccount.startOnboarding` clears it and resumes the same Stripe account. Settings → Integrations shows one card per provider (Stripe, Fortnox, API keys) in a grid of up to three columns.
- Without an active Stripe account there are no payment links: `deposit.request` and `payment.create` refuse with `CONFLICT`, and `deposit.suggest` returns `paymentLinksAvailable: false`. The order's payment-link buttons then show dimmed, and a click explains that an administrator connects Stripe under Settings → Integrations.

## VAT on deposits (ADR 0093)
- `deposit.create` and `deposit.request` snapshot `Deposit.vatRows`: the order's live priced lines (what `deposit.suggest` totals) summed per VAT rate and scaled to the amount incl. VAT, summing to it. An order without priced lines gives `[]` (no VAT). Deposits created before ADR 0093 keep `[]`.
- SIE: a deposit payment debits clearing and credits customer advances excl. VAT plus output VAT per rate, the paid amount split pro rata. A refund is its negation. The invoice voucher debits customer advances excl. VAT and that output VAT for each deduction, against receivables, so advances net to zero and VAT totals the invoice's.
- The treatment awaits an accountant's confirmation (ADR 0093 decision 6).

## Invoices in Fortnox (ADR 0090)
- `invoice.send` raises the invoice where `PaymentSettings.invoiceProvider` says (`invoice/invoice-provider.ts`): the setting; else Fortnox when only Fortnox is connected; else Stripe when the Stripe account is active; else nowhere. Fortnox chosen but not connected is `CONFLICT`. With Stripe or nowhere nothing is raised: the customer pays through a payment requested with `payment.create`. The provider is stored on `Invoice.provider`.
- Raising runs after the commit (ADR 0058). A failure leaves the invoice `SENT` without `providerReference`; `invoice.sync` raises it again.
- The customer is found by email, then by name, and created if missing (Bibi customers have no organization number). Each line is one row on its revenue account, as the SIE export resolves it; a bundle with several VAT rates has one row per rate. Each deducted deposit is one negative row per VAT rate of its `vatRows` on the customer advances account, priced excl. VAT (ADR 0093); a deposit without a split is one row without VAT. The invoice is booked, and emailed when the customer has an email. Fortnox's document number is `Invoice.providerReference`.
- `invoice.sync` mirrors the payments booked on the invoice: a new one becomes a `SUCCEEDED` payment with method `INVOICE`, `provider` `FORTNOX` and `providerReference` `fortnox:<organizationId>:<payment number>`; a changed one is updated; one no longer in Fortnox is `CANCELLED`. `providerAccountId` is null for these payments.
- Pushed, not polled: the worker keeps one Fortnox Topics connection for every connected company (`apps/worker/CLAUDE.md`). Payment events run `invoice.sync`; `invoice-cancelled-v1` runs `invoice.void`, which voids the Bibi invoice only. Events for invoices Bibi did not raise are ignored. The stream's offset per topic is in `FortnoxTopicOffset`. On worker start, when the stream has been away longer than 14 days or never ran, every `SENT` Fortnox invoice is re-read.
- Fortnox needs the scopes `companyinformation invoice customer payment`; connected organizations reconnect once (ADR 0087).

## Not built
- Swish for customers (needs per-venue bank onboarding). Update the differentiators in `CLAUDE.md` when it is added.
- Open: the application fee amount, Stripe's EU data handling, the exact Accounts v2 responsibilities for fees and losses.
