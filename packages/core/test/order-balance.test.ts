import { afterEach, describe, expect, it } from "vitest";
import {
  createPayment,
  type ExecuteContext,
  execute,
  getOrderBalance,
  grantAll,
  resetProviderAdapters,
} from "../src/index";
import { errorCode, testContext, unwrap } from "./helpers";
import { sentDeposit } from "./payment-helpers";
import { markSucceeded, moneySetup, sentTestQuote } from "./receivable-helpers";

afterEach(() => {
  resetProviderAdapters();
});

const balanceOf = async ({ context, orderId }: { context: ExecuteContext; orderId: string }) =>
  unwrap({ result: await execute({ operation: getOrderBalance, input: { orderId }, context }) });

describe("the order balance is derived (ADR 0057)", () => {
  it("bills the accepted quote and subtracts every settled payment", async () => {
    const { context, order } = await moneySetup();
    const orderId = order.id;
    expect(await balanceOf({ context, orderId })).toMatchObject({
      billedFrom: "NONE",
      billedMinor: 0,
      balanceMinor: 0,
      receivables: [],
    });
    const deposit = await sentDeposit({ context, orderId, amountMinor: 100_000 });
    const quote = await sentTestQuote({ context, orderId, accept: true });
    expect(quote.totalInclVatMinor).toBe(560_000);
    const input = { depositId: deposit.id, method: "CARD" as const };
    const advance = unwrap({ result: await execute({ operation: createPayment, input, context }) });
    await markSucceeded({ context, paymentId: advance.id });
    // A quote is never paid directly (ADR 0106): accepting it leads to a second deposit.
    const second = await sentDeposit({ context, orderId, amountMinor: 200_000 });
    const onSecond = { depositId: second.id, method: "CARD" as const };
    const part = unwrap({
      result: await execute({ operation: createPayment, input: onSecond, context }),
    });
    await markSucceeded({ context, paymentId: part.id });
    const balance = await balanceOf({ context, orderId });
    expect(balance).toMatchObject({
      billedFrom: "QUOTE",
      billedMinor: 560_000,
      paidMinor: 300_000,
      balanceMinor: 260_000,
    });
    expect(balance.receivables).toEqual([
      expect.objectContaining({ kind: "QUOTE", id: quote.id, paidMinor: 0, progress: "OPEN" }),
      expect.objectContaining({ kind: "DEPOSIT", id: deposit.id, progress: "PAID" }),
      expect.objectContaining({ kind: "DEPOSIT", id: second.id, progress: "PAID" }),
    ]);
  });

  it("refuses to pay a quote directly and leaves quotes out without quote:read", async () => {
    const { context, order } = await moneySetup();
    const quote = await sentTestQuote({ context, orderId: order.id, accept: true });
    const direct = await execute({
      operation: createPayment,
      input: { quoteId: quote.id, method: "CARD" as const } as never,
      context,
    });
    expect(errorCode({ result: direct })).toBe("VALIDATION");
    const permissions = { ...grantAll({}), quote: [] };
    const blind = testContext({ organizationId: context.organizationId, permissions });
    const balance = await balanceOf({ context: blind, orderId: order.id });
    expect(balance).toMatchObject({ billedFrom: "NONE", receivables: [] });
  });
});
