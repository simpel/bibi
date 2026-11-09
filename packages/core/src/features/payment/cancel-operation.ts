import { err, ok, type Result } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import type { OperationContext } from "../../operations/types";
import { conflict, notFound } from "../../shared/errors";
import { cancelAttemptAtProvider } from "./close-attempts";
import { PaymentCancelInputSchema } from "./lifecycle-schema";
import { type PaymentDto, PaymentSchema } from "./schema";
import { PAYMENT_INCLUDE, toPaymentDto } from "./to-payment-dto";

type CancelInput = { context: OperationContext; payment: PaymentDto };

/**
 * Closes the payment's open attempts at their providers after the commit (ADR 0058). A provider
 * that refuses leaves its attempt PENDING and the error is returned; should money still arrive
 * on it, the payment is settled anyway.
 */
async function cancelAttempts({ context, payment }: CancelInput): Promise<Result<PaymentDto>> {
  const open = await context.db.paymentAttempt.findMany({
    where: { paymentId: payment.id, status: "PENDING" },
    include: { connection: true },
  });
  for (const attempt of open) {
    const closed = await cancelAttemptAtProvider({ context, attempt });
    if (!closed.ok) return err({ error: closed.error });
  }
  const row = await context.db.payment.findFirst({
    where: { id: payment.id },
    include: PAYMENT_INCLUDE,
  });
  return row ? ok({ value: toPaymentDto({ row }) }) : notFound({ entity: "Payment" });
}

export const cancelPayment = defineOperation({
  name: "payment.cancel",
  kind: "command",
  description:
    "Cancel a PENDING payment (ADR 0100): it is no longer requested, and its open checkout or " +
    "Swish request is closed at the provider. Any other status is a CONFLICT. Money that still " +
    "arrives on it settles it.",
  input: PaymentCancelInputSchema,
  output: PaymentSchema,
  permission: "payment:write",
  handler: async ({ input, context }) => {
    const before = await context.db.payment.findFirst({
      where: { id: input.id },
      include: PAYMENT_INCLUDE,
    });
    if (!before) return notFound({ entity: "Payment" });
    const { count } = await context.db.payment.updateMany({
      where: { id: input.id, status: "PENDING" },
      data: { status: "CANCELLED" },
    });
    if (count === 0)
      return conflict({
        message: `Only a PENDING payment can be cancelled; this one is ${before.status}`,
      });
    const after = toPaymentDto({ row: { ...before, status: "CANCELLED" } });
    context.recordChange({ entityId: before.id, before: toPaymentDto({ row: before }), after });
    return ok({ value: after });
  },
  external: ({ output, context }) => cancelAttempts({ context, payment: output }),
});
