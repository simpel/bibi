import { decodeCp437 } from "../src/accounting/sie4/cp437";
import {
  createAccountingExport,
  createInvoice,
  downloadAccountingExport,
  type ExecuteContext,
  execute,
  previewAccountingExport,
  requestDeposit,
  sendInvoice,
  updateOrganizationProfile,
} from "../src/index";
import { unwrap } from "./helpers";
import { makeInvoiceable, markSucceeded, moneySetup } from "./receivable-helpers";

type Ctx = { context: ExecuteContext };

const DAY = 86_400_000;
const isoDay = ({ offset }: { offset: number }) =>
  new Date(Date.now() + offset * DAY).toISOString().slice(0, 10);
/** Yesterday to tomorrow, so what a test creates now is inside it. */
export const AROUND_NOW = { from: isoDay({ offset: -1 }), to: isoDay({ offset: 1 }) };
export const LONG_AGO = { from: "2020-01-01", to: "2020-12-31" };

type RangeCtx = Ctx & { range?: { from: string; to: string } };

export const run = async ({ context, range = AROUND_NOW }: RangeCtx) =>
  execute({ operation: createAccountingExport, input: range, context });

export const preview = async ({ context, range = AROUND_NOW }: RangeCtx) =>
  unwrap({ result: await execute({ operation: previewAccountingExport, input: range, context }) });

export async function download({ context, id }: Ctx & { id: string }) {
  const file = unwrap({
    result: await execute({ operation: downloadAccountingExport, input: { id }, context }),
  });
  return decodeCp437({ bytes: new Uint8Array(Buffer.from(file.contentBase64, "base64")) });
}

/**
 * A sent invoice of 5 600 kr (12 % VAT) on an order of an organization with an org number,
 * optionally after a deposit of that amount was paid (and deducted).
 */
export async function sentInvoice({ deposit }: { deposit?: number } = {}) {
  const setup = await moneySetup();
  const { context, order } = setup;
  const profile = { legalName: "Gården AB", orgNumber: "556000-0000" };
  unwrap({
    result: await execute({ operation: updateOrganizationProfile, input: profile, context }),
  });
  if (deposit) {
    const input = { orderId: order.id, description: "Advance", amountMinor: deposit };
    const paid = unwrap({ result: await execute({ operation: requestDeposit, input, context }) });
    await markSucceeded({ context, paymentId: paid.id });
  }
  await makeInvoiceable({ context, statusId: order.statusId });
  const draft = unwrap({
    result: await execute({ operation: createInvoice, input: { orderId: order.id }, context }),
  });
  unwrap({ result: await execute({ operation: sendInvoice, input: { id: draft.id }, context }) });
  return { ...setup, invoice: draft };
}
