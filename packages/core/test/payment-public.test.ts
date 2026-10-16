import { getDb } from "@okazi/db";
import { afterEach, describe, expect, it } from "vitest";
import {
  createCoreOperations,
  createPayment,
  type ExecuteContext,
  execute,
  getPublicPayment,
  setPaymentProvider,
  setStripeConnectGateway,
} from "../src/index";
import { fakeEmbed } from "./fake-embed";
import { unwrap } from "./helpers";
import { paymentSetup } from "./payment-helpers";

afterEach(() => {
  setPaymentProvider({ provider: undefined });
  setStripeConnectGateway({ gateway: undefined });
});

type TokenInput = { context: ExecuteContext; bookingId: string };

async function newPayment({ context, bookingId }: TokenInput) {
  const payment = unwrap({
    result: await execute({
      operation: createPayment,
      input: { bookingId, method: "CARD", amountMinor: 125_000 },
      context,
    }),
  });
  const row = await getDb().payment.findUniqueOrThrow({ where: { id: payment.id } });
  return { payment, token: row.publicToken };
}

describe("public payment page lookup", () => {
  it("gives every payment its own unguessable token", async () => {
    const { context, bookingId } = await paymentSetup();
    const first = await newPayment({ context, bookingId });
    const second = await newPayment({ context, bookingId });
    expect(first.token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(first.token).not.toBe(second.token);
    expect(first.token).not.toBe(first.payment.id);
  });

  it("reads a payment by token without a session and exposes no personal data", async () => {
    const { context, bookingId } = await paymentSetup();
    const { payment, token } = await newPayment({ context, bookingId });
    const view = unwrap({ result: await getPublicPayment({ token }) });
    expect(view).toMatchObject({
      method: "CARD",
      status: "PENDING",
      amountMinor: 125_000,
      currency: "SEK",
      paymentUrl: payment.paymentUrl,
    });
    expect(Object.keys(view).sort()).toEqual([
      "amountMinor",
      "bookingReference",
      "currency",
      "expiresAt",
      "method",
      "organizationName",
      "paidAt",
      "paymentUrl",
      "status",
    ]);
  });

  it("answers NOT_FOUND for unknown and malformed tokens alike", async () => {
    const unknown = await getPublicPayment({ token: "x".repeat(43) });
    const malformed = await getPublicPayment({ token: "../etc" });
    expect(unknown).toMatchObject({ ok: false, error: { code: "NOT_FOUND" } });
    expect(malformed).toMatchObject({ ok: false, error: { code: "NOT_FOUND" } });
  });

  it("shows an unpaid payment past its checkout expiry as EXPIRED without a pay link", async () => {
    const { context, bookingId } = await paymentSetup();
    const { payment, token } = await newPayment({ context, bookingId });
    await getDb().payment.update({
      where: { id: payment.id },
      data: { expiresAt: new Date(Date.now() - 1000) },
    });
    const view = unwrap({ result: await getPublicPayment({ token }) });
    expect(view).toMatchObject({ status: "EXPIRED", paymentUrl: null });
  });

  it("shows a paid payment as SUCCEEDED without a pay link", async () => {
    const { context, bookingId } = await paymentSetup();
    const { payment, token } = await newPayment({ context, bookingId });
    await getDb().payment.update({
      where: { id: payment.id },
      data: { status: "SUCCEEDED", paidAt: new Date() },
    });
    const view = unwrap({ result: await getPublicPayment({ token }) });
    expect(view).toMatchObject({ status: "SUCCEEDED", paymentUrl: null });
    expect(view.paidAt).toBeInstanceOf(Date);
  });

  it("does not accept the payment id in place of the token", async () => {
    const { context, bookingId } = await paymentSetup();
    const { payment } = await newPayment({ context, bookingId });
    const result = await getPublicPayment({ token: payment.id });
    expect(result).toMatchObject({ ok: false, error: { code: "NOT_FOUND" } });
  });

  it("is not an operation any surface can call", () => {
    const names = createCoreOperations({ embed: fakeEmbed }).map(({ name }) => name);
    expect(names).toContain("payment.create");
    expect(names).not.toContain("payment.getPublic");
  });
});
