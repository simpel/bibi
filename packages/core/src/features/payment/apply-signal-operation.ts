import { AppError } from "../../errors/app-error";
import { err, ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import { notFound } from "../../shared/errors";
import { nextPaymentState } from "./payment-transition";
import { PaymentSignalResultSchema, PaymentSignalSchema } from "./webhook-schema";

/**
 * Applies a verified Stripe event to the payment it names (ADR 0028). SYSTEM only: the Stripe
 * webhook runs it after verifying the signature. Deliberately not part of `createCoreOperations`
 * (no user, AI or API surface may mark a payment paid), so it has no adapters. Idempotent: a
 * repeated signal finds the payment already moved and changes nothing.
 */
export const applyPaymentSignal = defineOperation({
  name: "payment.applySignal",
  kind: "command",
  description: "Apply a verified Stripe event to a payment (Stripe webhook only).",
  input: PaymentSignalSchema,
  output: PaymentSignalResultSchema,
  permission: "payment:write",
  approval: false,
  handler: async ({ input, context }) => {
    if (context.actor.type !== "system") {
      const message = "Payments are updated by the Stripe webhook only";
      return err({ error: new AppError({ code: "FORBIDDEN", message }) });
    }
    const { providerAccountId, providerReference, paymentId } = input;
    const match = [
      ...(providerReference ? [{ providerReference }] : []),
      ...(paymentId ? [{ id: paymentId }] : []),
    ];
    const before = await context.db.payment.findFirst({
      where: { providerAccountId, OR: match },
    });
    if (!before) return notFound({ entity: "Payment" });
    const next = nextPaymentState({ payment: before, signal: input, now: new Date() });
    const base = { paymentId: before.id, ticketId: before.ticketId };
    if (!next) return ok({ value: { ...base, status: before.status, changed: false } });
    const row = await context.db.payment.update({ where: { id: before.id }, data: next });
    context.recordChange({ entityId: row.id, before, after: row });
    return ok({ value: { ...base, status: row.status, changed: true } });
  },
});
