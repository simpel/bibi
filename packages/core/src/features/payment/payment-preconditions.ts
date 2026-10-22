import type { Customer } from "@bibi/db";
import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { conflict, notFound } from "../../shared/errors";
import type { PaymentMethod } from "./schema";

type Db = { context: Pick<OperationContext, "db"> };

export type ChargeTarget = {
  ticket: { id: string; reference: number };
  customer: Customer;
  connectedAccountId: string;
};

export type ChargeableTicketInput = Db & { ticketId: string };

/** A ticket can be charged unless it is in a `terminal` phase that is not `invoiceable`. */
export async function loadChargeableTicket({ context, ticketId }: ChargeableTicketInput) {
  const ticket = await context.db.ticket.findFirst({ where: { id: ticketId } });
  if (!ticket) return notFound({ entity: "Ticket" });
  const phase = await context.db.ticketPhase.findFirst({
    where: { id: ticket.phaseId, status: { in: ["ACTIVE", "ARCHIVED"] } },
    select: { terminal: true, invoiceable: true, name: true },
  });
  if (phase?.terminal && !phase.invoiceable) {
    return conflict({ message: `A ticket in "${phase.name}" cannot be charged` });
  }
  return ok({ value: ticket });
}

export type LoadTargetInput = Db & { ticketId: string; method: PaymentMethod };

/**
 * What a new payment needs: a chargeable ticket, its customer (with an email for invoices) and
 * the organization's connected account with card payments active.
 */
export async function loadChargeTarget({
  context,
  ticketId,
  method,
}: LoadTargetInput): Promise<Result<ChargeTarget>> {
  const ticket = await loadChargeableTicket({ context, ticketId });
  if (!ticket.ok) return ticket;
  const account = await context.db.paymentAccount.findFirst({});
  if (account?.status !== "ACTIVE" || !account.stripeAccountId) {
    return conflict({
      message: "The payment account is not active; finish Stripe onboarding in settings first",
    });
  }
  const customer = await context.db.customer.findFirst({
    where: { id: ticket.value.customerId, status: { in: ["ACTIVE", "ARCHIVED"] } },
  });
  if (!customer) return notFound({ entity: "Customer" });
  if (method === "INVOICE" && !customer.email) {
    return conflict({
      message: "The customer has no email address to send the invoice to",
      issues: [{ path: "method", message: "The customer has no email address" }],
    });
  }
  const { id, reference } = ticket.value;
  return ok({
    value: { ticket: { id, reference }, customer, connectedAccountId: account.stripeAccountId },
  });
}
