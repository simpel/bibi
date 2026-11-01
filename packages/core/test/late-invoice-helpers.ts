import { createInvoice, createPayment, execute, sendInvoice } from "../src/index";
import { unwrap } from "./helpers";
import { makeInvoiceable, markSucceeded, moneySetup } from "./receivable-helpers";

const DAY_MS = 86_400_000;

/** A sent, half-paid invoice of 5 600 kr incl. 12 % VAT, due 40 days ago, 1 000 kr refunded. */
export async function halfPaidLateInvoice() {
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
