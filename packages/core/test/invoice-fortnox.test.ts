import { afterEach, describe, expect, it } from "vitest";
import {
  createInvoice,
  execute,
  listPayments,
  requestDeposit,
  sendInvoice,
  setFortnoxInvoicingGateway,
  setPaymentProvider,
  setStripeConnectGateway,
  syncInvoice,
  updatePaymentSettings,
} from "../src/index";
import { connectFortnox, installFakeInvoicing } from "./fortnox-invoicing-helpers";
import { errorCode, unwrap } from "./helpers";
import { useFortnoxEnv } from "./integration-helpers";
import { makeInvoiceable, markSucceeded, moneySetup } from "./receivable-helpers";

useFortnoxEnv();

afterEach(() => {
  setPaymentProvider({ provider: undefined });
  setStripeConnectGateway({ gateway: undefined });
  setFortnoxInvoicingGateway({ gateway: undefined });
});

describe("invoices in Fortnox (ADR 0090)", () => {
  it("raises the sent invoice with a deposit row and mirrors its payments", async () => {
    const { context, order } = await moneySetup();
    const orderId = order.id;
    await connectFortnox({ context });
    const fake = installFakeInvoicing();
    await execute({
      operation: updatePaymentSettings,
      input: { invoiceProvider: "FORTNOX" },
      context,
    });
    const deposit = unwrap({
      result: await execute({
        operation: requestDeposit,
        input: { orderId, description: "Advance", amountMinor: 150_000 },
        context,
      }),
    });
    await markSucceeded({ context, paymentId: deposit.id });
    await makeInvoiceable({ context, statusId: order.statusId });
    const draft = unwrap({
      result: await execute({ operation: createInvoice, input: { orderId }, context }),
    });
    const sent = unwrap({
      result: await execute({ operation: sendInvoice, input: { id: draft.id }, context }),
    });
    expect(sent).toMatchObject({ provider: "FORTNOX", providerReference: "1" });
    expect(fake.raised).toHaveLength(1);
    // The deposit carries the order's 12 % (ADR 0093): 1 500 kr = 1 339.29 + 160.71 VAT.
    expect(fake.raised[0]?.rows.at(-1)).toMatchObject({
      description: "Advance",
      price: -1339.29,
      vatPercent: 12,
    });

    fake.payments = [
      { number: "7", amountMinor: 410_000, paidAt: new Date("2026-11-20T12:00:00Z") },
    ];
    const synced = unwrap({
      result: await execute({ operation: syncInvoice, input: { id: draft.id }, context }),
    });
    expect(synced).toMatchObject({ paidMinor: 410_000, progress: "PAID" });
    unwrap({ result: await execute({ operation: syncInvoice, input: { id: draft.id }, context }) });
    const page = unwrap({
      result: await execute({ operation: listPayments, input: { orderId }, context }),
    });
    expect(page.items.filter((p) => p.provider === "FORTNOX")).toHaveLength(1);
    expect(fake.raised).toHaveLength(1);

    fake.payments = [];
    const reversed = unwrap({
      result: await execute({ operation: syncInvoice, input: { id: draft.id }, context }),
    });
    expect(reversed).toMatchObject({ paidMinor: 0, progress: "OPEN" });
  });

  it("refuses Fortnox as provider while Fortnox is not connected", async () => {
    const { context, order } = await moneySetup();
    await execute({
      operation: updatePaymentSettings,
      input: { invoiceProvider: "FORTNOX" },
      context,
    });
    await makeInvoiceable({ context, statusId: order.statusId });
    const draft = unwrap({
      result: await execute({ operation: createInvoice, input: { orderId: order.id }, context }),
    });
    const refused = await execute({ operation: sendInvoice, input: { id: draft.id }, context });
    expect(errorCode({ result: refused })).toBe("CONFLICT");
    const notThere = await execute({ operation: syncInvoice, input: { id: draft.id }, context });
    expect(errorCode({ result: notThere })).toBe("CONFLICT");
  });
});
