import { getEnv } from "@okazi/config";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { stripePaymentProvider } from "../src/features/payment/stripe-provider";
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
  description: "Booking #7",
  idempotencyKey: "okazi-payment-p1",
  metadata: { paymentId: "p1" },
};

beforeEach(() => {
  Object.assign(getEnv(), {
    STRIPE_SECRET_KEY: "sk_test_x",
    STRIPE_PLATFORM_ACCOUNT_ID: "acct_okazi",
  });
});
afterEach(() => {
  Object.assign(getEnv(), saved);
  vi.unstubAllGlobals();
});

describe("stripePaymentProvider", () => {
  it("creates a checkout session on the connected account with the application fee", async () => {
    stubStripe({
      responses: [
        { id: "cs_1", url: "https://checkout.stripe.com/c/cs_1", expires_at: 1_900_000_000 },
      ],
    });
    const checkout = unwrap({
      result: await stripePaymentProvider.createCheckout({
        ...base,
        applicationFeeMinor: 3_125,
        successUrl: "https://okazi.test/pay/p1",
        cancelUrl: "https://okazi.test/pay/p1",
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
      "Idempotency-Key": "okazi-payment-p1",
    });
    expect(call?.body.get("payment_intent_data[application_fee_amount]")).toBe("3125");
    expect(call?.body.get("line_items[0][price_data][unit_amount]")).toBe("125000");
    expect(call?.body.get("line_items[0][price_data][currency]")).toBe("sek");
    expect(call?.body.get("metadata[paymentId]")).toBe("p1");
  });

  it("omits the application fee when none is given", async () => {
    stubStripe({ responses: [{ id: "cs_2", url: "https://x", expires_at: 1 }] });
    const input = { ...base, successUrl: "https://s", cancelUrl: "https://c" };
    unwrap({ result: await stripePaymentProvider.createCheckout(input) });
    expect(calls[0]?.body.has("payment_intent_data[application_fee_amount]")).toBe(false);
  });

  it("creates, finalizes and sends an invoice on the connected account", async () => {
    stubStripe({
      responses: [
        { id: "cus_1" },
        { id: "in_1" },
        { id: "ii_1" },
        { id: "in_1", hosted_invoice_url: "https://invoice.stripe.com/i/in_1" },
        { id: "in_1" },
      ],
    });
    const invoice = unwrap({
      result: await stripePaymentProvider.createInvoice({
        ...base,
        applicationFeeMinor: 500,
        recipient: { name: "Hisingen Energi AB", email: "billing@example.com" },
        daysUntilDue: 30,
      }),
    });
    expect(invoice).toEqual({
      providerReference: "in_1",
      url: "https://invoice.stripe.com/i/in_1",
    });
    expect(calls.map(({ url }) => url.replace("https://api.stripe.com/v1", ""))).toEqual([
      "/customers",
      "/invoices",
      "/invoiceitems",
      "/invoices/in_1/finalize",
      "/invoices/in_1/send",
    ]);
    expect(calls.every(({ headers }) => headers["Stripe-Account"] === "acct_venue")).toBe(true);
    expect(calls[1]?.body.get("application_fee_amount")).toBe("500");
    expect(calls[2]?.body.get("invoice")).toBe("in_1");
    expect(new Set(calls.map(({ headers }) => headers["Idempotency-Key"])).size).toBe(5);
  });

  it("maps a refused request to UNAVAILABLE", async () => {
    vi.stubGlobal(
      "fetch",
      async () =>
        new Response(JSON.stringify({ error: { message: "No such account" } }), { status: 400 }),
    );
    const input = { ...base, successUrl: "https://s", cancelUrl: "https://c" };
    const result = await stripePaymentProvider.createCheckout(input);
    expect(result.ok ? null : result.error.code).toBe("UNAVAILABLE");
  });
});
