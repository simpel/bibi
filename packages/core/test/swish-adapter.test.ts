import { describe, expect, it } from "vitest";
import { sealSecret } from "../src/crypto/secret-box";
import { findProvider } from "../src/index";
import { swishAmount, swishInstructionId, swishMessage } from "../src/providers/swish/swish-format";
import type { ProviderAuth } from "../src/providers/types";
import { errorCode, unwrap } from "./helpers";
import {
  paymentRequest,
  SWISH_NUMBER,
  stubSwish,
  swishCredentials,
  useSwishEnv,
} from "./swish-helpers";

useSwishEnv();

const swish = () => {
  const adapter = findProvider({ key: "SWISH" });
  if (!adapter?.collect || adapter.connect.kind !== "CREDENTIALS") throw new Error("no Swish");
  return { collect: adapter.collect, connect: adapter.connect };
};

const auth = (): ProviderAuth => ({
  externalAccountId: SWISH_NUMBER,
  accessToken: null,
  credentialsSealed: unwrap({ result: sealSecret({ plain: JSON.stringify(swishCredentials()) }) }),
});

const attemptInput = () => ({
  auth: auth(),
  method: "SWISH" as const,
  amountMinor: 125_050,
  currency: "SEK",
  description: "Order #1042 & lunch",
  idempotencyKey: "bibi-attempt-a1",
  metadata: { paymentId: "pay1", orderId: "o1", organizationId: "org1" },
  successUrl: "https://bibi.test/pay/tok?checkout=success",
  cancelUrl: "https://bibi.test/pay/tok",
  recipient: { name: "Acme", email: "" },
  daysUntilDue: 30,
});

describe("Swish formatting", () => {
  it("formats amounts, messages and stable instruction ids", () => {
    expect(swishAmount({ minor: 125_050 })).toBe("1250.50");
    expect(swishAmount({ minor: 5 })).toBe("0.05");
    expect(swishMessage({ text: "Order #1042 & lunch – åäö" })).toBe("Order 1042 lunch åäö");
    const id = swishInstructionId({ key: "k" });
    expect(id).toMatch(/^[0-9A-F]{32}$/);
    expect(swishInstructionId({ key: "k" })).toBe(id);
  });
});

describe("Swish collect port (ADR 0100)", () => {
  it("creates an m-commerce payment request and returns its token", async () => {
    const stub = stubSwish();
    stub.route = () => ({ status: 201, headers: { paymentrequesttoken: "tok123" } });
    const ref = unwrap({ result: await swish().collect.startAttempt(attemptInput()) });
    const id = swishInstructionId({ key: "bibi-attempt-a1" });
    expect(ref.providerReference).toBe(id);
    expect(ref.qrToken).toBe("tok123");
    expect(ref.url).toBe(
      `swish://paymentrequest?token=tok123&callbackurl=${encodeURIComponent("https://bibi.test/pay/tok?checkout=success")}`,
    );
    expect(ref.expiresAt?.getTime()).toBeGreaterThan(Date.now() + 2 * 60_000);
    const [call] = stub.calls;
    expect(call).toMatchObject({
      method: "PUT",
      url: `https://mss.swish.test/swish-cpcapi/api/v2/paymentrequests/${id}`,
      passphrase: "swish",
    });
    expect(JSON.parse(call?.body ?? "{}")).toEqual({
      payeePaymentReference: "pay1",
      callbackUrl: "https://bibi.test/api/providers/swish/webhook",
      payeeAlias: SWISH_NUMBER,
      amount: "1250.50",
      currency: "SEK",
      message: "Order 1042 lunch",
    });
    expect(call?.body).not.toContain("payerAlias");
  });

  it("refuses other currencies and methods without calling Swish", async () => {
    const stub = stubSwish();
    const eur = await swish().collect.startAttempt({ ...attemptInput(), currency: "EUR" });
    expect(errorCode({ result: eur })).toBe("VALIDATION");
    const card = await swish().collect.startAttempt({ ...attemptInput(), method: "CARD" });
    expect(errorCode({ result: card })).toBe("VALIDATION");
    expect(stub.calls).toHaveLength(0);
  });

  it("reports Swish's error codes on a refused request", async () => {
    const stub = stubSwish();
    stub.route = () => ({ status: 422, json: [{ errorCode: "RP03", errorMessage: "bad url" }] });
    const refused = await swish().collect.startAttempt(attemptInput());
    expect(refused.ok).toBe(false);
    if (!refused.ok) expect(refused.error.message).toContain("RP03");
  });

  it("cancels a request with a JSON patch", async () => {
    const stub = stubSwish();
    stub.route = () => ({ status: 200, json: {} });
    const done = await swish().collect.cancelAttempt({ auth: auth(), providerReference: "ABC" });
    expect(done.ok).toBe(true);
    expect(stub.calls[0]).toMatchObject({
      method: "PATCH",
      url: "https://mss.swish.test/swish-cpcapi/api/v1/paymentrequests/ABC",
      contentType: "application/json-patch+json",
    });
    expect(JSON.parse(stub.calls[0]?.body ?? "[]")).toEqual([
      { op: "replace", path: "/status", value: "cancelled" },
    ]);
  });

  it("refunds by the original's payment reference", async () => {
    const stub = stubSwish();
    const original = "11A86BE70EA346E4B1C39C874173F088";
    stub.route = (request) =>
      request.method === "GET"
        ? {
            json: paymentRequest({
              id: original,
              payeeAlias: SWISH_NUMBER,
              status: "PAID",
              paymentReference: "1E2FC19E5E5E4E18916609B7F8911C12",
            }),
          }
        : { status: 201 };
    const refunded = unwrap({
      result: await swish().collect.refund({
        auth: auth(),
        providerReference: original,
        amountMinor: 10_000,
        idempotencyKey: "bibi-refund-r1",
        metadata: { paymentId: "pay1", refundId: "r1" },
      }),
    });
    const id = swishInstructionId({ key: "bibi-refund-r1" });
    expect(refunded.providerReference).toBe(id);
    expect(stub.calls[1]?.url).toBe(`https://mss.swish.test/swish-cpcapi/api/v2/refunds/${id}`);
    expect(JSON.parse(stub.calls[1]?.body ?? "{}")).toMatchObject({
      originalPaymentReference: "1E2FC19E5E5E4E18916609B7F8911C12",
      payerAlias: SWISH_NUMBER,
      payerPaymentReference: "pay1",
      amount: "100.00",
      currency: "SEK",
    });
  });
});

