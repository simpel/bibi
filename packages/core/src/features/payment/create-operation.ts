import { err, ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import { chargeAfterCommit } from "./charge-after-commit";
import { loadChargeTarget } from "./payment-preconditions";
import { newPublicToken } from "./public-token";
import { applicationFee } from "./request-charge";
import { PaymentCreateInputSchema, PaymentSchema } from "./schema";
import { toPaymentDto } from "./to-payment-dto";

export const createPayment = defineOperation({
  name: "payment.create",
  kind: "command",
  description:
    "Request a payment from the ticket's customer, charged directly on the organization's " +
    "Stripe account. CARD returns a hosted checkout link (paymentUrl) to send to the customer; " +
    "INVOICE emails a Stripe invoice to the customer's email. Needs an ACTIVE payment account. " +
    "The payment starts PENDING and is updated when Stripe reports it paid; if Stripe refuses " +
    "the charge it is FAILED.",
  input: PaymentCreateInputSchema,
  output: PaymentSchema,
  permission: "payment:write",
  handler: async ({ input, context }) => {
    const target = await loadChargeTarget({ input, context });
    if (!target.ok) return err({ error: target.error });
    // The row comes first; Stripe is called only after it committed (`external`, ADR 0058).
    const row = await context.db.payment.create({
      data: {
        publicToken: newPublicToken(),
        organizationId: context.organizationId,
        ticketId: input.ticketId,
        method: input.method,
        amountMinor: input.amountMinor,
        currency: input.currency,
        applicationFeeMinor: applicationFee({ amountMinor: input.amountMinor }) ?? null,
        providerAccountId: target.value.connectedAccountId,
        createdBy: context.actor.userId,
      },
    });
    context.recordChange({ entityId: row.id, after: row });
    return ok({ value: toPaymentDto({ row }) });
  },
  external: chargeAfterCommit,
});
