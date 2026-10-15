import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  type ExecuteContext,
  execute,
  getPaymentAccount,
  setStripeConnectGateway,
  startPaymentOnboarding,
  syncPaymentAccount,
} from "../src/index";
import { errorCode, peer, testContext, unwrap } from "./helpers";
import { type FakeGateway, installFakeGateway } from "./payment-account-helpers";

let gateway: FakeGateway;
beforeEach(() => {
  gateway = installFakeGateway();
});
afterEach(() => setStripeConnectGateway({ gateway: undefined }));

const start = ({ context }: { context: ExecuteContext }) =>
  execute({ operation: startPaymentOnboarding, input: { country: "SE" }, context });

describe("paymentAccount", () => {
  it("is NOT_CONNECTED before onboarding starts", async () => {
    const context = testContext();
    const account = unwrap({
      result: await execute({ operation: getPaymentAccount, input: {}, context }),
    });
    expect(account).toMatchObject({ id: null, status: "NOT_CONNECTED", stripeAccountId: null });
  });

  it("creates one connected account and returns an onboarding link", async () => {
    const context = testContext();
    const first = unwrap({ result: await start({ context }) });
    expect(first.status).toBe("ONBOARDING");
    expect(first.onboardingUrl).toContain(first.stripeAccountId);
    const second = unwrap({ result: await start({ context }) });
    expect(second.id).toBe(first.id);
    expect(second.stripeAccountId).toBe(first.stripeAccountId);
    expect(gateway.calls.filter((call) => call === "createAccount")).toHaveLength(1);
    expect(gateway.calls.filter((call) => call === "createOnboardingLink")).toHaveLength(2);
  });

  it("syncs the status from Stripe", async () => {
    const context = testContext();
    unwrap({ result: await start({ context }) });
    gateway.accountStatus = "ACTIVE";
    const synced = unwrap({
      result: await execute({ operation: syncPaymentAccount, input: {}, context }),
    });
    expect(synced.status).toBe("ACTIVE");
    const read = unwrap({
      result: await execute({ operation: getPaymentAccount, input: {}, context }),
    });
    expect(read.status).toBe("ACTIVE");
  });

  it("refuses sync before onboarding started", async () => {
    const result = await execute({
      operation: syncPaymentAccount,
      input: {},
      context: testContext(),
    });
    expect(errorCode({ result })).toBe("NOT_FOUND");
  });

  it("keeps accounts per organization and needs payment:admin to start", async () => {
    const context = testContext();
    unwrap({ result: await start({ context }) });
    const other = unwrap({
      result: await execute({ operation: getPaymentAccount, input: {}, context: testContext() }),
    });
    expect(other.status).toBe("NOT_CONNECTED");
    const reader = peer({ of: context, access: "read" });
    expect(errorCode({ result: await start({ context: reader }) })).toBe("FORBIDDEN");
    const read = unwrap({
      result: await execute({ operation: getPaymentAccount, input: {}, context: reader }),
    });
    expect(read.status).toBe("ONBOARDING");
  });

  it("is UNAVAILABLE without Stripe configuration", async () => {
    setStripeConnectGateway({ gateway: undefined });
    expect(errorCode({ result: await start({ context: testContext() }) })).toBe("UNAVAILABLE");
  });
});
