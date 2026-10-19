import { getDb } from "@okazi/db";
import { ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import { notFound } from "../../shared/errors";
import { PublicPaymentInputSchema, PublicPaymentSchema } from "./schema";

/**
 * What the public payment page `/pay/<token>` shows (ADR 0028). Called by the web page as SYSTEM
 * after `getPublicPayment` pinned the organization from the token. Deliberately not part of
 * `createCoreOperations` (the customer has no session and no user, AI or API surface may read
 * payments by token), so it has no adapters. Returns no personal data.
 */
export const getPublicPaymentOperation = defineOperation({
  name: "payment.getPublic",
  kind: "query",
  description: "Read a payment by its public token for the customer's payment page.",
  input: PublicPaymentInputSchema,
  output: PublicPaymentSchema,
  permission: "payment:view",
  approval: false,
  handler: async ({ input, context }) => {
    const payment = await context.db.payment.findFirst({ where: { publicToken: input.token } });
    if (!payment) return notFound({ entity: "Payment" });
    const ticket = await context.db.ticket.findFirst({
      where: { id: payment.ticketId },
      select: { reference: true },
    });
    const organization = await getDb().organization.findUnique({
      where: { id: payment.organizationId },
      select: { name: true },
    });
    if (!ticket || !organization) return notFound({ entity: "Payment" });
    const expired =
      payment.status === "PENDING" && payment.expiresAt && payment.expiresAt <= new Date();
    return ok({
      value: {
        organizationName: organization.name,
        ticketReference: ticket.reference,
        method: payment.method,
        status: expired ? "EXPIRED" : payment.status,
        amountMinor: payment.amountMinor,
        currency: payment.currency,
        paymentUrl: payment.status === "PENDING" && !expired ? payment.paymentUrl : null,
        expiresAt: payment.expiresAt,
        paidAt: payment.paidAt,
      },
    });
  },
});
