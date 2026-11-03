import { getDb } from "@bibi/db";
import { describe, expect, it } from "vitest";
import { checkoutParams } from "../src/features/billing/checkout-params";
import {
  applyBillingSignal,
  type BillingSubscription,
  createExecuteContext,
  execute,
  grantAll,
  startBillingCheckout,
} from "../src/index";
import { useMemoryBilling } from "./billing-helpers";
import { errorCode, unwrap } from "./helpers";
import { withInviter } from "./invitation-helpers";

type Context = Awaited<ReturnType<typeof withInviter>>;

const system = ({ context }: { context: Context }) =>
  createExecuteContext({
    organizationId: context.organizationId,
    roles: [],
    permissions: grantAll({}),
    actor: { type: "system", userId: null },
  });

const startCheckout = ({ context }: { context: Context }) =>
  execute({
    operation: startBillingCheckout,
    input: { interval: "MONTH", returnTo: "/" },
    context,
  });

type SubInput = { context: Context; id: string; status: string; customerId: string };

const sub = ({ context, id, status, customerId }: SubInput): BillingSubscription => ({
  ...{ subscriptionId: id, customerId, organizationId: context.organizationId, status },
  ...{ interval: "MONTH", seatQuantity: 0, currentPeriodEnd: null, cancelAtPeriodEnd: false },
});

describe("subscription guards (ADR 0095 §8)", () => {
  const billing = useMemoryBilling();

  it("ignores a late event of an old subscription while a live one is stored", async () => {
    const context = await withInviter();
    unwrap({ result: await startCheckout({ context }) });
    const { stripeCustomerId } = await getDb().billingAccount.findUniqueOrThrow({
      where: { organizationId: context.organizationId },
    });
    const customerId = stripeCustomerId ?? "";
    const live = sub({
      context,
      id: `sub_live_${context.organizationId}`,
      status: "active",
      customerId,
    });
    const old = sub({
      context,
      id: `sub_old_${context.organizationId}`,
      status: "canceled",
      customerId,
    });
    for (const one of [live, old]) billing.gateway().subscriptions.set(one.subscriptionId, one);
    const apply = ({ subscriptionId }: { subscriptionId: string }) =>
      execute({
        operation: applyBillingSignal,
        input: { subscriptionId },
        context: system({ context }),
      });
    unwrap({ result: await apply(live) });
    const ignored = unwrap({ result: await apply(old) });
    expect(ignored.changed).toBe(false);
    const row = await getDb().billingAccount.findUniqueOrThrow({
      where: { organizationId: context.organizationId },
    });
    expect(row).toMatchObject({
      stripeSubscriptionId: live.subscriptionId,
      subscriptionStatus: "active",
    });
    expect(errorCode({ result: await startCheckout({ context }) })).toBe("CONFLICT");
  });

  it("refuses a second checkout when Stripe already has a live subscription", async () => {
    const context = await withInviter();
    unwrap({ result: await startCheckout({ context }) });
    const customerId = billing.gateway().checkouts[0]?.customerId ?? "";
    const paid = sub({
      context,
      id: `sub_tab_${context.organizationId}`,
      status: "active",
      customerId,
    });
    billing.gateway().subscriptions.set(paid.subscriptionId, paid);
    expect(errorCode({ result: await startCheckout({ context }) })).toBe("CONFLICT");
  });
});

describe("checkout params (ADR 0095 §4)", () => {
  const keys = {
    secretKey: "sk_test_x",
    prices: { baseMonthly: "price_m", baseYearly: "price_y", seat: "price_s" },
    portalConfigId: null,
  };
  const now = new Date("2026-11-03T12:00:00Z");
  const input = {
    ...{ organizationId: "org", customerId: "cus", interval: "MONTH" as const, extraSeats: 2 },
    ...{ successUrl: "https://x/ok", cancelUrl: "https://x/no" },
  };

  it("starts with the rest of the trial, anchors a short rest, and adds monthly seats only", () => {
    const long = checkoutParams({
      input: { ...input, trialEnd: new Date("2026-11-10T12:00:00Z") },
      keys,
      now,
    });
    expect(long.subscription_data).toMatchObject({
      trial_end: Date.parse("2026-11-10T12:00:00Z") / 1000,
    });
    const short = checkoutParams({
      input: { ...input, trialEnd: new Date("2026-11-04T12:00:00Z") },
      keys,
      now,
    });
    expect(short.subscription_data).toMatchObject({ proration_behavior: "none" });
    expect(long.line_items).toEqual([
      { price: "price_m", quantity: 1 },
      { price: "price_s", quantity: 2 },
    ]);
    const yearly = checkoutParams({
      input: { ...input, interval: "YEAR", trialEnd: null },
      keys,
      now,
    });
    expect(yearly.line_items).toEqual([{ price: "price_y", quantity: 1 }]);
  });
});
