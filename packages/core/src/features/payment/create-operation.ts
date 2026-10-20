import { createId } from "@paralleldrive/cuid2";
import { err, ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import { loadChargeTarget } from "./payment-preconditions";
import { newPublicToken } from "./public-token";
import { applicationFee, requestCharge } from "./request-charge";
import { PaymentCreateInputSchema, PaymentSchema } from "./schema";
import { toPaymentDto } from "./to-payment-dto";

export const createPayment = defineOperation({
  name: "payment.create",
  kind: "command",
  description:
    "Request a payment from the ticket's customer, charged directly on the organization's " +
    "Stripe account. CARD returns a hosted checkout link (paymentUrl) to send to the customer; " +
    "INVOICE emails a Stripe invoice to the customer's email. Needs an ACTIVE payment account. " +
    "The payment starts PENDING and is updated when Stripe reports it paid.",
  input: PaymentCreateInputSchema,
  output: PaymentSchema,
  permission: "payment:write",
  handler: async ({ input, context }) => {
    const target = await loadChargeTarget({ input, context });
    if (!target.ok) return err({ error: target.error });
    const paymentId = createId();
    const publicToken = newPublicToken();
    const applicationFeeMinor = applicationFee({ amountMinor: input.amountMinor });
    const charge = await requestCharge({
      paymentId,
      publicToken,
      organizationId: context.organizationId,
      input,
      target: target.value,
      applicationFeeMinor,
    });
    if (!charge.ok) return err({ error: charge.error });
    const row = await context.db.payment.create({
      data: {
        id: paymentId,
        publicToken,
        organizationId: context.organizationId,
        ticketId: input.ticketId,
        method: input.method,
        amountMinor: input.amountMinor,
        currency: input.currency,
        applicationFeeMinor: applicationFeeMinor ?? null,
        providerAccountId: target.value.connectedAccountId,
        providerReference: charge.value.providerReference,
        paymentUrl: charge.value.url,
        expiresAt: charge.value.expiresAt,
        createdBy: context.actor.userId,
      },
    });
    const payment = toPaymentDto({ row });
    // Audit images are DTOs: the public token and the connected account id never enter them.
    context.recordChange({ entityId: row.id, after: payment });
    return ok({ value: payment });
  },
});
