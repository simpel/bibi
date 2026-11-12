import { afterEach, describe, expect, it } from "vitest";
import {
  createInvoice,
  creditInvoice,
  type ExecuteContext,
  execute,
  getOrderBalance,
  listPayments,
  resetProviderAdapters,
  retryCredits,
  sendInvoice,
  voidInvoice,
} from "../src/index";
import { errorCode, unwrap } from "./helpers";
import { sendSignal } from "./lifecycle-helpers";
import { makeInvoiceable, moneySetup } from "./receivable-helpers";

afterEach(() => {
  resetProviderAdapters();
});

/** A SENT invoice of 5 600 kr raised and booked in the memory accounting system (ADR 0106). */
async function raisedInvoice() {
  const setup = await moneySetup();
  const { context, order, ledger } = setup;
  if (!ledger) throw new Error("no ledger");
  await makeInvoiceable({ context, statusId: order.statusId });
  const draft = unwrap({
    result: await execute({ operation: createInvoice, input: { orderId: order.id }, context }),
  });
  const sent = unwrap({
    result: await execute({ operation: sendInvoice, input: { id: draft.id }, context }),
  });
  return { ...setup, fake: ledger, invoice: sent };
}

const credit = ({
  context,
  ...input
}: {
  context: ExecuteContext;
  invoiceId: string;
  amountMinor?: number;
  lineIds?: string[];
}) => execute({ operation: creditInvoice, input, context });

describe("invoices raised in the accounting system (ADR 0100, 0106)", () => {
  it("credits concurrently, each credit numbered by the accounting system, never failing INTERNAL", async () => {
    const { context, invoice } = await raisedInvoice();
    const results = await Promise.all(
      [1, 2, 3].map(() => credit({ context, invoiceId: invoice.id, amountMinor: 100_000 })),
    );
    expect(results.map((result) => (result.ok ? "ok" : result.error.code))).toEqual([
      "ok",
      "ok",
      "ok",
    ]);
    const notes = await context.db.creditNote.findMany({ where: { invoiceId: invoice.id } });
    expect(new Set(notes.map((note) => note.providerReference)).size).toBe(3);
  });

  it("issues the invoice and records its payment from the provider's signal once", async () => {
    const { context, fake, invoice, order } = await raisedInvoice();
    expect(invoice).toMatchObject({ provider: "VISMA", providerReference: "1" });
    expect(invoice.providerUrl).toBe("https://invoice.provider.test/1");
    expect(fake.raised).toHaveLength(1);
    const signal = {
      kind: "invoice.payment_recorded" as const,
      reference: "1",
      documentReference: "1",
      amountMinor: invoice.amountDueMinor,
    };
    expect(await sendSignal({ context, provider: "VISMA", signal })).toBe("applied");
    await sendSignal({ context, provider: "VISMA", signal });
    const page = unwrap({
      result: await execute({ operation: listPayments, input: { orderId: order.id }, context }),
    });
    expect(page.items).toHaveLength(1);
    expect(page.items[0]).toMatchObject({
      method: "INVOICE",
      status: "SUCCEEDED",
      amountMinor: 560_000,
    });

    const refused = await execute({ operation: voidInvoice, input: { id: invoice.id }, context });
    expect(errorCode({ result: refused })).toBe("CONFLICT");
    expect(refused.ok ? "" : refused.error.message).toContain("invoice.credit");
  });

  it("credits part of the invoice there and lowers what the order owes", async () => {
    const { context, fake, invoice, order } = await raisedInvoice();
    const balance = () =>
      execute({ operation: getOrderBalance, input: { orderId: order.id }, context });
    expect(unwrap({ result: await balance() }).balanceMinor).toBe(560_000);
    const credited = unwrap({
      result: await credit({ context, invoiceId: invoice.id, amountMinor: 112_000 }),
    });
    expect(credited).toMatchObject({ creditedMinor: 112_000, amountDueMinor: 448_000 });
    expect(credited.creditNotes).toEqual([
      expect.objectContaining({
        documentNumber: expect.stringMatching(/^credit-1-/),
        amountMinor: 112_000,
        status: "ISSUED",
      }),
    ]);
    expect(fake.portCalls).toEqual(["credit:1:112000"]);
    expect(unwrap({ result: await balance() }).balanceMinor).toBe(448_000);
    const over = await credit({ context, invoiceId: invoice.id, amountMinor: 448_001 });
    expect(errorCode({ result: over })).toBe("CONFLICT");
    const rest = unwrap({ result: await credit({ context, invoiceId: invoice.id }) });
    expect(rest).toMatchObject({ creditedMinor: 560_000, amountDueMinor: 0 });
    expect(unwrap({ result: await balance() }).balanceMinor).toBe(0);
  });

  it("marks a credit the provider refused FAILED: it credits nothing", async () => {
    const { context, fake, invoice } = await raisedInvoice();
    fake.refusing.add("credit");
    const refused = await credit({ context, invoiceId: invoice.id, amountMinor: 1_000 });
    expect(errorCode({ result: refused })).toBe("CONFLICT");
    const note = await context.db.creditNote.findFirstOrThrow({ where: { invoiceId: invoice.id } });
    expect(note.status).toBe("FAILED");
  });

  it("keeps an unanswered credit PENDING and the retry reads it there before sending it again", async () => {
    const { context, fake, invoice } = await raisedInvoice();
    fake.failing.add("credit");
    const lost = await credit({ context, invoiceId: invoice.id, amountMinor: 1_000 });
    expect(errorCode({ result: lost })).toBe("UNAVAILABLE");
    const pending = await context.db.creditNote.findFirstOrThrow({
      where: { invoiceId: invoice.id },
    });
    expect(pending.status).toBe("PENDING");
    // Too early: nothing is read yet.
    expect(unwrap({ result: await retryCredits({ context }) })).toEqual({
      issued: 0,
      failed: 0,
      waiting: 0,
    });
    const later = { ...context, now: () => new Date(Date.now() + 20 * 60_000) };
    // The provider never got it: it is sent again, once.
    expect(unwrap({ result: await retryCredits({ context: later }) })).toMatchObject({
      issued: 1,
    });
    const note = await context.db.creditNote.findFirstOrThrow({ where: { id: pending.id } });
    expect(note).toMatchObject({ status: "ISSUED" });
    expect(fake.portCalls).toEqual([`credit:1:1000`]);
    expect(unwrap({ result: await retryCredits({ context: later }) })).toMatchObject({
      issued: 0,
    });
  });

  it("settles a credit the provider made though its answer was lost, without crediting twice", async () => {
    const { context, fake, invoice } = await raisedInvoice();
    fake.failing.add("credit");
    await credit({ context, invoiceId: invoice.id, amountMinor: 1_000 });
    fake.credited.set("1", "credit-made-there");
    const later = { ...context, now: () => new Date(Date.now() + 20 * 60_000) };
    unwrap({ result: await retryCredits({ context: later }) });
    const note = await context.db.creditNote.findFirstOrThrow({ where: { invoiceId: invoice.id } });
    expect(note).toMatchObject({ status: "ISSUED", providerReference: "credit-made-there" });
    expect(fake.portCalls).toEqual([]);
  });
});
