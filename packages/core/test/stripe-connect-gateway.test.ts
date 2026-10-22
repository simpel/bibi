import { getEnv } from "@bibi/config";
import { describe, expect, it, vi } from "vitest";
import { stripeConnectGateway } from "../src/features/payment-account/stripe-gateway";
import { STRIPE_API_VERSION } from "../src/features/payment-account/stripe-request";
import { unwrap } from "./helpers";
import { accountWith, calls, stubStripe, useStripeEnv } from "./stripe-gateway-helpers";

useStripeEnv();

describe("stripeConnectGateway", () => {
  it("creates an Accounts v2 account with a JSON body and idempotency key", async () => {
    stubStripe({ body: { id: "acct_1" } });
    const created = unwrap({
      result: await stripeConnectGateway.createAccount({
        organizationId: "org_1",
        displayName: "Venue",
        country: "se",
        contactEmail: "a@b.test",
      }),
    });
    expect(created).toEqual({ stripeAccountId: "acct_1" });
    const [call] = calls;
    expect(call?.url).toBe("https://api.stripe.com/v2/core/accounts");
    expect(call?.method).toBe("POST");
    expect(call?.headers["Stripe-Version"]).toBe(STRIPE_API_VERSION);
    expect(call?.headers["Idempotency-Key"]).toBe("bibi-connected-account-org_1");
    expect(call?.headers["Content-Type"]).toBe("application/json");
    expect(JSON.parse(call?.body ?? "{}")).toMatchObject({
      display_name: "Venue",
      contact_email: "a@b.test",
      dashboard: "full",
      identity: { country: "se" },
      defaults: { responsibilities: { fees_collector: "stripe", losses_collector: "stripe" } },
      configuration: { merchant: { capabilities: { card_payments: { requested: true } } } },
      metadata: { organizationId: "org_1", platformAccountId: "acct_bibi" },
    });
  });

  it("omits the contact email when none is given", async () => {
    stubStripe({ body: { id: "acct_1" } });
    await stripeConnectGateway.createAccount({
      organizationId: "org_1",
      displayName: "Venue",
      country: "se",
    });
    expect(JSON.parse(calls[0]?.body ?? "{}")).not.toHaveProperty("contact_email");
  });

  it.each([
    ["active", "ACTIVE"],
    ["restricted", "RESTRICTED"],
    ["pending", "ONBOARDING"],
    [undefined, "ONBOARDING"],
  ])("maps the card_payments capability %s to %s", async (status, expected) => {
    stubStripe({ body: accountWith({ ...(status ? { status } : {}) }) });
    const result = unwrap({
      result: await stripeConnectGateway.getAccountStatus({ stripeAccountId: "acct_1" }),
    });
    expect(result).toEqual({ status: expected });
    expect(calls[0]?.method).toBe("GET");
    expect(calls[0]?.url).toBe(
      "https://api.stripe.com/v2/core/accounts/acct_1?include[0]=configuration.merchant",
    );
    expect(calls[0]?.body).toBeUndefined();
  });

  it("treats an account without merchant configuration as onboarding", async () => {
    stubStripe({ body: { id: "acct_1" } });
    const result = unwrap({
      result: await stripeConnectGateway.getAccountStatus({ stripeAccountId: "acct_1" }),
    });
    expect(result).toEqual({ status: "ONBOARDING" });
  });

  it("creates an onboarding link for the merchant configuration", async () => {
    stubStripe({
      body: { url: "https://connect.stripe.com/x", expires_at: "2030-01-01T00:00:00Z" },
    });
    const link = unwrap({
      result: await stripeConnectGateway.createOnboardingLink({
        stripeAccountId: "acct_1",
        returnUrl: "https://bibi.test/ok",
        refreshUrl: "https://bibi.test/retry",
      }),
    });
    expect(link).toEqual({
      url: "https://connect.stripe.com/x",
      expiresAt: new Date("2030-01-01T00:00:00Z"),
    });
    expect(calls[0]?.url).toBe("https://api.stripe.com/v2/core/account_links");
    expect(JSON.parse(calls[0]?.body ?? "{}")).toEqual({
      account: "acct_1",
      use_case: {
        type: "account_onboarding",
        account_onboarding: {
          configurations: ["merchant"],
          return_url: "https://bibi.test/ok",
          refresh_url: "https://bibi.test/retry",
        },
      },
    });
  });

  it("maps a Stripe error response to UNAVAILABLE with the Stripe message", async () => {
    stubStripe({ status: 400, body: { error: { message: "Bad country" } } });
    const result = await stripeConnectGateway.getAccountStatus({ stripeAccountId: "acct_1" });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("UNAVAILABLE");
      expect(result.error.message).toContain("Bad country");
    }
  });

  it("maps an unreadable 2xx body to INTERNAL", async () => {
    stubStripe({ body: { nope: true } });
    const result = await stripeConnectGateway.createAccount({
      organizationId: "org_1",
      displayName: "Venue",
      country: "se",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("INTERNAL");
  });

  it("maps a network failure to UNAVAILABLE", async () => {
    vi.stubGlobal("fetch", async () => {
      throw new Error("offline");
    });
    const result = await stripeConnectGateway.getAccountStatus({ stripeAccountId: "acct_1" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("UNAVAILABLE");
  });

  it("is UNAVAILABLE without Stripe configuration", async () => {
    Object.assign(getEnv(), { STRIPE_SECRET_KEY: undefined });
    const result = await stripeConnectGateway.getAccountStatus({ stripeAccountId: "acct_1" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("UNAVAILABLE");
  });
});
