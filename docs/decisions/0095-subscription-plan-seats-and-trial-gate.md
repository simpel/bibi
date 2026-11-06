# 0095 – Subscription plan, seats and the trial gate

- **Date:** 2026-11-03
- **Status:** Accepted
- **Amends:** 0091 (env config, the placeholder price and "no gating yet")
- **Related:** 0015, 0058, 0078, 0087, 0094

## Context
- Pricing is decided: one plan, 9 990 SEK a month excl. VAT, or yearly with 10 % off. Ten seats are included and extra seats cost 49 SEK a month, always monthly.
- A new organization gets 14 days free without payment details. After that the app is closed until an admin pays.
- Bibi is not live, so no organization needs migrating.

## Decision
1. Stripe config is platform data, set by a superadmin. `BillingConfig` holds the secret key and webhook secret sealed (ADR 0087). There are no billing env variables. Unset, billing is `UNAVAILABLE` and the gate stays open.
2. Saving the key sets Stripe up. It creates, idempotently by lookup key, the product, the base and seat prices (tax exclusive), the Customer Portal configuration and the webhook endpoint. A price whose amount differs from the plan is replaced.
3. One subscription per organization in flexible billing mode: the base price plus a monthly seat price with quantity equal to extra seats. Stripe Tax computes VAT.
4. The trial is Bibi's, not Stripe's. `BillingAccount.trialEndsAt` null means creation plus 14 days. A superadmin can extend it or mark the organization exempt. No Stripe customer exists until checkout, and paying during the trial starts the subscription at trial end.
5. Access is derived on read. It is open when exempt, in trial, unconfigured, or the subscription is `active`, `trialing` or `past_due`. Otherwise every page redirects to the payment page.
6. Seats are members plus pending invitations, with capacity ten plus `extraSeats`. Invites and domain join check capacity. With `autoAssignSeats` on, a seat is added and prorated. Off, the invitation is held and admins approve or reject it. Seats never drop by themselves.
7. Only `billing:write` (admin, locked) pays. Others see the payment page with a button that reminds admins, at most once an hour.
8. The billing webhook is separate from Connect (ADR 0091 §4) and handled by the SYSTEM-only `billing.applySignal`. It reads the subscription back from Stripe rather than trusting the payload.

## Rejected
- Stripe's own trial without a payment method. It creates a customer and subscription per sign-up, and the gate is still ours.
- A separate monthly subscription for seats on a yearly plan. Two subscriptions to keep in step.
- Gate seats at acceptance. Acceptance runs inside Better Auth; invites and domain join already run in core.

## Consequences
- `INTEGRATION_SECRET_KEY` is the one env value billing needs.
- Stripe Tax needs a Swedish registration before live checkout.
- Seeds and tests create organizations inside their trial, so nothing is gated.
