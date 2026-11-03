import { createHmac } from "node:crypto";
import { getDb } from "@bibi/db";
import { describe, expect, it } from "vitest";
import { createBillingWebhookHandler, execute, startBillingCheckout } from "../src/index";
import { useMemoryBilling } from "./billing-helpers";
import { unwrap } from "./helpers";
import { withInviter } from "./invitation-helpers";

const secret = "whsec_test_billing";

const signed = ({ body }: { body: string }) => {
  const t = Math.floor(Date.now() / 1000);
  const v1 = createHmac("sha256", secret).update(`${t}.${body}`).digest("hex");
  return new Request("http://localhost/api/webhooks/stripe-billing", {
    method: "POST",
    headers: { "stripe-signature": `t=${t},v1=${v1}` },
    body,
  });
};

describe("POST /api/webhooks/stripe-billing (ADR 0095 §8)", () => {
  const billing = useMemoryBilling();
  const handler = createBillingWebhookHandler({ secret });

  it("mirrors the subscription once per event and refuses a bad signature", async () => {
    const context = await withInviter();
    const input = { interval: "MONTH", returnTo: "/" };
    unwrap({ result: await execute({ operation: startBillingCheckout, input, context }) });
    const { stripeCustomerId } = await getDb().billingAccount.findUniqueOrThrow({
      where: { organizationId: context.organizationId },
    });
    const subscriptionId = `sub_${context.organizationId}`;
    billing.gateway().subscriptions.set(subscriptionId, {
      ...{
        subscriptionId,
        customerId: stripeCustomerId ?? "",
        organizationId: context.organizationId,
      },
      ...{ status: "active", interval: "MONTH", seatQuantity: 0 },
      ...{ currentPeriodEnd: null, cancelAtPeriodEnd: false },
    });
    const event = {
      id: `evt_${context.organizationId}`,
      type: "customer.subscription.created",
      data: { object: { id: subscriptionId, customer: stripeCustomerId } },
    };
    const body = JSON.stringify(event);
    const first = await handler(signed({ body }));
    expect(await first.json()).toEqual({ status: "applied" });
    const again = await handler(signed({ body }));
    expect(await again.json()).toEqual({ status: "duplicate" });
    const row = await getDb().billingAccount.findUniqueOrThrow({
      where: { organizationId: context.organizationId },
    });
    expect(row.subscriptionStatus).toBe("active");
    const forged = new Request("http://localhost/x", {
      method: "POST",
      headers: { "stripe-signature": "t=1,v1=00" },
      body,
    });
    expect((await handler(forged)).status).toBe(401);
  });
});
