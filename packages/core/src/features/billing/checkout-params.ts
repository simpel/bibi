import type { FormParams } from "../payment/stripe-form-request";
import type { BillingKeys } from "./billing-config";
import type { CreateBillingCheckoutInput } from "./gateway";

/** Stripe wants a Checkout trial to end at least two days out. */
const MIN_TRIAL_MS = 2 * 24 * 60 * 60 * 1000 + 60_000;

type TrialParamsInput = { trialEnd: Date | null; now: Date };

/**
 * The rest of Bibi's trial (ADR 0095 §4): a Stripe trial when it is long enough, else the first
 * bill anchored at the trial's end with nothing charged before it.
 */
function trialParams({ trialEnd, now }: TrialParamsInput): FormParams {
  if (!trialEnd || trialEnd <= now) return {};
  const at = Math.floor(trialEnd.getTime() / 1000);
  if (trialEnd.getTime() - now.getTime() > MIN_TRIAL_MS) return { trial_end: at };
  return { billing_cycle_anchor: at, proration_behavior: "none" };
}

type CheckoutParamsInput = { input: CreateBillingCheckoutInput; keys: BillingKeys; now?: Date };

/**
 * A subscription-mode Checkout Session (ADR 0095): flexible billing mode, Stripe Tax with the
 * billing address and VAT number collected. A monthly plan carries the seat line; a yearly one
 * does not (Checkout bills one interval), and `billing.applySignal` adds the monthly seats after.
 */
export function checkoutParams({ input, keys, now = new Date() }: CheckoutParamsInput): FormParams {
  const base = input.interval === "YEAR" ? keys.prices.baseYearly : keys.prices.baseMonthly;
  const seats =
    input.interval === "MONTH" && input.extraSeats > 0
      ? [{ price: keys.prices.seat, quantity: input.extraSeats }]
      : [];
  const trial = trialParams({ trialEnd: input.trialEnd, now });
  const metadata = { organizationId: input.organizationId };
  return {
    mode: "subscription",
    customer: input.customerId,
    client_reference_id: input.organizationId,
    line_items: [{ price: base, quantity: 1 }, ...seats],
    subscription_data: { billing_mode: { type: "flexible" }, metadata, ...trial },
    metadata,
    automatic_tax: { enabled: true },
    tax_id_collection: { enabled: true },
    billing_address_collection: "required",
    customer_update: { address: "auto", name: "auto" },
    success_url: input.successUrl,
    cancel_url: input.cancelUrl,
  };
}
