# 0091 – Bibi's own subscription billing with Stripe

- **Date:** 2026-11-02
- **Status:** Accepted (approved by the user on 2026-11-02); amended by [0095](0095-subscription-plan-seats-and-trial-gate.md): config in the superadmin UI, the decided plan, seats and the trial gate
- **Related:** 0028 (Connect, a separate flow), 0090, 0015 (platform operations), 0058, 0013 (hosting)

## Context
- Venues pay Bibi for the service. Prices are meant to be published and venues sign up without talking to sales, but the pricing model (per venue, room or order) is not decided.
- Stripe already holds Bibi's platform account for Connect (ADR 0028). Order money never touches it (ADR 0090); only Bibi's own fees do.

## Decision
1. **Stripe Billing on Bibi's platform account,** never on a venue's connected account.
2. **One Stripe customer per organization,** created on first checkout. Org-scoped `BillingAccount` row: `stripeCustomerId`, `stripeSubscriptionId`, and `status`, `currentPeriodEnd`, `cancelAtPeriodEnd` mirrored from Stripe (snapshots written only by the webhook operation).
3. **Checkout and Customer Portal.** `billing.startCheckout` returns a Stripe Checkout URL in subscription mode for the plan in `STRIPE_BILLING_PRICE_ID`, a placeholder until pricing is decided. `billing.openPortal` returns a Customer Portal URL for card, invoices and cancelling. Both call Stripe after commit (ADR 0058).
4. **Its own webhook,** `POST /api/webhooks/stripe-billing`, signed with `STRIPE_BILLING_WEBHOOK_SECRET`, separate from the Connect webhook. It handles `checkout.session.completed` and `customer.subscription.created|updated|deleted` through a SYSTEM-only `billing.applySignal`, deduplicated on the event id like ADR 0028.
5. **Settings → Billing,** admin only, new permission feature `billing` (`read`, `write`), locked like `paymentAccount`. `billing.get|startCheckout|openPortal` on web, GraphQL, REST and MCP (ADR 0003); `startCheckout` and `openPortal` are `aiAllowed: false`.
6. **No access gating yet.** A missing or lapsed subscription only shows on the Billing page. Gating waits for the pricing decision.

## Consequences
- Config: `STRIPE_BILLING_PRICE_ID` and `STRIPE_BILLING_WEBHOOK_SECRET`. Unset, Billing shows as not available and the operations return `UNAVAILABLE`.
- Stripe Dashboard, by hand: a product and price, the Customer Portal configuration and the webhook endpoint.
- Seed: no subscription (it would need real Stripe); tests use a fake billing gateway.

## Alternatives rejected
- **Payment Links for the subscription.** No link to the organization without passing ids in the URL, and no portal.
- **One webhook for Connect and billing.** Different event sources and secrets; mixing them risks applying a platform event to a venue's payments.
- **Gate the app on the subscription now.** Nothing to gate against until pricing is decided.
