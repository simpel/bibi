import type { PublicPaymentDto } from "@bibi/core/schemas";
import { describe, expect, it } from "vitest";
import { paymentOutcome, pickableMethods } from "./payment-outcome";

const base: PublicPaymentDto = {
  organizationName: "Venue",
  orderReference: 1,
  method: "CARD",
  methods: ["CARD"],
  status: "PENDING",
  amountMinor: 10_000,
  currency: "SEK",
  paymentUrl: "https://pay.test/x",
  expiresAt: null,
  paidAt: null,
  lines: [],
  totals: null,
};

describe("paymentOutcome", () => {
  it("offers a pay button for an open card checkout", () => {
    expect(paymentOutcome({ payment: base })).toBe("pay");
  });
  it("shows processing, not the pay button, when the customer just came back from Stripe", () => {
    expect(paymentOutcome({ payment: base, returning: true })).toBe("processing");
    expect(paymentOutcome({ payment: { ...base, status: "SUCCEEDED" }, returning: true })).toBe(
      "paid",
    );
  });
  it("points an invoice payer to the invoice instead", () => {
    const invoice = { ...base, method: "INVOICE" as const, methods: [], paymentUrl: null };
    expect(paymentOutcome({ payment: invoice })).toBe("invoice");
  });
  it("offers the picker for routed methods even before a checkout exists", () => {
    const swish = { ...base, methods: ["SWISH" as const], paymentUrl: null };
    expect(paymentOutcome({ payment: swish })).toBe("pay");
    expect(
      pickableMethods({ payment: { ...base, methods: ["CARD", "SWISH", "INVOICE"] } }),
    ).toEqual(["CARD", "SWISH"]);
  });
  it("maps the final states", () => {
    expect(paymentOutcome({ payment: { ...base, status: "SUCCEEDED" } })).toBe("paid");
    expect(paymentOutcome({ payment: { ...base, status: "EXPIRED" } })).toBe("expired");
    expect(paymentOutcome({ payment: { ...base, status: "FAILED" } })).toBe("unavailable");
    expect(paymentOutcome({ payment: { ...base, status: "REFUNDED" } })).toBe("unavailable");
  });
});
