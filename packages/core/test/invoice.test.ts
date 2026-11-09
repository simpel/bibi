import { afterEach, describe, expect, it } from "vitest";
import {
  createInvoice,
  createPayment,
  type ExecuteContext,
  execute,
  getInvoice,
  getOrderBalance,
  grantAll,
  resetProviderAdapters,
  sendInvoice,
  updateLine,
  voidInvoice,
} from "../src/index";
import { errorCode, testContext, unwrap } from "./helpers";
import { makeInvoiceable, markSucceeded, moneySetup } from "./receivable-helpers";

afterEach(() => {
  resetProviderAdapters();
});

type Ctx = { context: ExecuteContext };

async function invoiceable() {
  const setup = await moneySetup();
  await makeInvoiceable({ context: setup.context, statusId: setup.order.statusId });
  return setup;
}

const create = ({ context, orderId }: Ctx & { orderId: string }) =>
  execute({ operation: createInvoice, input: { orderId }, context });

describe("an invoice is a frozen receivable of the order's lines (ADR 0052, 0057)", () => {
  it("needs an invoiceable status", async () => {
    const { context, order } = await moneySetup();
    expect(errorCode({ result: await create({ context, orderId: order.id }) })).toBe("CONFLICT");
  });

  it("freezes the lines, numbers it and allows one open invoice per order", async () => {
    const { context, order } = await invoiceable();
    const invoice = unwrap({ result: await create({ context, orderId: order.id }) });
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
    expect(errorCode({ result: await create({ context, orderId: order.id }) })).toBe("CONFLICT");
    unwrap({
      result: await execute({ operation: voidInvoice, input: { id: invoice.id }, context }),
    });
    const next = unwrap({ result: await create({ context, orderId: order.id }) });
    expect(next).toMatchObject({ number: 2, totalInclVatMinor: 140_000 });
  });

  it("is billed once sent, settled by payments and not voided while paid", async () => {
    const { context, order } = await invoiceable();
    const invoice = unwrap({ result: await create({ context, orderId: order.id }) });
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
    const input = { orderId: order.id };
    const balance = unwrap({
      result: await execute({ operation: getOrderBalance, input, context }),
    });
    expect(balance).toMatchObject({ billedFrom: "INVOICE", billedMinor: 560_000, balanceMinor: 0 });
    const blocked = await execute({ operation: voidInvoice, input: { id: invoice.id }, context });
    expect(errorCode({ result: blocked })).toBe("CONFLICT");
  });

  it("keeps its send date when it is voided later (ADR 0077)", async () => {
    const { context, order } = await invoiceable();
    const invoice = unwrap({ result: await create({ context, orderId: order.id }) });
    const input = { id: invoice.id };
    unwrap({ result: await execute({ operation: sendInvoice, input, context }) });
    const sent = await context.db.invoice.findUniqueOrThrow({ where: input });
    unwrap({ result: await execute({ operation: voidInvoice, input, context }) });
    const voided = await context.db.invoice.findUniqueOrThrow({ where: input });
    expect(sent.sentAt).toBeInstanceOf(Date);
    expect(voided.sentAt).toEqual(sent.sentAt);
    expect(voided.voidedAt).toEqual(voided.statusChangedAt);
  });

  it("needs program:read to copy the lines and stays in its organization", async () => {
    const { context, order } = await invoiceable();
    const permissions = { ...grantAll({}), program: [] };
    const blind = testContext({ organizationId: context.organizationId, permissions });
    expect(errorCode({ result: await create({ context: blind, orderId: order.id }) })).toBe(
      "VALIDATION",
    );
    const invoice = unwrap({ result: await create({ context, orderId: order.id }) });
    const stranger = testContext();
    const get = await execute({
      operation: getInvoice,
      input: { id: invoice.id },
      context: stranger,
    });
    expect(errorCode({ result: get })).toBe("NOT_FOUND");
    const theirs = await create({ context: stranger, orderId: order.id });
    expect(errorCode({ result: theirs })).toBe("NOT_FOUND");
    const send = await execute({
      operation: sendInvoice,
      input: { id: invoice.id },
      context: stranger,
    });
    expect(errorCode({ result: send })).toBe("NOT_FOUND");
  });
});
