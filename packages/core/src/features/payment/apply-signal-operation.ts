import { AppError } from "../../errors/app-error";
import { err, ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import { notFound } from "../../shared/errors";
import { nowOf } from "../../time/now";
import { notifyPaymentReceived } from "../notification/follow-ups";
import { findSignalledPayment } from "./find-signalled-payment";
import { nextAttemptStatus, nextPaymentState } from "./payment-transition";
import { recordRefund } from "./record-refund";
import { PAYMENT_INCLUDE, toPaymentDto } from "./to-payment-dto";
import { PaymentSignalResultSchema, PaymentSignalSchema } from "./webhook-schema";

/**
 * Applies a verified provider signal to the payment it names (ADR 0028, 0100). SYSTEM only: a
 * provider's webhook runs it after verifying the delivery. Deliberately not part of
 * `createCoreOperations` (no user, AI or API surface may mark a payment paid), so it has no
 * adapters. Idempotent: a repeated signal finds the payment already moved and changes nothing.
 */
export const applyPaymentSignal = defineOperation({
  name: "payment.applySignal",
  kind: "command",
  description: "Apply a verified provider event to a payment (provider webhooks only).",
  input: PaymentSignalSchema,
  output: PaymentSignalResultSchema,
  permission: "payment:write",
  approval: false,
  followUp: notifyPaymentReceived,
  handler: async ({ input, context }) => {
    if (context.actor.type !== "system") {
      const message = "Payments are updated by the provider's webhook only";
      return err({ error: new AppError({ code: "FORBIDDEN", message }) });
    }
    const found = await findSignalledPayment({ context, signal: input });
    if (!found) return notFound({ entity: "Payment" });
    const { payment: before, attempt } = found;
    const attemptStatus = attempt ? nextAttemptStatus({ attempt, signal: input }) : null;
    if (attempt && attemptStatus) {
      await context.db.paymentAttempt.update({
        where: { id: attempt.id },
        data: { status: attemptStatus },
      });
    }
    const next = nextPaymentState({ payment: before, signal: input, now: nowOf({ context }) });
    const base = { paymentId: before.id, orderId: before.orderId };
    if (!next) return ok({ value: { ...base, status: before.status, changed: false } });
    const row = await context.db.payment.update({
      where: { id: before.id },
      data: next,
      include: PAYMENT_INCLUDE,
    });
    await recordRefund({ context, before, after: row });
    context.recordChange({
      entityId: row.id,
      before: toPaymentDto({ row: before }),
      after: toPaymentDto({ row }),
    });
    return ok({ value: { ...base, status: row.status, changed: true } });
  },
});
