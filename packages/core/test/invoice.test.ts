import { afterEach, describe, expect, it } from "vitest";
import {
  createInvoice,
  createPayment,
  type ExecuteContext,
  execute,
  getInvoice,
  getTicketBalance,
  grantAll,
  sendInvoice,
  setPaymentProvider,
  setStripeConnectGateway,
  updateLine,
  voidInvoice,
} from "../src/index";
import { errorCode, testContext, unwrap } from "./helpers";
import { makeInvoiceable, markSucceeded, moneySetup } from "./receivable-helpers";

afterEach(() => {
  setPaymentProvider({ provider: undefined });
  setStripeConnectGateway({ gateway: undefined });
});

type Ctx = { context: ExecuteContext };

async function invoiceable() {
  const setup = await moneySetup();
  await makeInvoiceable({ context: setup.context, phaseId: setup.ticket.phaseId });
  return setup;
}

const create = ({ context, ticketId }: Ctx & { ticketId: string }) =>
  execute({ operation: createInvoice, input: { ticketId }, context });

describe("an invoice is a frozen receivable of the ticket's lines (ADR 0052, 0057)", () => {
  it("needs an invoiceable phase", async () => {
    const { context, ticket } = await moneySetup();
    expect(errorCode({ result: await create({ context, ticketId: ticket.id }) })).toBe("CONFLICT");
  });

  it("freezes the lines, numbers it and allows one open invoice per ticket", async () => {
    const { context, ticket } = await invoiceable();
    const invoice = unwrap({ result: await create({ context, ticketId: ticket.id }) });
    expect(invoice).toMatchObject({
      number: 1,
      status: "DRAFT",
      totalInclVatMinor: 560_000,
      progress: "OPEN",
    });
    expect(invoice.lines).toHaveLength(1);
    expect(invoice.dueDate).toBeInstanceOf(Date);
    const [line] = invoice.lines;
    const input = { id: line?.lineId ?? "", quantity: 5 };
    unwrap({ result: await execute({ operation: updateLine, input, context }) });
    const read = unwrap({
      result: await execute({ operation: getInvoice, input: { id: invoice.id }, context }),
    });
    expect(read.lines).toEqual(invoice.lines);
    expect(errorCode({ result: await create({ context, ticketId: ticket.id }) })).toBe("CONFLICT");
    unwrap({
      result: await execute({ operation: voidInvoice, input: { id: invoice.id }, context }),
    });
    const next = unwrap({ result: await create({ context, ticketId: ticket.id }) });
    expect(next).toMatchObject({ number: 2, totalInclVatMinor: 140_000 });
  });

  it("is billed once sent, settled by payments and not voided while paid", async () => {
    const { context, ticket } = await invoiceable();
    const invoice = unwrap({ result: await create({ context, ticketId: ticket.id }) });
    const pay = { invoiceId: invoice.id, method: "CARD" as const };
    const early = await execute({ operation: createPayment, input: pay, context });
    expect(errorCode({ result: early })).toBe("CONFLICT");
    unwrap({
      result: await execute({ operation: sendInvoice, input: { id: invoice.id }, context }),
    });
    const payment = unwrap({
      result: await execute({ operation: createPayment, input: pay, context }),
    });
    expect(payment.amountMinor).toBe(560_000);
    await markSucceeded({ context, paymentId: payment.id });
    const input = { ticketId: ticket.id };
    const balance = unwrap({
      result: await execute({ operation: getTicketBalance, input, context }),
    });
    expect(balance).toMatchObject({ billedFrom: "INVOICE", billedMinor: 560_000, balanceMinor: 0 });
    const blocked = await execute({ operation: voidInvoice, input: { id: invoice.id }, context });
    expect(errorCode({ result: blocked })).toBe("CONFLICT");
  });

  it("needs line:read to copy the lines and stays in its organization", async () => {
    const { context, ticket } = await invoiceable();
    const permissions = { ...grantAll({ upTo: "admin" }), line: [] };
    const blind = testContext({ organizationId: context.organizationId, permissions });
    expect(errorCode({ result: await create({ context: blind, ticketId: ticket.id }) })).toBe(
      "VALIDATION",
    );
    const invoice = unwrap({ result: await create({ context, ticketId: ticket.id }) });
    const stranger = testContext();
    const get = await execute({
      operation: getInvoice,
      input: { id: invoice.id },
      context: stranger,
    });
    expect(errorCode({ result: get })).toBe("NOT_FOUND");
    const theirs = await create({ context: stranger, ticketId: ticket.id });
    expect(errorCode({ result: theirs })).toBe("NOT_FOUND");
    const send = await execute({
      operation: sendInvoice,
      input: { id: invoice.id },
      context: stranger,
    });
    expect(errorCode({ result: send })).toBe("NOT_FOUND");
  });
});
