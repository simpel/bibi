import { afterEach, describe, expect, it } from "vitest";
import {
  createExecuteContext,
  createPayment,
  type ExecuteContext,
  execute,
  getPayment,
  grantAll,
  refundPayment,
  resetProviderAdapters,
  retryRefunds,
} from "../src/index";
import { errorCode, unwrap } from "./helpers";
import { sendSignal } from "./lifecycle-helpers";
import { paymentSetup } from "./payment-helpers";

afterEach(() => {
  resetProviderAdapters();
});

const MINUTE = 60_000;

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

/** The worker's run, `minutes` after now. */
const retry = ({ context, minutes }: { context: ExecuteContext; minutes: number }) => {
  const system = createExecuteContext({
    organizationId: context.organizationId,
    roles: [],
    permissions: grantAll({}),
    actor: { type: "system", userId: null },
  });
  const now = () => new Date(Date.now() + minutes * MINUTE);
  return execute({ operation: retryRefunds, input: {}, context: { ...system, now } });
};

const refundOf = ({ context, paymentId }: { context: ExecuteContext; paymentId: string }) =>
  context.db.paymentRefund.findFirstOrThrow({ where: { paymentId } });

describe("payment.retryRefunds (ADR 0100)", () => {
  it("completes a refund whose signal was lost, once it is 15 minutes old", async () => {
    const { context, payment } = await paidPayment();
    const input = { id: payment.id };
    unwrap({ result: await execute({ operation: refundPayment, input, context }) });
    const early = unwrap({ result: await retry({ context, minutes: 5 }) });
    expect(early).toMatchObject({ due: 0, settled: 0 });
    const late = unwrap({ result: await retry({ context, minutes: 20 }) });
    expect(late).toMatchObject({ due: 1, settled: 1, resent: 0, waiting: 0 });
    expect(await refundOf({ context, paymentId: payment.id })).toMatchObject({
      status: "SUCCEEDED",
    });
    const read = unwrap({
      result: await execute({ operation: getPayment, input, context }),
    });
    expect(read).toMatchObject({ status: "REFUNDED", refundedMinor: 100_000 });
    const again = unwrap({ result: await retry({ context, minutes: 40 }) });
    expect(again).toMatchObject({ due: 0 });
  });

  it("sends a refund the provider never received again under the same key", async () => {
    const { context, payment, provider } = await paidPayment();
    provider.failing.add("refund");
    const input = { id: payment.id, amountMinor: 30_000 };
    const unknown = await execute({ operation: refundPayment, input, context });
    expect(errorCode({ result: unknown })).toBe("UNAVAILABLE");
    const resent = unwrap({ result: await retry({ context, minutes: 20 }) });
    expect(resent).toMatchObject({ due: 1, resent: 1 });
    expect(provider.portCalls).toEqual([`refund:${payment.providerReference}:30000`]);
    const row = await refundOf({ context, paymentId: payment.id });
    expect(row.status).toBe("PENDING");
    expect(row.providerReference).toMatch(/^re_/);
    const settled = unwrap({ result: await retry({ context, minutes: 40 }) });
    expect(settled).toMatchObject({ due: 1, settled: 1 });
    expect(await refundOf({ context, paymentId: payment.id })).toMatchObject({
      status: "SUCCEEDED",
      amountMinor: 30_000,
    });
  });

  it("fails a refund the provider failed, and leaves one in progress", async () => {
    const { context, payment, provider } = await paidPayment();
    provider.refundOutcome = "PENDING";
    const input = { id: payment.id, amountMinor: 10_000 };
    unwrap({ result: await execute({ operation: refundPayment, input, context }) });
    const waiting = unwrap({ result: await retry({ context, minutes: 20 }) });
    expect(waiting).toMatchObject({ due: 1, waiting: 1 });
    for (const entry of provider.refunds.values()) entry.status = "FAILED";
    unwrap({ result: await retry({ context, minutes: 40 }) });
    expect(await refundOf({ context, paymentId: payment.id })).toMatchObject({
      status: "FAILED",
    });
  });

  it("runs as SYSTEM only", async () => {
    const { context } = await paidPayment();
    const asUser = await execute({ operation: retryRefunds, input: {}, context });
    expect(errorCode({ result: asUser })).toBe("FORBIDDEN");
  });
});
