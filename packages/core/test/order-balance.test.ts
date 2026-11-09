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
    const onQuote = { quoteId: quote.id, method: "CARD" as const, amountMinor: 200_000 };
    const part = unwrap({
      result: await execute({ operation: createPayment, input: onQuote, context }),
    });
    expect(part).toMatchObject({ quoteId: quote.id, depositId: null, amountMinor: 200_000 });
    await markSucceeded({ context, paymentId: part.id });
    const balance = await balanceOf({ context, orderId });
    expect(balance).toMatchObject({
      billedFrom: "QUOTE",
      billedMinor: 560_000,
      paidMinor: 300_000,
      balanceMinor: 260_000,
    });
    expect(balance.receivables).toEqual([
      expect.objectContaining({
        kind: "QUOTE",
        id: quote.id,
        paidMinor: 200_000,
        progress: "PARTLY_PAID",
      }),
      expect.objectContaining({ kind: "DEPOSIT", id: deposit.id, progress: "PAID" }),
    ]);
  });

  it("needs quote:read to pay a quote and leaves quotes out without it", async () => {
    const { context, order } = await moneySetup();
    const quote = await sentTestQuote({ context, orderId: order.id, accept: true });
    const permissions = { ...grantAll({}), quote: [] };
    const blind = testContext({ organizationId: context.organizationId, permissions });
    const input = { quoteId: quote.id, method: "CARD" as const };
    const refused = await execute({ operation: createPayment, input, context: blind });
    expect(errorCode({ result: refused })).toBe("VALIDATION");
    const balance = await balanceOf({ context: blind, orderId: order.id });
    expect(balance).toMatchObject({ billedFrom: "NONE", receivables: [] });
  });
});
