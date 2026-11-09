import { afterEach, describe, expect, it } from "vitest";
import {
  cancelPayment,
  createPayment,
  execute,
  getPayment,
  recordManualPayment,
  refundPayment,
  resetProviderAdapters,
} from "../src/index";
import { errorCode, testContext, unwrap } from "./helpers";
import { sendSignal } from "./lifecycle-helpers";
import { paymentSetup } from "./payment-helpers";

afterEach(() => {
  resetProviderAdapters();
});

/** A card payment of 1 000 kr against the setup's deposit, paid through the provider's signal. */
async function paidPayment() {
  const setup = await paymentSetup();
  const { context, depositId } = setup;
  const input = { depositId, amountMinor: 100_000 };
  const payment = unwrap({ result: await execute({ operation: createPayment, input, context }) });
  const reference = payment.providerReference ?? "";
  await sendSignal({
    context,
    provider: "STRIPE",
    signal: { kind: "attempt.succeeded", reference },
  });
  return { ...setup, payment };
}

const refund = ({
  context,
  ...input
}: {
  context: Parameters<typeof execute>[0]["context"];
  id: string;
  amountMinor?: number;
}) => execute({ operation: refundPayment, input, context });

describe("payment.refund (ADR 0100)", () => {
  it("refunds in part and then in full, completed by the provider's signals", async () => {
    const { context, payment, provider } = await paidPayment();
    const partial = unwrap({
      result: await refund({ context, id: payment.id, amountMinor: 30_000 }),
    });
    expect(partial).toMatchObject({
      status: "SUCCEEDED",
      refundedMinor: 0,
      refundableMinor: 70_000,
    });
    expect(provider.portCalls).toEqual([`refund:${payment.providerReference}:30000`]);
    const first = await context.db.paymentRefund.findFirstOrThrow({
      where: { paymentId: payment.id },
    });
    expect(first).toMatchObject({ status: "PENDING", amountMinor: 30_000 });
    expect(first.providerReference).toMatch(/^re_/);

    const over = await refund({ context, id: payment.id, amountMinor: 70_001 });
    expect(errorCode({ result: over })).toBe("CONFLICT");

    const signal = { kind: "refund.succeeded" as const, refundId: first.id, paymentId: payment.id };
    expect(
      await sendSignal({ context, provider: "STRIPE", signal, eventId: `evt-${first.id}` }),
    ).toBe("applied");
    expect(
      await sendSignal({ context, provider: "STRIPE", signal, eventId: `evt-${first.id}` }),
    ).toBe("duplicate");
    await sendSignal({ context, provider: "STRIPE", signal });
    const read = () => execute({ operation: getPayment, input: { id: payment.id }, context });
    expect(unwrap({ result: await read() })).toMatchObject({
      status: "SUCCEEDED",
      refundedMinor: 30_000,
      refundableMinor: 70_000,
    });

    unwrap({ result: await refund({ context, id: payment.id }) });
    const rest = await context.db.paymentRefund.findFirstOrThrow({
      where: { paymentId: payment.id, status: "PENDING" },
    });
    expect(rest.amountMinor).toBe(70_000);
    const reference = rest.providerReference ?? "";
    await sendSignal({
      context,
      provider: "STRIPE",
      signal: { kind: "refund.succeeded", reference, paymentId: payment.id },
    });
    expect(unwrap({ result: await read() })).toMatchObject({
      status: "REFUNDED",
      refundedMinor: 100_000,
      refundableMinor: 0,
    });
  });

  it("marks a refund the provider refused FAILED and lets it be refunded again", async () => {
    const { context, payment, provider } = await paidPayment();
    provider.refusing.add("refund");
    const refused = await refund({ context, id: payment.id });
    expect(errorCode({ result: refused })).toBe("CONFLICT");
    const row = await context.db.paymentRefund.findFirstOrThrow({
      where: { paymentId: payment.id },
    });
    expect(row.status).toBe("FAILED");
    unwrap({ result: await refund({ context, id: payment.id }) });
  });

  it("keeps a refund PENDING when the provider may have made it, and sends only its own", async () => {
    const { context, payment, provider } = await paidPayment();
    provider.failing.add("refund");
    const unknown = await refund({ context, id: payment.id, amountMinor: 30_000 });
    expect(errorCode({ result: unknown })).toBe("UNAVAILABLE");
    const first = await context.db.paymentRefund.findFirstOrThrow({
      where: { paymentId: payment.id },
    });
    expect(first.status).toBe("PENDING");
    const read = unwrap({
      result: await execute({ operation: getPayment, input: { id: payment.id }, context }),
    });
    expect(read).toMatchObject({ refundableMinor: 70_000, refunds: [{ id: first.id }] });
    unwrap({ result: await refund({ context, id: payment.id, amountMinor: 20_000 }) });
    expect(provider.portCalls).toEqual([`refund:${payment.providerReference}:20000`]);
    // The provider made it after all: its signal (with Bibi's refund id) completes it.
    const signal = { kind: "refund.succeeded" as const, refundId: first.id, paymentId: payment.id };
    await sendSignal({ context, provider: "STRIPE", signal });
    const done = await context.db.paymentRefund.findUniqueOrThrow({ where: { id: first.id } });
    expect(done.status).toBe("SUCCEEDED");
  });

  it("keeps a dashboard refund reported while a Bibi refund was pending that then fails", async () => {
    const { context, payment, provider } = await paidPayment();
    provider.failing.add("refund");
    await refund({ context, id: payment.id, amountMinor: 30_000 });
    const pending = await context.db.paymentRefund.findFirstOrThrow({
      where: { paymentId: payment.id },
    });
    const reported = { kind: "refund.succeeded" as const, refundedTotalMinor: 20_000 };
    await sendSignal({
      context,
      provider: "STRIPE",
      signal: { ...reported, paymentId: payment.id },
    });
    const failed = { kind: "refund.failed" as const, refundId: pending.id, paymentId: payment.id };
    await sendSignal({ context, provider: "STRIPE", signal: failed });
    const read = unwrap({
      result: await execute({ operation: getPayment, input: { id: payment.id }, context }),
    });
    expect(read).toMatchObject({ refundedMinor: 20_000, refundableMinor: 80_000 });
  });

  it("refuses a payment that is not SUCCEEDED and a member without payment:refund", async () => {
    const { context, depositId, payment } = await paidPayment();
    const input = { depositId, amountMinor: 100_000 };
    const pending = unwrap({ result: await execute({ operation: createPayment, input, context }) });
    expect(errorCode({ result: await refund({ context, id: pending.id }) })).toBe("CONFLICT");
    const member = await testContext({ role: "member", organizationId: context.organizationId });
    expect(errorCode({ result: await refund({ context: member, id: payment.id }) })).toBe(
      "FORBIDDEN",
    );
    const manager = await testContext({ role: "manager", organizationId: context.organizationId });
    unwrap({ result: await refund({ context: manager, id: payment.id, amountMinor: 100 }) });
  });

  it("refunds a manual payment at once, with no provider", async () => {
    const { context, depositId, provider } = await paymentSetup();
    const input = { depositId, amountMinor: 50_000, paidAt: new Date(), note: "Bank transfer" };
    const manual = unwrap({
      result: await execute({ operation: recordManualPayment, input, context }),
    });
    expect(manual).toMatchObject({
      method: "MANUAL",
      status: "SUCCEEDED",
      provider: null,
      note: "Bank transfer",
    });
    const done = unwrap({ result: await refund({ context, id: manual.id }) });
    expect(done).toMatchObject({ status: "REFUNDED", refundedMinor: 50_000 });
    expect(provider.portCalls).toEqual([]);
  });
});

