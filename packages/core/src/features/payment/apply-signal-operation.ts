import { getLogger } from "@bibi/logger";
import { AppError } from "../../errors/app-error";
import { err, ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import { notFound } from "../../shared/errors";
import { nowOf } from "../../time/now";
import { notifyPaymentReceived } from "../notification/follow-ups";
import { findSignalledPayment } from "./find-signalled-payment";
import { nextAttemptStatus, nextPaymentState } from "./payment-transition";
import { applyRefundSignal } from "./refund-signal";
import { registerOnInvoice } from "./register-on-invoice";
import { PAYMENT_INCLUDE, toPaymentDto } from "./to-payment-dto";
import { PaymentSignalResultSchema, PaymentSignalSchema } from "./webhook-schema";

/**
 * Applies a verified provider signal to the payment it names (ADR 0028, 0100): an attempt's
 * outcome, or a refund. SYSTEM only: a provider's webhook runs it after verifying the delivery.
 * Deliberately not part of `createCoreOperations` (no user, AI or API surface may mark a payment
 * paid), so it has no adapters. Idempotent: a repeated signal finds the payment already moved and
 * changes nothing. A payment on an invoice raised in a ledger provider is booked there afterwards.
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
    const base = { paymentId: before.id, orderId: before.orderId };
    const unchanged = { ...base, status: before.status, changed: false };
    if (input.kind.startsWith("refund.")) {
      const row = await applyRefundSignal({ context, payment: before, signal: input });
      if (!row) return ok({ value: unchanged });
      const change = { before: toPaymentDto({ row: before }), after: toPaymentDto({ row }) };
      context.recordChange({ entityId: row.id, ...change });
      return ok({ value: { ...base, status: row.status, changed: true } });
    }
    const attemptStatus = attempt ? nextAttemptStatus({ attempt, signal: input }) : null;
    if (attempt && attemptStatus) {
      await context.db.paymentAttempt.update({
        where: { id: attempt.id },
        data: { status: attemptStatus },
      });
    }
    const next = nextPaymentState({ payment: before, signal: input, now: nowOf({ context }) });
    if (!next) return ok({ value: unchanged });
    // The attempt that paid decides how and where it was paid (ADR 0100).
    const paidWith =
      next.status === "SUCCEEDED" && attempt
        ? { method: attempt.method, provider: attempt.provider, connectionId: attempt.connectionId }
        : {};
    const row = await context.db.payment.update({
      where: { id: before.id },
      data: { ...next, ...paidWith },
      include: PAYMENT_INCLUDE,
    });
    context.recordChange({
      entityId: row.id,
      before: toPaymentDto({ row: before }),
      after: toPaymentDto({ row }),
    });
    return ok({ value: { ...base, status: row.status, changed: true } });
  },
  external: async ({ output, context }) => {
    if (!output.changed || output.status !== "SUCCEEDED") return ok({ value: output });
    // Booking it in the invoice's ledger provider never undoes the payment; staff see it unbooked.
    const registered = await registerOnInvoice({ context, paymentId: output.paymentId });
    if (!registered.ok) {
      const fields = { paymentId: output.paymentId, err: registered.error };
      getLogger().warn({ event: "payment.registerFailed", ...fields });
    }
    return ok({ value: output });
  },
});
