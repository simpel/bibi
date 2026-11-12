import {
  acceptQuote,
  type ExecuteContext,
  execute,
  sendQuote,
  updateOrderStatus,
} from "../src/index";
import { unwrap } from "./helpers";
import { activatePaymentAccount } from "./payment-helpers";
import { addTestLines, createTestQuote, quoteSetup } from "./quote-helpers";

/**
 * A quote setup (20 lunches at 250 kr + 12 % VAT = 5 600 kr) whose payment account is active,
 * with an in-memory payment provider and, unless `ledger` is false, a memory accounting system.
 */
export async function moneySetup({ ledger = true }: { ledger?: boolean } = {}) {
  const setup = await quoteSetup();
  const { context, order, lineType, lunch } = setup;
  const lines = [{ itemId: lunch.id }];
  await addTestLines({ context, orderId: order.id, lineTypeId: lineType.id, lines });
  const account = await activatePaymentAccount({ context, ledger });
  return { ...setup, provider: account.provider, ledger: account.ledger };
}

export type QuoteFlowInput = { context: ExecuteContext; orderId: string; accept?: boolean };

/** A SENT quote of the order's lines, accepted when asked. */
export async function sentTestQuote({ context, orderId, accept = false }: QuoteFlowInput) {
  const draft = await createTestQuote({ context, orderId });
  const input = { id: draft.id };
  const sent = unwrap({ result: await execute({ operation: sendQuote, input, context }) });
  if (!accept) return sent;
  return unwrap({ result: await execute({ operation: acceptQuote, input, context }) });
}

export type InvoiceableInput = { context: ExecuteContext; statusId: string };

/** Flags the order's current status `invoiceable`. */
export async function makeInvoiceable({ context, statusId }: InvoiceableInput) {
  const input = { id: statusId, invoiceable: true };
  unwrap({ result: await execute({ operation: updateOrderStatus, input, context }) });
}

export type SettleInput = { context: ExecuteContext; paymentId: string; refundedMinor?: number };

/**
 * Stands in for the provider's paid signal (`payment.applySignal`): the payment SUCCEEDED, with a
 * SUCCEEDED refund of `refundedMinor` when given.
 */
export async function markSucceeded({ context, paymentId, refundedMinor = 0 }: SettleInput) {
  await context.db.payment.update({
    where: { id: paymentId },
    data: { status: "SUCCEEDED", paidAt: new Date() },
  });
  if (refundedMinor === 0) return;
  await context.db.paymentRefund.create({
    data: {
      organizationId: context.organizationId,
      paymentId,
      amountMinor: refundedMinor,
      status: "SUCCEEDED",
      refundedAt: new Date(),
    },
  });
}
