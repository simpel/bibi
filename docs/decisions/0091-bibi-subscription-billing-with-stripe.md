# 0091 – Bibi's own subscription billing with Stripe

- **Date:** 2026-11-02
- **Status:** Accepted; amended by [0095](0095-subscription-plan-seats-and-trial-gate.md) (config in the superadmin UI, the plan, seats and the trial gate)
- **Related:** 0028 (Connect, a separate flow), 0090, 0015, 0058, 0013

## Context
- Venues pay Bibi for the service. Stripe already holds Bibi's platform account for Connect (ADR 0028).
- Order money never touches it (ADR 0090); only Bibi's own fees do.
- The pricing model was not decided when this was written.

## Decision
1. Stripe Billing on Bibi's platform account, never on a venue's connected account.
2. One Stripe customer per organization, created on first checkout. A `BillingAccount` row holds the Stripe ids and mirrors status, period end and cancel flag as snapshots, written only by the webhook operation.
3. Checkout and Customer Portal. `billing.startCheckout` and `billing.openPortal` return Stripe URLs and call Stripe after commit (ADR 0058).
4. Its own webhook, separate from the Connect webhook, with its own signing secret. A SYSTEM-only `billing.applySignal` applies events, deduplicated on the event id.
5. Billing is admin only, a permission feature `billing` locked like `paymentAccount`. `startCheckout` and `openPortal` are `aiAllowed: false`.
6. No access gating yet. Gating came with the plan in ADR 0095.

## Rejected
- Payment Links for the subscription. No link to the organization without ids in the URL, and no portal.
- One webhook for Connect and billing. Different sources and secrets; a platform event could be applied to a venue's payments.
- Gate the app on the subscription now. Nothing to gate against until pricing was decided.

## Consequences
- Billing is unavailable until its Stripe config is set.
- The seed has no subscription; tests use a fake billing gateway.
