import { getDb } from "@bibi/db";
import { describe, expect, it } from "vitest";
import {
  applyBillingSignal,
  type BillingSubscription,
  createExecuteContext,
  execute,
  getBillingAccess,
  grantAll,
  openBillingPortal,
  remindBillingAdmins,
  startBillingCheckout,
  syncBilling,
} from "../src/index";
import { setBillingRow, useMemoryBilling } from "./billing-helpers";
import { errorCode, unwrap } from "./helpers";
import { withInviter } from "./invitation-helpers";

type Context = Awaited<ReturnType<typeof withInviter>>;

const checkout = ({ context }: { context: Context }) =>
  execute({
    operation: startBillingCheckout,
    input: { interval: "YEAR", returnTo: "/tickets" },
    context,
  });

const asSystem = ({ context }: { context: Context }) =>
  createExecuteContext({
    organizationId: context.organizationId,
    roles: [],
    permissions: grantAll({}),
    actor: { type: "system", userId: null },
  });

const subscriptionFor = async ({ context, status }: { context: Context; status: string }) => {
  const row = await getDb().billingAccount.findUniqueOrThrow({
    where: { organizationId: context.organizationId },
  });
  const subscription: BillingSubscription = {
    ...{ subscriptionId: `sub_${context.organizationId}`, customerId: row.stripeCustomerId ?? "" },
    ...{ organizationId: context.organizationId, status, interval: "YEAR", seatQuantity: 0 },
    ...{ currentPeriodEnd: new Date("2027-11-03T00:00:00Z"), cancelAtPeriodEnd: false },
  };
  return subscription;
};

describe("checkout and the subscription (ADR 0095 §3, §4, §8)", () => {
  const billing = useMemoryBilling();

  it("creates the customer once and starts the subscription after the trial", async () => {
    const context = await withInviter();
    const first = unwrap({ result: await checkout({ context }) });
    expect(first.url).toMatch(/^https:\/\/checkout\.stripe\.test\//);
    unwrap({ result: await checkout({ context }) });
    const [one, two] = billing.gateway().checkouts;
    expect(one?.customerId).toBe(two?.customerId);
    expect(one).toMatchObject({ interval: "YEAR", extraSeats: 0 });
    expect(one?.trialEnd).toBeInstanceOf(Date);
    expect(one?.successUrl).toContain("/billing/pay/done?returnTo=%2Ftickets");
  });

  it("opens access when the subscription is mirrored, and refuses a second checkout", async () => {
    const context = await withInviter();
    await setBillingRow({
      context,
      data: { trialEndsAt: new Date("2020-01-01T00:00:00Z"), extraSeats: 2 },
    });
    unwrap({ result: await checkout({ context }) });
    const closed = unwrap({
      result: await execute({ operation: getBillingAccess, input: {}, context }),
    });
    expect(closed.open).toBe(false);
    expect(billing.gateway().checkouts[0]?.trialEnd).toBeNull();
    const subscription = await subscriptionFor({ context, status: "active" });
    billing.gateway().subscriptions.set(subscription.subscriptionId, subscription);
    unwrap({ result: await execute({ operation: syncBilling, input: {}, context }) });
    const opened = unwrap({
      result: await execute({ operation: getBillingAccess, input: {}, context }),
    });
    expect(opened).toMatchObject({ state: "ACTIVE", open: true });
    expect(billing.gateway().seats).toEqual([
      { subscriptionId: subscription.subscriptionId, quantity: 2 },
    ]);
    expect(errorCode({ result: await checkout({ context }) })).toBe("CONFLICT");
    const portal = unwrap({
      result: await execute({ operation: openBillingPortal, input: { returnTo: "/" }, context }),
    });
    expect(portal.url).toMatch(/^https:\/\/billing\.stripe\.test\//);
  });

  it("applies a webhook signal only as the system and only for its own organization", async () => {
    const context = await withInviter();
    unwrap({ result: await checkout({ context }) });
    const subscription = await subscriptionFor({ context, status: "past_due" });
    billing.gateway().subscriptions.set(subscription.subscriptionId, subscription);
    const input = { subscriptionId: subscription.subscriptionId };
    const asUser = await execute({ operation: applyBillingSignal, input, context });
    expect(errorCode({ result: asUser })).toBe("FORBIDDEN");
    const applied = unwrap({
      result: await execute({
        operation: applyBillingSignal,
        input,
        context: asSystem({ context }),
      }),
    });
    expect(applied.changed).toBe(true);
    const row = await getDb().billingAccount.findUniqueOrThrow({
      where: { organizationId: context.organizationId },
    });
    expect(row).toMatchObject({ subscriptionStatus: "past_due", interval: "YEAR" });
    const other = await withInviter();
    const foreign = await execute({
      operation: applyBillingSignal,
      input,
      context: asSystem({ context: other }),
    });
    expect(errorCode({ result: foreign })).toBe("NOT_FOUND");
  });

  it("reminds the admins at most once an hour, for any member", async () => {
    const context = await withInviter();
    const member = { ...context, permissions: {}, roles: ["member"] };
    const first = unwrap({
      result: await execute({ operation: remindBillingAdmins, input: {}, context: member }),
    });
    expect(first.sent).toBe(true);
    const second = unwrap({
      result: await execute({ operation: remindBillingAdmins, input: {}, context: member }),
    });
    expect(second.sent).toBe(false);
  });
});
