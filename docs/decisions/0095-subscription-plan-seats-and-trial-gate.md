# 0095 – Subscription plan, seats and the trial gate

- **Date:** 2026-11-03
- **Status:** Accepted (decided by the user on 2026-11-03)
- **Amends:** 0091 (env config, placeholder price and "no access gating yet" are replaced)
- **Related:** 0015 (platform operations), 0058 (`external`), 0078 (domain join), 0087 (sealed secrets), 0094 (notifications)

## Context
- The pricing is decided: one plan, 9 990 SEK a month excluding VAT (raised from 3 999 on 2026-11-03), or yearly with 10 % off. 10 seats are included; each extra seat is 49 SEK a month, always monthly, never discounted.
- A new organization gets 14 days free without giving payment details. When the trial ends, the app is closed until an admin pays.
- Bibi is not live, so no existing organization needs a migration.

## Decision
1. **Stripe config is platform data, set by a superadmin in `/mothership/billing`.** `BillingConfig` (one platform row) holds the platform's secret key and the billing webhook secret, sealed with `sealSecret` (ADR 0087), and the three price ids. No billing env variables; `STRIPE_BILLING_*` from ADR 0091 are never added. Unset, billing is `UNAVAILABLE` and the gate stays open (a fresh environment is not locked out).
2. **Provision from the UI.** `billingConfig.provision` creates, idempotently by lookup key, the product `Bibi`, prices `bibi_base_monthly` (999 000 öre/month), `bibi_base_yearly` (10 789 200 öre/year) and `bibi_seat_monthly` (4 900 öre/month), all `tax_behavior: exclusive`; a price whose amount differs from the plan is replaced and the new one takes over the lookup key, and, given a public URL, the webhook endpoint for `/api/webhooks/stripe-billing` (storing its secret). The Customer Portal configuration is created there too.
3. **One subscription per organization in flexible billing mode:** the base price (monthly or yearly) plus the seat price (monthly) with quantity = extra seats, a mixed-interval subscription. Stripe Tax computes VAT (`automatic_tax`), Checkout collects the billing address and VAT number.
4. **The trial is Bibi's, not Stripe's.** `BillingAccount.trialEndsAt` null = inherit `Organization.createdAt + 14 days`; a superadmin may set it (extend) or set `exempt`. No Stripe customer exists until an admin starts checkout. Paying during the trial starts the subscription with `trial_end` = the remaining trial, so nothing is charged early.
5. **Access** is derived on read (`billingAccess`): open when exempt, in trial, when billing is not configured, or when the subscription is `active`, `trialing` or `past_due` (Stripe is retrying). Otherwise `REQUIRED`: the `(app)` layout redirects every page to `/:org/billing/pay?returnTo=<path>`, and Checkout returns there.
6. **Seats = members + pending invitations,** capacity = 10 + `extraSeats`. `member.invite` and domain join check capacity:
   - `autoAssignSeats` on (default): `extraSeats` goes up by one, and an active subscription's seat quantity follows after the commit (prorated).
   - off: the invitation is stored `held` (no mail, cannot be accepted) and every admin gets a `SEAT_REQUESTED` notification and an email linking to Settings → Billing, where `billing.approveSeat` (adds the seat, the invitation becomes `pending` and its mail goes out) or `billing.rejectSeat` (canceled) decides it. A domain join over capacity becomes such a held invitation.
   - `extraSeats` never drops by itself; an admin lowers it (`billing.update`), never below what is used.
7. **Who pays:** `billing:write` (admin preset only, locked). Others see the payment page with one button, `billing.remindAdmins`, which mails every admin a friendly reminder (at most once per hour per organization).
8. **Webhook** `POST /api/webhooks/stripe-billing`, separate from Connect (ADR 0091 §4), handled by the SYSTEM-only `billing.applySignal`. It reads the subscription back from Stripe rather than trusting the payload, and mirrors status, interval, period end and `cancelAtPeriodEnd` onto `BillingAccount`.

## Consequences
- `INTEGRATION_SECRET_KEY` (ADR 0087) is the one env value billing needs: it seals the Stripe key at rest.
- Stripe Tax must be activated with a Swedish registration in the Stripe Dashboard before live checkout.
- Seeds and tests create organizations inside their trial, so nothing is gated; tests use a fake billing gateway.

## Alternatives rejected
- **Stripe's own trial without a payment method.** It creates a customer and subscription for every sign-up, and the "pause at trial end" state still needs our own gate and page.
- **A separate monthly subscription for seats on a yearly plan.** Two subscriptions to keep in step; flexible billing mode bills both intervals on one.
- **Gate seats at acceptance.** Acceptance runs inside Better Auth; invites and domain join already run in core.
