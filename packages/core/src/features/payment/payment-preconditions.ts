import type { Customer } from "@okazi/db";
import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { conflict, notFound } from "../../shared/errors";
import type { PaymentCreateInput } from "./schema";

export type ChargeTarget = {
  ticket: { id: string; reference: number };
  customer: Customer;
  connectedAccountId: string;
};

export type LoadTargetInput = { input: PaymentCreateInput; context: OperationContext };

/**
 * What a new payment needs: a ticket that is open or in an invoiceable phase, its customer (with an email for invoices) and the
 * organization's connected account with card payments active.
 */
export async function loadChargeTarget({
  input,
  context,
}: LoadTargetInput): Promise<Result<ChargeTarget>> {
  const ticket = await context.db.ticket.findFirst({ where: { id: input.ticketId } });
  if (!ticket) return notFound({ entity: "Ticket" });
  const phase = await context.db.ticketPhase.findFirst({
    where: { id: ticket.phaseId, status: { in: ["ACTIVE", "ARCHIVED"] } },
    select: { terminal: true, invoiceable: true, name: true },
  });
  if (phase?.terminal && !phase.invoiceable) {
    return conflict({ message: `A ticket in "${phase.name}" cannot be charged` });
  }
  const account = await context.db.paymentAccount.findFirst({});
  if (account?.status !== "ACTIVE") {
    return conflict({
      message: "The payment account is not active; finish Stripe onboarding in settings first",
    });
  }
  const customer = await context.db.customer.findFirst({
    where: { id: ticket.customerId, status: { in: ["ACTIVE", "ARCHIVED"] } },
  });
  if (!customer) return notFound({ entity: "Customer" });
  if (input.method === "INVOICE" && !customer.email) {
    return conflict({
      message: "The customer has no email address to send the invoice to",
      issues: [{ path: "method", message: "The customer has no email address" }],
    });
  }
  return ok({
    value: {
      ticket: { id: ticket.id, reference: ticket.reference },
      customer,
      connectedAccountId: account.stripeAccountId,
    },
  });
}
