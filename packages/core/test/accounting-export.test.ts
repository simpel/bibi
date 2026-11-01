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

const DAY = 86_400_000;
const isoDay = ({ offset }: { offset: number }) =>
  new Date(Date.now() + offset * DAY).toISOString().slice(0, 10);
/** Yesterday to tomorrow, so what a test creates now is inside it. */
const AROUND_NOW = { from: isoDay({ offset: -1 }), to: isoDay({ offset: 1 }) };
const LONG_AGO = { from: "2020-01-01", to: "2020-12-31" };

type RangeCtx = Ctx & { range?: { from: string; to: string } };

const run = async ({ context, range = AROUND_NOW }: RangeCtx) =>
  execute({ operation: createAccountingExport, input: range, context });

const preview = async ({ context, range = AROUND_NOW }: RangeCtx) =>
  unwrap({ result: await execute({ operation: previewAccountingExport, input: range, context }) });

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

describe("accounting exports are SIE 4I files of a date range (ADR 0077)", () => {
  it("previews, writes the vouchers and keeps the exact file", async () => {
    const { context, invoice } = await sentInvoice();
    const pay = { invoiceId: invoice.id, method: "CARD" as const };
    const payment = unwrap({
      result: await execute({ operation: createPayment, input: pay, context }),
    });
    await markSucceeded({ context, paymentId: payment.id });
    expect(await preview({ context })).toMatchObject({
      voucherCount: 2,
      earlierExports: 0,
      blockers: [],
    });
    const made = unwrap({ result: await run({ context }) });
    expect(made).toMatchObject({ number: 1, voucherCount: 2, fileName: "bibi-sie-0001.si" });
    expect(made.periodStart).toBeInstanceOf(Date);
    expect(made.periodEnd).toBeInstanceOf(Date);
    const text = await download({ context, id: made.id });
    expect(text).toContain("#ORGNR 556000-0000");
    expect(text).toContain('#FNAMN "Gården AB"');
    expect(text).toContain("#TRANS 1510 {6");
    expect(text).toContain("#TRANS 2621 {6");
    expect(await download({ context, id: made.id })).toBe(text);
    const list = unwrap({
      result: await execute({ operation: listAccountingExports, input: { limit: 10 }, context }),
    });
    expect(list.items.map((row) => row.number)).toEqual([1]);
  });

  it("exports the same range again and warns about the overlap", async () => {
    const { context } = await sentInvoice();
    const first = unwrap({ result: await run({ context }) });
    expect(await preview({ context })).toMatchObject({ voucherCount: 1, earlierExports: 1 });
    const second = unwrap({ result: await run({ context }) });
    expect(second).toMatchObject({ number: 2, voucherCount: 1 });
    expect(await download({ context, id: second.id })).toContain("#TRANS 1510 {6");
    expect(await download({ context, id: first.id })).toContain("#TRANS 1510 {6");
  });

  it("holds only what is dated in the range", async () => {
    const { context } = await sentInvoice();
    expect(await preview({ context, range: LONG_AGO })).toMatchObject({
      voucherCount: 0,
      earlierExports: 0,
    });
    expect(errorCode({ result: await run({ context, range: LONG_AGO }) })).toBe("CONFLICT");
    const backwards = { from: AROUND_NOW.to, to: AROUND_NOW.from };
    expect(errorCode({ result: await run({ context, range: backwards }) })).toBe("VALIDATION");
  });

  it("reverses a voided invoice in the range it was voided in", async () => {
    const { context, invoice } = await sentInvoice();
    unwrap({ result: await run({ context }) });
    unwrap({
      result: await execute({ operation: voidInvoice, input: { id: invoice.id }, context }),
    });
    const both = unwrap({ result: await run({ context }) });
    expect(both.voucherCount).toBe(2);
    const text = await download({ context, id: both.id });
    expect(text).toContain("Void invoice 1");
    expect(text).toMatch(/#TRANS 1510 \{6 "\d+"\} -5600\.00/);
  });

  it("is blocked without an organization number", async () => {
    const { context } = await moneySetup();
    expect((await preview({ context })).blockers.map((b) => b.code)).toEqual([
      "ORG_NUMBER_MISSING",
      "NOTHING_TO_EXPORT",
    ]);
  });
});
