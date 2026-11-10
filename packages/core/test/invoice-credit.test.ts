import { afterEach, describe, expect, it } from "vitest";
import {
  createAccountingExport,
  createInvoice,
  createMemoryProvider,
  creditInvoice,
  type ExecuteContext,
  execute,
  getOrderBalance,
  listPayments,
  type MemoryProvider,
  resetProviderAdapters,
  sendInvoice,
  setProviderAdapter,
  voidInvoice,
} from "../src/index";
import { AROUND_NOW, download, preview, sentInvoice } from "./accounting-export-helpers";
import { errorCode, unwrap } from "./helpers";
import { sendSignal } from "./lifecycle-helpers";
import { makeInvoiceable, moneySetup } from "./receivable-helpers";

afterEach(() => {
  resetProviderAdapters();
});

/** The payment operator replaced by one that also raises invoices (Stripe Invoicing's shape). */
function invoicingOperator(): MemoryProvider {
  const fake = createMemoryProvider({
    key: "STRIPE",
    connectKind: "HOSTED_ONBOARDING",
    methods: ["CARD"],
    invoicing: true,
  });
  setProviderAdapter({ key: "STRIPE", adapter: fake.adapter });
  return fake;
}

/** A SENT invoice of 5 600 kr raised at the operator's invoicing. */
async function raisedInvoice() {
  const setup = await moneySetup();
  const { context, order } = setup;
  const fake = invoicingOperator();
  await makeInvoiceable({ context, statusId: order.statusId });
  const draft = unwrap({
    result: await execute({ operation: createInvoice, input: { orderId: order.id }, context }),
  });
  const sent = unwrap({
    result: await execute({ operation: sendInvoice, input: { id: draft.id }, context }),
  });
  return { ...setup, fake, invoice: sent };
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

describe("invoices raised at a payment operator (ADR 0100)", () => {
  it("numbers concurrent credit notes one after the other, never failing INTERNAL", async () => {
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
    expect(notes.map((note) => note.number).sort()).toEqual([1, 2, 3]);
  });

  it("issues the invoice and records its payment from the provider's signal once", async () => {
    const { context, fake, invoice, order } = await raisedInvoice();
    expect(invoice).toMatchObject({ provider: "STRIPE", providerReference: "1" });
    expect(invoice.providerUrl).toBe("https://invoice.provider.test/1");
    expect(fake.raised).toHaveLength(1);
    const signal = {
      kind: "invoice.payment_recorded" as const,
      reference: "1",
      documentReference: "1",
      amountMinor: invoice.amountDueMinor,
    };
    expect(await sendSignal({ context, provider: "STRIPE", signal })).toBe("applied");
    await sendSignal({ context, provider: "STRIPE", signal });
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

  it("voids an unpaid invoice at the provider too", async () => {
    const { context, fake, invoice } = await raisedInvoice();
    const voided = unwrap({
      result: await execute({ operation: voidInvoice, input: { id: invoice.id }, context }),
    });
    expect(voided.status).toBe("VOID");
    expect(fake.portCalls).toEqual(["void:1"]);
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
      expect.objectContaining({ number: 1, amountMinor: 112_000, status: "ISSUED" }),
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
    fake.failing.add("credit");
    const refused = await credit({ context, invoiceId: invoice.id, amountMinor: 1_000 });
    expect(errorCode({ result: refused })).toBe("UNAVAILABLE");
    const note = await context.db.creditNote.findFirstOrThrow({ where: { invoiceId: invoice.id } });
    expect(note.status).toBe("FAILED");
  });
});

describe("credit notes in Bibi (ADR 0100)", () => {
  it("freezes the credited lines and exports a reversal voucher", async () => {
    const { context, invoice } = await sentInvoice();
    const lineIds = invoice.lines.map((line) => line.id);
    const credited = unwrap({ result: await credit({ context, invoiceId: invoice.id, lineIds }) });
    expect(credited).toMatchObject({ creditedMinor: 560_000, amountDueMinor: 0 });
    const note = await context.db.creditNote.findFirstOrThrow({
      where: { invoiceId: invoice.id },
      include: { lines: true },
    });
    expect(note).toMatchObject({ status: "ISSUED", provider: null, totalExclVatMinor: 500_000 });
    expect(note.lines).toHaveLength(invoice.lines.length);
    const both = await credit({ context, invoiceId: invoice.id, lineIds, amountMinor: 1 });
    expect(errorCode({ result: both })).toBe("VALIDATION");

    const counts = (await preview({ context })).counts;
    expect(counts).toEqual(
      expect.arrayContaining([
        { kind: "INVOICE_SENT", count: 1 },
        { kind: "CREDIT_NOTE", count: 1 },
      ]),
    );
    const made = await execute({ operation: createAccountingExport, input: AROUND_NOW, context });
    const file = await download({ context, id: unwrap({ result: made }).id });
    expect(file).toContain("Credit note 1, invoice");
  });
});
