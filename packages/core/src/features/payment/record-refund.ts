import type { Payment } from "@bibi/db";
import type { OperationContext } from "../../operations/types";
import { nowOf } from "../../time/now";

export type RecordRefundInput = {
  context: Pick<OperationContext, "db" | "organizationId" | "now">;
  before: Pick<Payment, "refundedMinor">;
  after: Pick<Payment, "id" | "refundedMinor">;
};

/**
 * Appends a `PaymentRefund` row when the refunded total grew (ADR 0077): the step and the new
 * total, dated `nowOf`. Written only here, from `payment.applySignal`; the unique total per payment
 * makes a repeated signal a no-op.
 */
export async function recordRefund({ context, before, after }: RecordRefundInput): Promise<void> {
  const amountMinor = after.refundedMinor - before.refundedMinor;
  if (amountMinor <= 0) return;
  await context.db.paymentRefund.create({
    data: {
      organizationId: context.organizationId,
      paymentId: after.id,
      amountMinor,
      refundedTotalMinor: after.refundedMinor,
      refundedAt: nowOf({ context }),
    },
  });
}
