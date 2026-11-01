import { afterEach, describe, expect, it } from "vitest";
import { decodeCp437 } from "../src/accounting/sie4/cp437";
import {
  createAccountingExport,
  createInvoice,
  createPayment,
  downloadAccountingExport,
  type ExecuteContext,
  execute,
  listAccountingExports,
  previewAccountingExport,
  sendInvoice,
  setPaymentProvider,
  setStripeConnectGateway,
  updateOrganizationProfile,
  voidInvoice,
} from "../src/index";
import { errorCode, unwrap } from "./helpers";
import { makeInvoiceable, markSucceeded, moneySetup } from "./receivable-helpers";

afterEach(() => {
  setPaymentProvider({ provider: undefined });
  setStripeConnectGateway({ gateway: undefined });
});

type Ctx = { context: ExecuteContext };

const run = async ({ context }: Ctx) =>
  execute({ operation: createAccountingExport, input: {}, context });

async function download({ context, id }: Ctx & { id: string }) {
  const file = unwrap({
    result: await execute({ operation: downloadAccountingExport, input: { id }, context }),
  });
  return decodeCp437({ bytes: new Uint8Array(Buffer.from(file.contentBase64, "base64")) });
}

/** A sent invoice of 5 600 kr (12 % VAT) on a ticket of an organization with an org number. */
async function sentInvoice() {
  const setup = await moneySetup();
  const { context, ticket } = setup;
  const profile = { legalName: "Gården AB", orgNumber: "556000-0000" };
  unwrap({
    result: await execute({ operation: updateOrganizationProfile, input: profile, context }),
  });
  await makeInvoiceable({ context, statusId: ticket.statusId });
  const draft = unwrap({
    result: await execute({ operation: createInvoice, input: { ticketId: ticket.id }, context }),
  });
  unwrap({ result: await execute({ operation: sendInvoice, input: { id: draft.id }, context }) });
  return { ...setup, invoice: draft };
}

describe("accounting exports are incremental SIE 4I batches (ADR 0077)", () => {
  it("previews, writes the vouchers once and keeps the exact file", async () => {
    const { context, invoice } = await sentInvoice();
    const pay = { invoiceId: invoice.id, method: "CARD" as const };
    const payment = unwrap({
      result: await execute({ operation: createPayment, input: pay, context }),
    });
    await markSucceeded({ context, paymentId: payment.id });
    const preview = unwrap({
      result: await execute({ operation: previewAccountingExport, input: {}, context }),
    });
    expect(preview).toMatchObject({ voucherCount: 2, blockers: [] });
    const made = unwrap({ result: await run({ context }) });
    expect(made).toMatchObject({ number: 1, voucherCount: 2, fileName: "bibi-sie-0001.si" });
    const text = await download({ context, id: made.id });
    expect(text).toContain("#ORGNR 556000-0000");
    expect(text).toContain('#FNAMN "Gården AB"');
    expect(text).toContain("#TRANS 1510 {6");
    expect(text).toContain("#TRANS 2621 {6");
    expect(await download({ context, id: made.id })).toBe(text);
    expect(errorCode({ result: await run({ context }) })).toBe("CONFLICT");
    const list = unwrap({
      result: await execute({ operation: listAccountingExports, input: { limit: 10 }, context }),
    });
    expect(list.items.map((row) => row.number)).toEqual([1]);
  });

  it("reverses an exported invoice that is voided, and skips one voided before export", async () => {
    const { context, invoice } = await sentInvoice();
    unwrap({ result: await run({ context }) });
    unwrap({
      result: await execute({ operation: voidInvoice, input: { id: invoice.id }, context }),
    });
    const second = unwrap({ result: await run({ context }) });
    expect(second.voucherCount).toBe(1);
    const text = await download({ context, id: second.id });
    expect(text).toContain("Void invoice 1");
    expect(text).toContain("   #TRANS 1510 {6");
    expect(text).toMatch(/#TRANS 1510 \{6 "\d+"\} -5600\.00/);

    const other = await sentInvoice();
    const id = other.invoice.id;
    unwrap({
      result: await execute({ operation: voidInvoice, input: { id }, context: other.context }),
    });
    expect(errorCode({ result: await run({ context: other.context }) })).toBe("CONFLICT");
  });

  it("is blocked without an organization number", async () => {
    const { context } = await moneySetup();
    const preview = unwrap({
      result: await execute({ operation: previewAccountingExport, input: {}, context }),
    });
    expect(preview.blockers.map((b) => b.code)).toEqual([
      "ORG_NUMBER_MISSING",
      "NOTHING_TO_EXPORT",
    ]);
  });
});
