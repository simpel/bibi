import { afterEach, describe, expect, it } from "vitest";
import {
  createInvoice,
  createPayment,
  type ExecuteContext,
  execute,
  financeOverview,
  grantAll,
  sendInvoice,
  setPaymentProvider,
  setStripeConnectGateway,
} from "../src/index";
import { errorCode, testContext, unwrap } from "./helpers";
import { makeInvoiceable, markSucceeded, moneySetup, sentTestQuote } from "./receivable-helpers";

afterEach(() => {
  setPaymentProvider({ provider: undefined });
  setStripeConnectGateway({ gateway: undefined });
});

const DAY_MS = 86_400_000;
const thisYear = () => {
  const year = new Date().getUTCFullYear();
  return { from: `${year}-01-01`, to: `${year}-12-31` };
};

const overview = ({ context }: { context: ExecuteContext }) =>
  execute({ operation: financeOverview, input: thisYear(), context });

/** A sent, half-paid invoice of 5 600 kr incl. 12 % VAT, due 40 days ago, 1 000 kr refunded. */
async function halfPaidLateInvoice() {
  const setup = await moneySetup();
  const { context, ticket } = setup;
  await makeInvoiceable({ context, statusId: ticket.statusId });
  const draft = unwrap({
    result: await execute({ operation: createInvoice, input: { ticketId: ticket.id }, context }),
  });
  const input = { id: draft.id };
  unwrap({ result: await execute({ operation: sendInvoice, input, context }) });
  const pay = { invoiceId: draft.id, method: "CARD" as const, amountMinor: 280_000 };
  const payment = unwrap({
    result: await execute({ operation: createPayment, input: pay, context }),
  });
  await markSucceeded({ context, paymentId: payment.id, refundedMinor: 100_000 });
  await context.db.paymentRefund.create({
    data: {
      organizationId: context.organizationId,
      paymentId: payment.id,
      amountMinor: 100_000,
      refundedTotalMinor: 100_000,
      refundedAt: new Date(),
    },
  });
  const dueDate = new Date(Date.now() - 40 * DAY_MS);
  await context.db.invoice.update({ where: input, data: { dueDate } });
  return setup;
}

describe("finance.overview derives the organization's money (ADR 0077)", () => {
  it("adds up invoiced, received, open and overdue money", async () => {
    const { context } = await halfPaidLateInvoice();
    const value = unwrap({ result: await overview({ context }) });
    expect(value.monthly).toHaveLength(12);
    expect(value).toMatchObject({
      invoicedExclVatMinor: 500_000,
      receivedMinor: 180_000,
      outstandingMinor: 380_000,
      overdueMinor: 380_000,
      vatByRate: [{ vatRatePercent: 12, totalExclVatMinor: 500_000, vatMinor: 60_000 }],
    });
    expect(value.aging).toMatchObject({ overdue31to60Minor: 380_000, notDueMinor: 0 });
    expect(value.aging?.overdue[0]).toMatchObject({ daysOverdue: 40, openMinor: 380_000 });
    expect(value.revenueByType?.[0]?.invoicedExclVatMinor).toBe(500_000);
  });

  it("counts an accepted quote as forward-booked until the ticket is invoiced", async () => {
    const { context, ticket } = await moneySetup();
    await sentTestQuote({ context, ticketId: ticket.id, accept: true });
    const value = unwrap({ result: await overview({ context }) });
    expect(value.forwardBooked).toEqual([
      expect.objectContaining({ valueExclVatMinor: 500_000, tickets: 1 }),
    ]);
  });

  it("hides the parts the caller may not read and stays in its organization", async () => {
    const { context } = await halfPaidLateInvoice();
    const permissions = { ...grantAll({}), payment: [], quote: [] };
    const blind = testContext({ organizationId: context.organizationId, permissions });
    const hidden = unwrap({ result: await overview({ context: blind }) });
    expect([hidden.monthly, hidden.aging, hidden.forwardBooked, hidden.receivedMinor]).toEqual([
      null,
      null,
      null,
      null,
    ]);
    const stranger = unwrap({ result: await overview({ context: testContext() }) });
    expect([stranger.invoicedExclVatMinor, stranger.outstandingMinor]).toEqual([0, 0]);
    const member = testContext({ organizationId: context.organizationId, access: "read" });
    expect(errorCode({ result: await overview({ context: member }) })).toBe("FORBIDDEN");
  });

  it("refuses a period that runs backwards or is longer than 24 months", async () => {
    const context = testContext();
    const backwards = { from: "2026-05-01", to: "2026-04-01" };
    const long = { from: "2024-01-01", to: "2026-01-01" };
    for (const input of [backwards, long]) {
      const result = await execute({ operation: financeOverview, input, context });
      expect(errorCode({ result })).toBe("VALIDATION");
    }
  });
});
