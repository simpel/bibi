import { z } from "zod";
import { ok, type Result } from "../../errors/result";
import { stripeBadResponse } from "../../providers/stripe/stripe-bad-response";
import type { BillingKeys } from "./billing-config";
import type { PlanPrice, PlanPrices } from "./gateway";
import { billingStripeRequest } from "./stripe-billing-request";

/** A flat recurring price; tiered or metered prices have no `unit_amount` and are refused. */
const PriceSchema = z.object({
  unit_amount: z.number().int().nonnegative(),
  currency: z.string().min(1),
  recurring: z.object({
    interval: z.enum(["month", "year"]),
    interval_count: z.literal(1),
  }),
});

type ReadPriceInput = { secretKey: string; priceId: string };

/** One price as stored in Stripe: `unit_amount` excludes VAT (Stripe Tax adds it). */
async function readPrice({ secretKey, priceId }: ReadPriceInput): Promise<Result<PlanPrice>> {
  const read = await billingStripeRequest({
    ...{ secretKey, method: "GET" },
    path: `/prices/${encodeURIComponent(priceId)}`,
  });
  if (!read.ok) return read;
  const parsed = PriceSchema.safeParse(read.value);
  if (!parsed.success) return stripeBadResponse({ what: "price" });
  const { unit_amount, currency, recurring } = parsed.data;
  return ok({
    value: {
      amountMinor: unit_amount,
      currency,
      interval: recurring.interval === "year" ? "YEAR" : "MONTH",
    },
  });
}

/** The plan's three prices from Stripe, read in parallel. */
export async function readPlanPrices({ keys }: { keys: BillingKeys }): Promise<Result<PlanPrices>> {
  const { secretKey, prices } = keys;
  const [baseMonthly, baseYearly, seat] = await Promise.all([
    readPrice({ secretKey, priceId: prices.baseMonthly }),
    readPrice({ secretKey, priceId: prices.baseYearly }),
    readPrice({ secretKey, priceId: prices.seat }),
  ]);
  if (!baseMonthly.ok) return baseMonthly;
  if (!baseYearly.ok) return baseYearly;
  if (!seat.ok) return seat;
  return ok({
    value: { baseMonthly: baseMonthly.value, baseYearly: baseYearly.value, seat: seat.value },
  });
}
