import { z } from "zod";
import { err, ok, type Result } from "../../errors/result";
import { BILLING_LOOKUP_KEYS, BILLING_PLAN } from "../../features/billing/plan";
import { billingStripeRequest } from "../../features/billing/stripe-billing-request";
import { stripeBadResponse } from "../../features/payment/stripe-bad-response";

/** Stripe's tax code for business-use SaaS, so Stripe Tax picks the right rate. */
const SAAS_TAX_CODE = "txcd_10103001";

const PriceListSchema = z.object({
  data: z.array(
    z.object({
      ...{ id: z.string(), lookup_key: z.string().nullable(), product: z.string() },
      unit_amount: z.number().nullable(),
    }),
  ),
});
const IdSchema = z.object({ id: z.string() });

type PriceSpec = {
  lookupKey: string;
  amount: number;
  interval: "month" | "year";
  nickname: string;
};

const SPECS: Record<keyof typeof BILLING_LOOKUP_KEYS, PriceSpec> = {
  baseMonthly: {
    ...{ lookupKey: BILLING_LOOKUP_KEYS.baseMonthly, amount: BILLING_PLAN.baseMonthlyMinor },
    ...{ interval: "month", nickname: "Bibi monthly" },
  },
  baseYearly: {
    ...{ lookupKey: BILLING_LOOKUP_KEYS.baseYearly, amount: BILLING_PLAN.baseYearlyMinor },
    ...{ interval: "year", nickname: "Bibi yearly (10 % off)" },
  },
  seatMonthly: {
    ...{ lookupKey: BILLING_LOOKUP_KEYS.seatMonthly, amount: BILLING_PLAN.seatMonthlyMinor },
    ...{ interval: "month", nickname: "Extra seat" },
  },
};

export type ProvisionedPrices = {
  productId: string;
  basePriceMonthlyId: string;
  basePriceYearlyId: string;
  seatPriceId: string;
};

type KeyInput = { secretKey: string };

async function existingPrices({ secretKey }: KeyInput) {
  const keys = Object.values(BILLING_LOOKUP_KEYS);
  const listed = await billingStripeRequest({
    ...{ secretKey, method: "GET", path: "/prices" },
    params: { lookup_keys: keys, active: true, limit: 10 },
  });
  if (!listed.ok) return listed;
  const parsed = PriceListSchema.safeParse(listed.value);
  return parsed.success
    ? ok({ value: parsed.data.data })
    : stripeBadResponse({ what: "price list" });
}

async function createProduct({ secretKey }: KeyInput): Promise<Result<string>> {
  const created = await billingStripeRequest({
    ...{ secretKey, method: "POST", path: "/products" },
    params: { name: "Bibi", tax_code: SAAS_TAX_CODE, metadata: { bibi: "subscription" } },
  });
  if (!created.ok) return created;
  const parsed = IdSchema.safeParse(created.value);
  return parsed.success ? ok({ value: parsed.data.id }) : stripeBadResponse({ what: "product" });
}

type CreatePriceInput = KeyInput & { productId: string; spec: PriceSpec };

async function createPrice({ secretKey, productId, spec }: CreatePriceInput) {
  const created = await billingStripeRequest({
    ...{ secretKey, method: "POST", path: "/prices" },
    params: {
      ...{ product: productId, currency: BILLING_PLAN.currency, unit_amount: spec.amount },
      ...{ recurring: { interval: spec.interval }, lookup_key: spec.lookupKey },
      ...{ tax_behavior: "exclusive", nickname: spec.nickname, transfer_lookup_key: true },
    },
  });
  if (!created.ok) return created;
  const parsed = IdSchema.safeParse(created.value);
  return parsed.success ? ok({ value: parsed.data.id }) : stripeBadResponse({ what: "price" });
}

/**
 * Finds the plan's prices by lookup key and creates what is missing (ADR 0095 §2). A price whose
 * amount no longer matches the plan is replaced: the new one takes over the lookup key.
 */
export async function provisionPrices({
  secretKey,
  productId: storedProductId,
}: KeyInput & { productId: string | null }): Promise<Result<ProvisionedPrices>> {
  const existing = await existingPrices({ secretKey });
  if (!existing.ok) return existing;
  let productId = storedProductId ?? existing.value[0]?.product ?? null;
  if (!productId) {
    const product = await createProduct({ secretKey });
    if (!product.ok) return product;
    productId = product.value;
  }
  const ids: Record<string, string> = {};
  for (const [name, spec] of Object.entries(SPECS)) {
    const found = existing.value.find(
      (price) => price.lookup_key === spec.lookupKey && price.unit_amount === spec.amount,
    );
    const id = found ? ok({ value: found.id }) : await createPrice({ secretKey, productId, spec });
    if (!id.ok) return err({ error: id.error });
    ids[name] = id.value;
  }
  return ok({
    value: {
      productId,
      basePriceMonthlyId: ids.baseMonthly ?? "",
      basePriceYearlyId: ids.baseYearly ?? "",
      seatPriceId: ids.seatMonthly ?? "",
    },
  });
}
