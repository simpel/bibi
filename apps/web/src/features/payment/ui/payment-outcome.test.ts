import type { PublicPaymentDto } from "@okazi/core/schemas";
import { describe, expect, it } from "vitest";
import { paymentOutcome } from "./payment-outcome";

const base: PublicPaymentDto = {
  organizationName: "Venue",
  bookingReference: 1,
  method: "CARD",
  status: "PENDING",
  amountMinor: 10_000,
  currency: "SEK",
  paymentUrl: "https://pay.test/x",
  expiresAt: null,
  paidAt: null,
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
    expect(paymentOutcome({ payment: { ...base, method: "INVOICE" } })).toBe("invoice");
  });
  it("maps the final states", () => {
    expect(paymentOutcome({ payment: { ...base, status: "SUCCEEDED" } })).toBe("paid");
    expect(paymentOutcome({ payment: { ...base, status: "EXPIRED" } })).toBe("expired");
    expect(paymentOutcome({ payment: { ...base, status: "FAILED" } })).toBe("unavailable");
    expect(paymentOutcome({ payment: { ...base, status: "REFUNDED" } })).toBe("unavailable");
  });
});
