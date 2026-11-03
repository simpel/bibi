import { afterEach, describe, expect, it } from "vitest";
import {
  createInvoice,
  createPayment,
  execute,
  getDeposit,
  getTicketBalance,
  requestDeposit,
  sendInvoice,
  setPaymentProvider,
  setStripeConnectGateway,
} from "../src/index";
import { unwrap } from "./helpers";
import { makeInvoiceable, markSucceeded, moneySetup } from "./receivable-helpers";

afterEach(() => {
  setPaymentProvider({ provider: undefined });
  setStripeConnectGateway({ gateway: undefined });
});

describe("a final invoice deducts paid deposits (ADR 0090)", () => {
  it("freezes what was paid, asks for the rest and keeps the ticket balance", async () => {
    const { context, ticket } = await moneySetup();
    const ticketId = ticket.id;
    const deposit = unwrap({
      result: await execute({
        operation: requestDeposit,
        input: { ticketId, description: "Advance", amountMinor: 150_000 },
        context,
      }),
    });
    // A second deposit with nothing paid is not deducted.
    await execute({
      operation: requestDeposit,
      input: { ticketId, description: "Unpaid", amountMinor: 10_000 },
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
    // The ticket's 5 600 kr at 12 % scaled to the deposit (ADR 0093).
    expect(created.vatRows).toEqual([
      { vatRatePercent: 12, totalExclVatMinor: 133_929, vatMinor: 16_071 },
    ]);
    await makeInvoiceable({ context, statusId: ticket.statusId });
    const invoice = unwrap({
      result: await execute({ operation: createInvoice, input: { ticketId }, context }),
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
      result: await execute({ operation: getTicketBalance, input: { ticketId }, context }),
    });
    expect(balance).toMatchObject({ billedMinor: 560_000, paidMinor: 560_000, balanceMinor: 0 });
    const billed = balance.receivables.find((r) => r.id === invoice.id);
    expect(billed).toMatchObject({ amountMinor: 410_000, progress: "PAID" });
  });
});
