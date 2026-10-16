import { describe, expect, it } from "vitest";
import { verifyStripeSignature } from "../src/features/payment/stripe-signature";
import { sign } from "./stripe-webhook-helpers";

const secret = "whsec_test_secret";
const payload = '{"id":"evt_1"}';
const now = new Date("2026-10-16T12:00:00Z");
const at = ({ offset }: { offset: number }) => Math.floor(now.getTime() / 1000) + offset;

const verify = ({ header, body = payload }: { header: string | null; body?: string }) =>
  verifyStripeSignature({ payload: body, header, secret, now });

describe("verifyStripeSignature", () => {
  it("accepts a valid signature", () => {
    expect(verify({ header: sign({ body: payload, timestamp: at({ offset: 0 }) }) }).ok).toBe(true);
  });

  it("accepts when any v1 signature matches (secret rollover)", () => {
    const header = `${sign({ body: payload, timestamp: at({ offset: 0 }) })},v1=${"0".repeat(64)}`;
    expect(verify({ header }).ok).toBe(true);
  });

  it.each([
    {
      name: "wrong secret",
      header: sign({ body: payload, secret: "other", timestamp: at({ offset: 0 }) }),
    },
    { name: "stale timestamp", header: sign({ body: payload, timestamp: at({ offset: -600 }) }) },
    { name: "future timestamp", header: sign({ body: payload, timestamp: at({ offset: 600 }) }) },
    { name: "missing header", header: null },
    { name: "malformed header", header: "garbage" },
  ])("rejects $name", ({ header }) => {
    const result = verify({ header });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("UNAUTHENTICATED");
  });

  it("rejects a tampered body", () => {
    expect(
      verify({
        header: sign({ body: payload, timestamp: at({ offset: 0 }) }),
        body: '{"id":"evt_2"}',
      }).ok,
    ).toBe(false);
  });
});
