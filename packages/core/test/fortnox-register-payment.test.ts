import { afterEach, describe, expect, it, vi } from "vitest";
import { fortnoxInvoicing } from "../src/providers/fortnox/fortnox-invoicing";
import { unwrap } from "./helpers";

type Call = { url: string; method: string; body?: string };

function stubFortnox({ respond }: { respond: (call: Call) => { status: number; json?: unknown } }) {
  const calls: Call[] = [];
  vi.stubGlobal("fetch", async (url: string, init: RequestInit = {}) => {
    const call: Call = {
      url: String(url),
      method: String(init.method ?? "GET"),
      ...(init.body === undefined ? {} : { body: String(init.body) }),
    };
    calls.push(call);
    const { status, json } = respond(call);
    return new Response(json === undefined ? "" : JSON.stringify(json), { status });
  });
  return calls;
}

const auth = { externalAccountId: null, accessToken: "access-1" };
const payment = {
  reference: "pay_1",
  amountMinor: 125_050,
  paidAt: new Date("2026-11-09T12:00:00Z"),
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("Fortnox registers payments and reads credits (ADR 0100, 0106)", () => {
  it("creates the invoice payment and bookkeeps it", async () => {
    const calls = stubFortnox({
      respond: ({ method }) =>
        method === "POST"
          ? { status: 201, json: { InvoicePayment: { Number: 42 } } }
          : { status: 200, json: {} },
    });
    const register = fortnoxInvoicing.registerPayment;
    if (!register) throw new Error("no registerPayment");
    const done = await register({ auth, providerReference: "1007", payment });
    expect(unwrap({ result: done })).toEqual({ providerReference: "42" });
    expect(calls.map(({ method, url }) => `${method} ${url}`)).toEqual([
      "POST https://api.fortnox.se/3/invoicepayments",
      "PUT https://api.fortnox.se/3/invoicepayments/42/bookkeep",
    ]);
    expect(JSON.parse(calls[0]?.body ?? "{}")).toEqual({
      InvoicePayment: {
        InvoiceNumber: 1007,
        Amount: 1250.5,
        PaymentDate: "2026-11-09",
        ExternalInvoiceReference1: "pay_1",
      },
    });
  });

  it("is UNAVAILABLE when Fortnox refuses the payment", async () => {
    stubFortnox({
      respond: () => ({ status: 400, json: { ErrorInformation: { message: "Closed period" } } }),
    });
    const register = fortnoxInvoicing.registerPayment;
    if (!register) throw new Error("no registerPayment");
    const done = await register({ auth, providerReference: "1007", payment });
    expect(done.ok).toBe(false);
    if (done.ok) return;
    expect(done.error.code).toBe("UNAVAILABLE");
    expect(done.error.message).toContain("Closed period");
  });
  it("reads whether an invoice was credited (the credit retry)", async () => {
    const lookup = fortnoxInvoicing.creditStatus;
    if (!lookup) throw new Error("no creditStatus");
    stubFortnox({
      respond: () => ({ status: 200, json: { Invoice: { CreditInvoiceReference: "1042" } } }),
    });
    const credited = await lookup({
      auth,
      providerReference: "1007",
      amountMinor: 100_000,
      known: [],
    });
    expect(unwrap({ result: credited })).toEqual({ status: "ISSUED", providerReference: "1042" });
    stubFortnox({
      respond: () => ({ status: 200, json: { Invoice: { CreditInvoiceReference: "0" } } }),
    });
    const none = await lookup({ auth, providerReference: "1007", amountMinor: 100_000, known: [] });
    expect(unwrap({ result: none })).toEqual({ status: "MISSING" });
  });
});
