import { afterEach, describe, expect, it } from "vitest";
import {
  createInvoice,
  createPayment,
  execute,
  setPaymentProvider,
  setStripeConnectGateway,
  voidDeposit,
} from "../src/index";
import { errorCode } from "./helpers";
import { paymentSetup } from "./payment-helpers";
import { makeInvoiceable, moneySetup } from "./receivable-helpers";

afterEach(() => {
  setPaymentProvider({ provider: undefined });
  setStripeConnectGateway({ gateway: undefined });
});

describe("receivables under concurrency (ADR 0057)", () => {
  it("lets only one of two concurrent invoices of a ticket through", async () => {
    const { context, ticket } = await moneySetup();
    await makeInvoiceable({ context, statusId: ticket.statusId });
    const input = { ticketId: ticket.id };
    const results = await Promise.all([
      execute({ operation: createInvoice, input, context }),
      execute({ operation: createInvoice, input, context }),
    ]);
    expect(results.map((result) => errorCode({ result })).sort()).toEqual(
      [null, "CONFLICT"].sort(),
    );
  });

  it("never leaves a pending payment on a voided deposit", async () => {
    const { context, depositId } = await paymentSetup();
    const [payment, voided] = await Promise.all([
      execute({ operation: createPayment, input: { depositId, method: "CARD" }, context }),
      execute({ operation: voidDeposit, input: { id: depositId }, context }),
    ]);
    expect([payment.ok, voided.ok].filter(Boolean)).toHaveLength(1);
  });

  it("refuses a payment row that settles no receivable in the database", async () => {
    const { context, depositId, ticketId } = await paymentSetup();
    const insert = context.db.payment.create({
      data: {
        organizationId: context.organizationId,
        ticketId,
        method: "CARD",
        amountMinor: 100,
        providerAccountId: "acct_x",
        publicToken: `t_${depositId}`,
      },
    });
    await expect(insert).rejects.toThrow(/Payment_one_receivable_check|check constraint/i);
  });
});
