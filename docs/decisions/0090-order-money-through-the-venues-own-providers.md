# 0090 – Order money through the venue's own providers

- **Date:** 2026-11-02
- **Status:** Accepted (approved by the user on 2026-11-02)
- **Amends:** 0028 (payments), 0029 (invoicing), 0087 (Fortnox connection)
- **Related:** 0051, 0052, 0057, 0058, 0077, 0091 (Bibi's own billing)

## Context
- Bibi must never sit in the money flow for orders. A venue's customers pay the venue: into the venue's own Stripe, or against an invoice raised in the venue's Fortnox. Bibi sends links and invoices and mirrors what happened, so balances and finance figures are correct.
- ADR 0028 already charges directly on the venue's connected account. What is missing is a deposit rule, invoices in Fortnox, invoices that count a paid deposit, a choice of invoice provider, and the Stripe connection sitting next to Fortnox.
- Neither Stripe nor Fortnox has an organization setting for "deposit percentage" or "pay in full below an amount", so the rule has to live in Bibi.

## Decision
1. **Money stays with the venue.** Card payments are direct charges on the venue's Stripe connected account (ADR 0028, unchanged). Invoices are raised in the venue's Stripe or the venue's Fortnox. Bibi never holds, routes or pays out order money. Refunds are made in the provider; Bibi mirrors them.
2. **Stripe moves to Settings → Integrations,** as a card next to Fortnox with the same layout (status, facts, connect/continue/refresh). Settings → Payments becomes the page for the deposit rule and the invoice provider. The onboarding return URL points to Integrations.
3. **Deposit rule, an admin setting** on a new org-scoped `PaymentSettings` row (owned columns, ADR 0051):
   - `depositPercent` (0–100, `null` = no deposits),
   - `depositMinimumMinor`: an order whose total incl. VAT is below this is paid **in full up front** instead of by deposit.
   - `deposit.create` without an amount fills it from the rule: `round(total × percent)` or, under the minimum, the full total. Staff may override the amount; the deposit keeps whatever it was created with (a snapshot, ADR 0057).
4. **Deposits are collected with `/pay` links.** Requesting a deposit creates the `Deposit` and a `CARD` payment against it in one step, and returns the link. It needs an active Stripe account; without one the deposit is sent as an invoice through the invoice provider (5).
5. **Invoice provider.** `PaymentSettings.invoiceProvider` is `STRIPE` or `FORTNOX`. When only one is connected, that one is used; when both are, the admin picks. `invoice.send` raises the invoice there after commit (ADR 0058). The SIE export (ADR 0077) stays available for every organization.
6. **A final invoice deducts paid deposits.** At create, the invoice snapshots the order's lines plus one deduction line per settled deposit of the order ("Deposit paid", negative, the deposit's VAT split). Its total is what is still owed. A deposit paid after the invoice was created is not deducted; staff void and recreate.
7. **Fortnox invoicing.** The Fortnox connection asks for the `invoice`, `customer` and `payment` scopes in addition to `companyinformation`; connected organizations reconnect once. `invoice.send` finds or creates the Fortnox customer (by organization number, else name), creates the invoice with Bibi's lines as rows and books it. The Fortnox document number is mirrored on the invoice.
8. **Mirroring payments.**
   - Stripe: the existing Connect webhook (ADR 0028), unchanged.
   - Fortnox: pushed, not polled. `apps/worker` keeps **one** WebSocket to Fortnox's Topics API (`wss://ws.fortnox.se/topics-v1`) for every connected organization, as Fortnox asks (one connection for all customers). It adds each organization as a tenant with its access token and the app's client secret, re-adds it when the token is refreshed (ADR 0087), and subscribes to the `invoices` topic.
   - On `invoicepayment-bookkeep-v1` or `invoicepayment-deleted-v1` for an invoice Bibi raised, the worker fetches that one invoice's payments and records them through the same SYSTEM-only `payment.applySignal` path, so no surface can mark anything paid. `invoice-cancelled-v1` voids the mirror. Other events are ignored. A Fortnox payment becomes a `Payment` row with method `INVOICE` and provider `FORTNOX`.
   - Delivery is at-least-once and ordered per topic. The last applied offset is stored per topic (a platform row), so a restart resumes where it stopped; Fortnox replays up to 14 days back. `applySignal` is idempotent on the Fortnox payment number, so duplicates are harmless.
   - Gaps: a Refresh action on the order reads that invoice on demand. A daily sweep re-reads open Fortnox invoices only when the stream has been down for longer than the 14-day replay window. Nothing polls on a timer otherwise.
