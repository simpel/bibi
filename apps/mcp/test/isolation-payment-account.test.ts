import { setStripeConnectGateway } from "@bibi/core";
import { afterEach, describe, expect, it } from "vitest";
import { installFakeStripe } from "./fake-stripe";
import { call, connect, testContext } from "./helpers";

afterEach(() => {
  setStripeConnectGateway({ gateway: undefined });
});

describe("cross-organization isolation: payment account", () => {
  it("shows each organization only its own payout account", async () => {
    const contextA = testContext();
    const contextB = testContext();
    const a = await connect({ context: contextA });
    const b = await connect({ context: contextB });
    installFakeStripe({ status: "ACTIVE" });
    await call({ client: a, name: "paymentAccount_startOnboarding" });
    await call({ client: a, name: "paymentAccount_sync" });

    const own = await call({ client: a, name: "paymentAccount_get" });
    expect(own.data.organizationId).toBe(contextA.organizationId);
    expect(own.data.status).toBe("ACTIVE");
    expect(own.data.stripeAccountId).not.toBeNull();

    const other = await call({ client: b, name: "paymentAccount_get" });
    expect(other.data.organizationId).toBe(contextB.organizationId);
    expect(other.data.status).toBe("NOT_CONNECTED");
    expect(other.data.id).toBeNull();
    expect(other.data.stripeAccountId).toBeNull();
  });
});
