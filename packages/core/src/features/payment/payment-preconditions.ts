import type { Customer } from "@okazi/db";
import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { conflict, notFound } from "../../shared/errors";
import type { PaymentCreateInput } from "./schema";

export type ChargeTarget = {
  booking: { id: string; reference: number };
  customer: Customer;
  connectedAccountId: string;
};

export type LoadTargetInput = { input: PaymentCreateInput; context: OperationContext };

/**
 * What a new payment needs: an open booking, its customer (with an email for invoices) and the
 * organization's connected account with card payments active.
 */
export async function loadChargeTarget({
  input,
  context,
}: LoadTargetInput): Promise<Result<ChargeTarget>> {
  const booking = await context.db.booking.findFirst({ where: { id: input.bookingId } });
  if (!booking) return notFound({ entity: "Booking" });
  const status = await context.db.bookingStatus.findFirst({
    where: { id: booking.bookingStatusId, status: { in: ["ACTIVE", "ARCHIVED"] } },
    select: { phase: true, name: true },
  });
  if (status?.phase === "CANCELLED") {
    return conflict({ message: `A booking in "${status.name}" cannot be charged` });
  }
  const account = await context.db.paymentAccount.findFirst({});
  if (account?.status !== "ACTIVE") {
    return conflict({
      message: "The payment account is not active; finish Stripe onboarding in settings first",
    });
  }
  const customer = await context.db.customer.findFirst({
    where: { id: booking.customerId, status: { in: ["ACTIVE", "ARCHIVED"] } },
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
      booking: { id: booking.id, reference: booking.reference },
      customer,
      connectedAccountId: account.stripeAccountId,
    },
  });
}
