import {
  acceptQuote,
  createMemoryPaymentProvider,
  type ExecuteContext,
  execute,
  sendQuote,
  setPaymentProvider,
  updateTicketPhase,
} from "../src/index";
import { unwrap } from "./helpers";
import { activatePaymentAccount } from "./payment-helpers";
import { addTestLines, createTestQuote, quoteSetup } from "./quote-helpers";

/**
 * A quote setup (20 lunches at 250 kr + 12 % VAT = 5 600 kr) whose payment account is active,
 * with an in-memory payment provider.
 */
export async function moneySetup() {
  const setup = await quoteSetup();
  const { context, ticket, lineType, lunch } = setup;
  const lines = [{ itemId: lunch.id }];
  await addTestLines({ context, ticketId: ticket.id, lineTypeId: lineType.id, lines });
  await activatePaymentAccount({ context });
  const provider = createMemoryPaymentProvider();
  setPaymentProvider({ provider });
  return { ...setup, provider };
}

export type QuoteFlowInput = { context: ExecuteContext; ticketId: string; accept?: boolean };

/** A SENT quote of the ticket's lines, accepted when asked. */
export async function sentTestQuote({ context, ticketId, accept = false }: QuoteFlowInput) {
  const draft = await createTestQuote({ context, ticketId });
  const input = { id: draft.id };
  const sent = unwrap({ result: await execute({ operation: sendQuote, input, context }) });
  if (!accept) return sent;
  return unwrap({ result: await execute({ operation: acceptQuote, input, context }) });
}

export type InvoiceableInput = { context: ExecuteContext; phaseId: string };

/** Flags the ticket's current phase `invoiceable`. */
export async function makeInvoiceable({ context, phaseId }: InvoiceableInput) {
  const input = { id: phaseId, invoiceable: true };
  unwrap({ result: await execute({ operation: updateTicketPhase, input, context }) });
}

export type SettleInput = { context: ExecuteContext; paymentId: string; refundedMinor?: number };

/** Stands in for Stripe's paid webhook (`payment.applySignal`): the payment SUCCEEDED. */
export async function markSucceeded({ context, paymentId, refundedMinor = 0 }: SettleInput) {
  await context.db.payment.update({
    where: { id: paymentId },
    data: { status: "SUCCEEDED", paidAt: new Date(), refundedMinor },
  });
}