9. **`Payment` and `Invoice` get a `provider`** (`STRIPE` | `FORTNOX`). `PaymentProvider` is implemented by a Stripe and a Fortnox adapter; the registry picks one by provider. Card checkouts exist only on Stripe.
10. **Brand.** The Stripe and Fortnox cards and their connect buttons use each provider's logo and brand colour. The logos are the official files in `packages/ui/src/assets/brands/` (Stripe's logo kit from stripe.com/newsroom/brand-assets; Fortnox's symbol and wordmark from fortnox.se), wrapped as components in `@bibi/ui`. Colours as tokens in the one token file: Stripe blurple `#533AFD` and slate `#061B31` (the only wordmark colours Stripe allows, plus white); Fortnox green `#007533`, bright green `#00DB33` and yellow `#FFC200`, taken from its symbol.

## Consequences
- Data: `PaymentSettings` (new, org-scoped), `provider` on `Payment` and `Invoice`, the deduction line on invoices. No backwards compatibility: existing rows are rewritten by the migration and the seed.
- Parity: `paymentSettings.get|update` and the deposit/invoice changes on web, GraphQL, REST and MCP (ADR 0003). Permission feature `paymentAccount` covers the settings.
- Fortnox needs app scopes registered in the Fortnox Developer Portal by hand.
- Seed: Lindholmen gets a deposit rule (e.g. 30 %, minimum 10 000 kr) and Stripe as invoice provider; no real Fortnox company, so Fortnox invoicing is tested with a fake gateway.

## To verify while building
- The exact add-topics and subscribe commands of Fortnox Topics, and which scope the `invoices` topic needs.
- Whether a Stripe invoice should carry the deposit as a negative line item or as a customer credit.
- Logo and colour use under each provider's brand guidelines.

## Alternatives rejected
- **Deposit rule from Stripe or Fortnox.** Neither has one.
- **Deduct deposits by voiding and re-raising them on the invoice.** A paid deposit is a settled receivable (ADR 0057); rewriting it breaks the ledger and the SIE vouchers.
- **Poll Fortnox for payments on a timer.** Uses the rate limit per organization for invoices that mostly have not changed; the Topics stream says exactly which invoice changed.
- **One WebSocket per organization.** Fortnox asks for one connection for all customers.
- **Take payments on Bibi's account and pay venues out.** Bibi would hold venue funds and carry the loss risk; this is what the user ruled out.

## Addendum 2026-11-02 – no Stripe, no payment links
- Replaces the fallback in decision 4 (user's decision): without an active Stripe account there is no invoice fallback for deposits. Payment links (`deposit.request`, `payment.create`) are unavailable and refuse with `CONFLICT`.
- The web app keeps the actions visible but dimmed; a click explains that an administrator connects Stripe under Settings → Integrations. `deposit.suggest` carries `paymentLinksAvailable`, so members without `paymentAccount:read` see the same state.

## Addendum – as built
- **Customers are matched by email, then by name.** Bibi customers have no organization number, so decision 7's match by organization number is not built. Fortnox's filters are exact; a missing customer is created with its name and email.
- **Deposits are not invoice lines.** `InvoiceDeposit` rows deduct them. The invoice stays billed at the gross total, and `amountDueMinor` is what payments settle (`docs/specs/payments.md`). In Fortnox each deducted deposit is one negative row on the customer advances account, without VAT, so revenue stays on the lines' accounts.
- **Payments are written inside `invoice.sync`, not through `payment.applySignal`.** Decision 8 named `applySignal`. `invoice.sync` is also a user operation (`payment:write`), so a user can mirror Fortnox payments on demand; it reads them from Fortnox first.
- **The 14-day catch-up runs at worker start, not daily.** It runs once when the stream has been away longer than Fortnox replays, or has never run (`catchUpFortnox`). Nothing runs on a timer.
- **The stream adds tenants at start and every 10 minutes for companies without a tenant id.** A refreshed access token is not sent again, unlike decision 8.
- **Fortnox calls sit behind their own gateway.** `FortnoxInvoicingGateway` (`features/integration/fortnox/invoicing-gateway.ts`) makes the Fortnox calls; it is not a `PaymentProvider` adapter.
- **Void does not reach Fortnox.** `invoice.void` moves only the Bibi invoice. A cancelled Fortnox invoice whose payment is already mirrored as paid is refused by `invoice.void` (a paid payment must be refunded first), so the event is logged as failed and the invoice stays `SENT`.

## Addendum 2026-11-03 – deposits carry VAT (ADR 0093)
- A deposit snapshots its VAT split at create, and each deducted deposit is one negative Fortnox row per VAT rate on the customer advances account, priced excl. VAT, replacing the single 0 % row above ([ADR 0093](0093-vat-on-advance-payments.md)).