describe("payment.cancel and payment.recordManual (ADR 0100)", () => {
  it("cancels a PENDING payment and its open attempt at the provider", async () => {
    const { context, depositId, provider } = await paymentSetup();
    const input = { depositId, amountMinor: 100_000 };
    const payment = unwrap({ result: await execute({ operation: createPayment, input, context }) });
    const cancelled = unwrap({
      result: await execute({ operation: cancelPayment, input: { id: payment.id }, context }),
    });
    expect(cancelled.status).toBe("CANCELLED");
    expect(provider.portCalls).toEqual([`cancel:${payment.providerReference}`]);
    const again = await execute({ operation: cancelPayment, input: { id: payment.id }, context });
    expect(errorCode({ result: again })).toBe("CONFLICT");
    // Money that still arrives settles it.
    const reference = payment.providerReference ?? "";
    await sendSignal({
      context,
      provider: "STRIPE",
      signal: { kind: "attempt.succeeded", reference },
    });
    const read = unwrap({
      result: await execute({ operation: getPayment, input: { id: payment.id }, context }),
    });
    expect(read.status).toBe("SUCCEEDED");
  });

  it("records at most the open balance", async () => {
    const { context, depositId } = await paymentSetup();
    const input = { depositId, amountMinor: 1_000_001, paidAt: new Date() };
    const over = await execute({ operation: recordManualPayment, input, context });
    expect(errorCode({ result: over })).toBe("VALIDATION");
  });
});
