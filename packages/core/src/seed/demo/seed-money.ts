import { ok, type Result } from "../../errors/result";
import { createDeposit, sendDeposit } from "../../features/deposit/write-operations";
import { applyPaymentSignal } from "../../features/payment/apply-signal-operation";
import { createPayment } from "../../features/payment/create-operation";
import {
  startPaymentOnboarding,
  syncPaymentAccount,
} from "../../features/payment-account/write-operations";
import type { ExecuteContext } from "../../operations/context";
import { execute } from "../../operations/execute";
import { missing } from "./seed-fields";
import type { DemoTicket } from "./ticket-types";
import type { DemoOrg } from "./types";

type Ctx = { context: ExecuteContext };

/** An ACTIVE payout account (the demo gateway, `withDemoPayments`) when a ticket has money. */
export async function activateDemoPayments({ context, org }: Ctx & { org: DemoOrg }) {
  if (!org.tickets.some((ticket) => ticket.money)) return ok({ value: true as const });
  const started = await execute({ operation: startPaymentOnboarding, input: {}, context });
  if (!started.ok) return started;
  const synced = await execute({ operation: syncPaymentAccount, input: {}, context });
  return synced.ok ? ok({ value: true as const }) : synced;
}

type TicketMoneyInput = Ctx & { ticket: DemoTicket; ticketId: string };

/** `money.deposit`: a deposit request on the ticket, sent to the customer (ADR 0057). */
async function seedDeposit({ context, ticket, ticketId }: TicketMoneyInput): Promise<Result<true>> {
  const deposit = ticket.money?.deposit;
  if (!deposit) return ok({ value: true });
  const input = { ticketId, description: deposit.description, amountMinor: deposit.amountKr * 100 };
  const draft = await execute({ operation: createDeposit, input, context });
  if (!draft.ok) return draft;
  const sent = await execute({ operation: sendDeposit, input: { id: draft.value.id }, context });
  return sent.ok ? ok({ value: true }) : sent;
}

/**
 * `money.paidKr`: a card payment against the accepted quote, then Stripe's paid signal as the
 * webhook would apply it, so it is SUCCEEDED (memory provider, no Stripe call).
 */
async function seedPartialPayment({ context, ticket, ticketId }: TicketMoneyInput) {
  const paidKr = ticket.money?.paidKr;
  if (!paidKr) return ok({ value: true as const });
  const quote = await context.db.quote.findFirst({ where: { ticketId, quoteStatus: "ACCEPTED" } });
  if (!quote) return missing({ what: `accepted quote of ticket ${ticket.ref}` });
  const input = { quoteId: quote.id, method: "CARD" as const, amountMinor: paidKr * 100 };
  const payment = await execute({ operation: createPayment, input, context });
  if (!payment.ok) return payment;
  const row = await context.db.payment.findFirst({ where: { id: payment.value.id } });
  if (!row) return missing({ what: `payment of ticket ${ticket.ref}` });
  const signal = {
    kind: "paid" as const,
    providerAccountId: row.providerAccountId,
    paymentId: row.id,
  };
  const paid = await execute({ operation: applyPaymentSignal, input: signal, context });
  return paid.ok ? ok({ value: true as const }) : paid;
}

/** The ticket's demo money (`ticket.money`): a deposit request and a partial payment. */
export async function seedTicketMoney({
  context,
  ticket,
  ticketId,
}: TicketMoneyInput): Promise<Result<true>> {
  const deposit = await seedDeposit({ context, ticket, ticketId });
  if (!deposit.ok) return deposit;
  return seedPartialPayment({ context, ticket, ticketId });
}
