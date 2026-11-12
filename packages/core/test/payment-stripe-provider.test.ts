import { getEnv } from "@bibi/config";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { stripeCharges } from "../src/providers/stripe/stripe-charges";
import { stripeRefundStatus } from "../src/providers/stripe/stripe-refunds";
import { unwrap } from "./helpers";

type Call = { url: string; headers: Record<string, string>; body: URLSearchParams };

const saved = { ...getEnv() };
let calls: Call[];

/** Answers each Stripe call with the next canned body and records what was sent. */
function stubStripe({ responses }: { responses: Record<string, unknown>[] }) {
  calls = [];
  vi.stubGlobal("fetch", async (url: string, init: RequestInit) => {
    calls.push({
      url,
      headers: init.headers as Record<string, string>,
      body: new URLSearchParams(String(init.body)),
    });
    return new Response(JSON.stringify(responses[calls.length - 1] ?? {}), { status: 200 });
  });
}

const base = {
  connectedAccountId: "acct_venue",
  amountMinor: 125_000,
  currency: "SEK",
  description: "Order #7",
  idempotencyKey: "bibi-payment-p1",
  metadata: { paymentId: "p1" },
};

beforeEach(() => {
  Object.assign(getEnv(), {
    STRIPE_SECRET_KEY: "sk_test_x",
    STRIPE_PLATFORM_ACCOUNT_ID: "acct_bibi",
  });
});
afterEach(() => {
  Object.assign(getEnv(), saved);
  vi.unstubAllGlobals();
});

describe("stripeCharges", () => {
  it("creates a checkout session on the connected account with the application fee", async () => {
    stubStripe({
      responses: [
        { id: "cs_1", url: "https://checkout.stripe.com/c/cs_1", expires_at: 1_900_000_000 },
      ],
    });
    const checkout = unwrap({
      result: await stripeCharges.createCheckout({
        ...base,
        applicationFeeMinor: 3_125,
        successUrl: "https://bibi.test/pay/p1",
        cancelUrl: "https://bibi.test/pay/p1",
      }),
    });
    expect(checkout).toEqual({
      providerReference: "cs_1",
      url: "https://checkout.stripe.com/c/cs_1",
      expiresAt: new Date(1_900_000_000_000),
    });
    const [call] = calls;
    expect(call?.url).toBe("https://api.stripe.com/v1/checkout/sessions");
    expect(call?.headers).toMatchObject({
      "Stripe-Account": "acct_venue",
      "Idempotency-Key": "bibi-payment-p1",
    });
    expect(call?.body.get("payment_intent_data[application_fee_amount]")).toBe("3125");
    expect(call?.body.get("line_items[0][price_data][unit_amount]")).toBe("125000");
    expect(call?.body.get("line_items[0][price_data][currency]")).toBe("sek");
    expect(call?.body.get("metadata[paymentId]")).toBe("p1");
  });

  it("omits the application fee when none is given", async () => {
    stubStripe({ responses: [{ id: "cs_2", url: "https://x", expires_at: 1 }] });
    const input = { ...base, successUrl: "https://s", cancelUrl: "https://c" };
    unwrap({ result: await stripeCharges.createCheckout(input) });
    expect(calls[0]?.body.has("payment_intent_data[application_fee_amount]")).toBe(false);
  });

  it("maps a refused request (4xx) to CONFLICT", async () => {
    vi.stubGlobal(
      "fetch",
      async () =>
        new Response(JSON.stringify({ error: { message: "No such account" } }), { status: 400 }),
    );
    const input = { ...base, successUrl: "https://s", cancelUrl: "https://c" };
    const result = await stripeCharges.createCheckout(input);
    expect(result.ok ? null : result.error.code).toBe("CONFLICT");
  });
});

describe("stripe refundStatus (ADR 0100)", () => {
  const input = {
    auth: { externalAccountId: "acct_venue", accessToken: null },
    providerReference: "cs_1",
    idempotencyKey: "bibi-refund-r1",
    refundReference: null,
    metadata: { paymentId: "p1", refundId: "r1" },
  };

  it("finds Bibi's refund among the payment intent's refunds by its metadata", async () => {
    stubStripe({
      responses: [
        { id: "cs_1", payment_intent: "pi_1" },
        {
          data: [
            { id: "re_other", status: "succeeded", created: 1, metadata: { refundId: "r0" } },
            {
              id: "re_1",
              status: "succeeded",
              created: 1_800_000_000,
              metadata: { refundId: "r1" },
            },
          ],
        },
      ],
    });
    const state = unwrap({ result: await stripeRefundStatus(input) });
    expect(state).toEqual({
      status: "SUCCEEDED",
      providerReference: "re_1",
      occurredAt: new Date(1_800_000_000_000),
    });
    expect(calls[1]?.url).toBe("https://api.stripe.com/v1/refunds?payment_intent=pi_1&limit=100");
    expect(calls[1]?.headers["Stripe-Account"]).toBe("acct_venue");
  });

  it("is MISSING when Stripe has no such refund, and reads a known one by its id", async () => {
    stubStripe({ responses: [{ id: "cs_1", payment_intent: "pi_1" }, { data: [] }] });
    expect(unwrap({ result: await stripeRefundStatus(input) })).toEqual({ status: "MISSING" });
    stubStripe({ responses: [{ id: "re_9", status: "pending", created: 1 }] });
    const known = unwrap({
      result: await stripeRefundStatus({ ...input, refundReference: "re_9" }),
    });
    expect(known).toEqual({ status: "PENDING", providerReference: "re_9" });
    expect(calls[0]?.url).toBe("https://api.stripe.com/v1/refunds/re_9");
  });
});