describe("Swish connect (ADR 0100)", () => {
  it("accepts a certificate Swish lets through (404 on a probe)", async () => {
    const stub = stubSwish();
    const verified = await swish().connect.verify({ credentials: swishCredentials() });
    expect(unwrap({ result: verified })).toEqual({ externalAccountId: SWISH_NUMBER });
    expect(stub.calls[0]?.method).toBe("GET");
  });

  it("refuses a certificate Swish rejects, and a bad number", async () => {
    const stub = stubSwish();
    stub.route = () => ({ status: 403 });
    const refused = await swish().connect.verify({ credentials: swishCredentials() });
    expect(errorCode({ result: refused })).toBe("VALIDATION");
    const bad = await swish().connect.verify({
      credentials: { ...swishCredentials(), swishNumber: "0701234567" },
    });
    expect(errorCode({ result: bad })).toBe("VALIDATION");
  });

  it("refuses another venue's Swish number with a certificate issued to a different one", async () => {
    const stub = stubSwish();
    const squat = await swish().connect.verify({
      credentials: swishCredentials({ number: SWISH_NUMBER, issuedTo: "1239999999" }),
    });
    expect(errorCode({ result: squat })).toBe("VALIDATION");
    const unreadable = await swish().connect.verify({
      credentials: { ...swishCredentials(), passphrase: "wrong" },
    });
    expect(errorCode({ result: unreadable })).toBe("VALIDATION");
    expect(stub.calls).toHaveLength(0);
  });

  it("reads a refund again by the instruction id derived from Bibi's key", async () => {
    const stub = stubSwish();
    const id = swishInstructionId({ key: "bibi-refund-r1" });
    const read = swish().collect.refundStatus;
    if (!read) throw new Error("no refundStatus");
    const input = {
      auth: auth(),
      providerReference: "11A86BE70EA346E4B1C39C874173F088",
      idempotencyKey: "bibi-refund-r1",
      refundReference: null,
      metadata: { paymentId: "pay1", refundId: "r1" },
    };
    stub.route = () => ({
      json: {
        id,
        originalPaymentReference: "1E2FC19E5E5E4E18916609B7F8911C12",
        payerAlias: SWISH_NUMBER,
        status: "PAID",
        datePaid: "2026-11-09T12:00:00Z",
      },
    });
    expect(unwrap({ result: await read(input) })).toEqual({
      status: "SUCCEEDED",
      providerReference: id,
      occurredAt: new Date("2026-11-09T12:00:00Z"),
    });
    expect(stub.calls[0]?.url).toBe(`https://mss.swish.test/swish-cpcapi/api/v1/refunds/${id}`);
    stub.route = () => ({ status: 404 });
    expect(unwrap({ result: await read(input) })).toEqual({ status: "MISSING" });
  });
});
