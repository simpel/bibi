import { getDb } from "@bibi/db";
import { afterEach, describe, expect, it } from "vitest";
import { getPublicPaymentOperation } from "../src/features/payment/public-operation";
import {
  createInvoice,
  createPayment,
  type ExecuteContext,
  execute,
  getPublicPayment,
  resetProviderAdapters,
  sendInvoice,
} from "../src/index";
import { testContext, unwrap } from "./helpers";
import { addLine, addOnSetup } from "./line-add-on-helpers";
import { activatePaymentAccount, paymentSetup, sentDeposit } from "./payment-helpers";
import { makeInvoiceable, moneySetup, sentTestQuote } from "./receivable-helpers";

afterEach(() => {
  resetProviderAdapters();
});

type PayInput = { context: ExecuteContext } & ({ invoiceId: string } | { depositId: string });

/** A CARD payment against the receivable and its public token. */
async function tokenFor({ context, ...receivable }: PayInput) {
  const input = { ...receivable, method: "CARD" as const };
  const payment = unwrap({ result: await execute({ operation: createPayment, input, context }) });
  const row = await getDb().payment.findUniqueOrThrow({ where: { id: payment.id } });
  return row.publicToken;
}

type LegacyInput = { context: ExecuteContext; orderId: string; quoteId: string };

/**
 * The token of a payment made against a quote before ADR 0106 (quotes are no longer paid
 * directly): a deposit payment moved onto the quote, as such old rows look.
 */
async function legacyQuoteToken({ context, orderId, quoteId }: LegacyInput) {
  const deposit = await sentDeposit({ context, orderId, amountMinor: 10_000 });
  const token = await tokenFor({ context, depositId: deposit.id });
  await getDb().payment.updateMany({
    where: { publicToken: token },
    data: { quoteId, depositId: null },
  });
  return token;
}

/** A sent quote: lunch with a coffee add-on and a snack sub-line frozen as an OPTION. */
async function quoteWithSubLines() {
  const { context, order, parent, coffee } = await addOnSetup();
  const base = { context, orderId: order.id, parentLineId: parent.id, itemId: coffee.id };
  unwrap({ result: await addLine({ ...base, name: "Coffee" }) });
  const option = unwrap({ result: await addLine({ ...base, name: "Snack" }) });
  await activatePaymentAccount({ context });
  const quote = await sentTestQuote({ context, orderId: order.id });
  await getDb().orderLine.updateMany({
    where: { quoteId: quote.id, lineId: option.id },
    data: { role: "OPTION" },
  });
  return { context, quote, orderId: order.id };
}

describe("the public payment page lists what is paid for", () => {
  it("shows an old quote payment's frozen lines with sub-lines nested and its totals", async () => {
    const { context, quote, orderId } = await quoteWithSubLines();
    const token = await legacyQuoteToken({ context, orderId, quoteId: quote.id });
    const view = unwrap({ result: await getPublicPayment({ token }) });
    expect(view.lines.map(({ name, role, subLine }) => [name, role, subLine])).toEqual([
      ["Lunch", null, false],
      ["Coffee", "ADD_ON", true],
      ["Snack", "OPTION", true],
    ]);
    expect(Object.keys(view.lines[0] ?? {}).sort()).toEqual([
      ...["discountPercent", "inTotal", "name", "quantity", "role", "subLine"],
      ...["totalExclVatMinor", "unitPriceMinor", "vatRatePercent"],
    ]);
    expect(view.totals).toEqual({
      totalExclVatMinor: quote.totalExclVatMinor,
      vatMinor: quote.totalInclVatMinor - quote.totalExclVatMinor,
      totalInclVatMinor: quote.totalInclVatMinor,
      totalIsFrom: false,
      deductions: [],
      amountDueMinor: quote.totalInclVatMinor,
    });
  });

  it("shows the invoice's frozen lines", async () => {
    const { context, order } = await moneySetup();
    await makeInvoiceable({ context, statusId: order.statusId });
    const input = { orderId: order.id };
    const draft = unwrap({ result: await execute({ operation: createInvoice, input, context }) });
    const sent = { id: draft.id };
    unwrap({ result: await execute({ operation: sendInvoice, input: sent, context }) });
    const token = await tokenFor({ context, invoiceId: draft.id });
    const view = unwrap({ result: await getPublicPayment({ token }) });
    expect(view.lines).toHaveLength(1);
    expect(view.lines[0]).toMatchObject({ name: "Lunch", role: null, subLine: false });
    expect(view.totals?.totalInclVatMinor).toBe(draft.totalInclVatMinor);
  });

  it("lists no lines for a deposit", async () => {
    const { context, depositId } = await paymentSetup();
    const token = await tokenFor({ context, depositId });
    const view = unwrap({ result: await getPublicPayment({ token }) });
    expect(view).toMatchObject({ lines: [], totals: null });
  });

  it("does not read a token of another organization", async () => {
    const { context, quote, orderId } = await quoteWithSubLines();
    const token = await legacyQuoteToken({ context, orderId, quoteId: quote.id });
    const other = testContext();
    const result = await execute({
      operation: getPublicPaymentOperation,
      input: { token },
      context: other,
    });
    expect(result).toMatchObject({ ok: false, error: { code: "NOT_FOUND" } });
  });
});
