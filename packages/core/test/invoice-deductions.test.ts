import { afterEach, describe, expect, it } from "vitest";
import {
  createInvoice,
  createPayment,
  execute,
  getDeposit,
  getOrderBalance,
  requestDeposit,
  resetProviderAdapters,
  sendInvoice,
} from "../src/index";
import { unwrap } from "./helpers";
import { makeInvoiceable, markSucceeded, moneySetup } from "./receivable-helpers";

afterEach(() => {
  resetProviderAdapters();
});

describe("a final invoice deducts paid deposits (ADR 0090)", () => {
  it("freezes what was paid, asks for the rest and keeps the order balance", async () => {
    const { context, order } = await moneySetup();
    const orderId = order.id;
    const deposit = unwrap({
      result: await execute({
        operation: requestDeposit,
        input: { orderId, description: "Advance", amountMinor: 150_000 },
        context,
      }),
    });
    // A second deposit with nothing paid is not deducted.
    await execute({
      operation: requestDeposit,
      input: { orderId, description: "Unpaid", amountMinor: 10_000 },
      context,
    });
    await markSucceeded({ context, paymentId: deposit.id });
    const created = unwrap({
      result: await execute({
        operation: getDeposit,
        input: { id: deposit.depositId ?? "" },
        context,
      }),
    });
    // The order's 5 600 kr at 12 % scaled to the deposit (ADR 0093).
    expect(created.vatRows).toEqual([
      { vatRatePercent: 12, totalExclVatMinor: 133_929, vatMinor: 16_071 },
    ]);
    await makeInvoiceable({ context, statusId: order.statusId });
    const invoice = unwrap({
      result: await execute({ operation: createInvoice, input: { orderId }, context }),
    });
    expect(invoice).toMatchObject({
      totalInclVatMinor: 560_000,
      amountDueMinor: 410_000,
      openMinor: 410_000,
      deductions: [{ depositId: deposit.depositId, description: "Advance", amountMinor: 150_000 }],
    });
    await execute({ operation: sendInvoice, input: { id: invoice.id }, context });
    const rest = unwrap({
      result: await execute({
        operation: createPayment,
        input: { invoiceId: invoice.id, method: "CARD" },
        context,
      }),
    });
    expect(rest.amountMinor).toBe(410_000);
    await markSucceeded({ context, paymentId: rest.id });
    const balance = unwrap({
      result: await execute({ operation: getOrderBalance, input: { orderId }, context }),
    });
    expect(balance).toMatchObject({ billedMinor: 560_000, paidMinor: 560_000, balanceMinor: 0 });
    const billed = balance.receivables.find((r) => r.id === invoice.id);
    expect(billed).toMatchObject({ amountMinor: 410_000, progress: "PAID" });
  });
});
