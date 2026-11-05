import { getDb } from "@bibi/db";
import { afterEach, describe, expect, it } from "vitest";
import { getPublicPaymentOperation } from "../src/features/payment/public-operation";
import {
  createInvoice,
  createMemoryPaymentProvider,
  createPayment,
  type ExecuteContext,
  execute,
  getPublicPayment,
  sendInvoice,
  setPaymentProvider,
  setStripeConnectGateway,
} from "../src/index";
import { testContext, unwrap } from "./helpers";
import { addLine, addOnSetup } from "./line-add-on-helpers";
import { activatePaymentAccount, paymentSetup } from "./payment-helpers";
import { makeInvoiceable, moneySetup, sentTestQuote } from "./receivable-helpers";

afterEach(() => {
  setPaymentProvider({ provider: undefined });
  setStripeConnectGateway({ gateway: undefined });
});

type PayInput = { context: ExecuteContext } & (
  | { quoteId: string }
  | { invoiceId: string }
  | { depositId: string }
);

/** A CARD payment against the receivable and its public token. */
async function tokenFor({ context, ...receivable }: PayInput) {
  const input = { ...receivable, method: "CARD" as const };
  const payment = unwrap({ result: await execute({ operation: createPayment, input, context }) });
  const row = await getDb().payment.findUniqueOrThrow({ where: { id: payment.id } });
  return row.publicToken;
}

/** A sent quote: lunch with a coffee add-on and a snack sub-line frozen as an OPTION. */
async function quoteWithSubLines() {
  const { context, order, parent, coffee } = await addOnSetup();
  const base = { context, orderId: order.id, parentLineId: parent.id, itemId: coffee.id };
  unwrap({ result: await addLine({ ...base, name: "Coffee" }) });
  const option = unwrap({ result: await addLine({ ...base, name: "Snack" }) });
  await activatePaymentAccount({ context });
  setPaymentProvider({ provider: createMemoryPaymentProvider() });
  const quote = await sentTestQuote({ context, orderId: order.id });
  await getDb().orderLine.updateMany({
    where: { quoteId: quote.id, lineId: option.id },
    data: { role: "OPTION" },
  });
  return { context, quote };
}

describe("the public payment page lists what is paid for", () => {
  it("shows the quote's frozen lines with sub-lines nested and its totals", async () => {
    const { context, quote } = await quoteWithSubLines();
    const token = await tokenFor({ context, quoteId: quote.id });
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
    const { context, quote } = await quoteWithSubLines();
    const token = await tokenFor({ context, quoteId: quote.id });
    const other = testContext();
    const result = await execute({
      operation: getPublicPaymentOperation,
      input: { token },
      context: other,
    });
    expect(result).toMatchObject({ ok: false, error: { code: "NOT_FOUND" } });
  });
});
