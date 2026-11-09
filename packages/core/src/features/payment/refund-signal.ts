import type { PaymentRefund } from "@bibi/db";
import type { OperationContext } from "../../operations/types";
import { PAYMENT_INCLUDE, type PaymentRow, refundTotals } from "./to-payment-dto";
import type { PaymentSignal } from "./webhook-schema";

type Context = Pick<OperationContext, "db" | "organizationId">;

export type RefundSignalInput = { context: Context; payment: PaymentRow; signal: PaymentSignal };

/** The refund Bibi started that the signal names: by our id in the metadata, else its reference. */
async function findRefund({ context, payment, signal }: RefundSignalInput) {
  const or = [
    ...(signal.refundId ? [{ id: signal.refundId }] : []),
    ...(signal.reference ? [{ providerReference: signal.reference }] : []),
  ];
  if (or.length === 0) return null;
  return context.db.paymentRefund.findFirst({ where: { paymentId: payment.id, OR: or } });
}

type CompleteInput = RefundSignalInput & { refund: PaymentRefund };

async function complete({ context, signal, refund }: CompleteInput): Promise<boolean> {
  if (refund.status !== "PENDING") return false;
  const succeeded = signal.kind === "refund.succeeded";
  const { count } = await context.db.paymentRefund.updateMany({
    where: { id: refund.id, status: "PENDING" },
    data: {
      status: succeeded ? "SUCCEEDED" : "FAILED",
      ...(succeeded ? { refundedAt: signal.occurredAt } : {}),
      ...(refund.providerReference || !signal.reference
        ? {}
        : { providerReference: signal.reference }),
    },
  });
  return count > 0;
}

/**
 * A refund the provider made without Bibi starting it (in its own dashboard): it reports a
 * refunded total, and the part Bibi does not know yet becomes one SUCCEEDED row. The total counts
 * what the provider holds: the SUCCEEDED refunds and the PENDING ones it was given (a reference).
 * A PENDING refund it never got is not in it, so a dashboard refund is never lost behind one that
 * later fails; one that fails at the provider drops out of its total as it does here.
 */
async function recordReportedStep({ context, payment, signal }: RefundSignalInput) {
  if (signal.kind !== "refund.succeeded" || signal.refundedTotalMinor === undefined) return false;
  const refunds = await context.db.paymentRefund.findMany({
    where: { paymentId: payment.id, status: { in: ["SUCCEEDED", "PENDING"] } },
    select: { amountMinor: true, status: true, providerReference: true },
  });
  const known = refunds
    .filter((r) => r.status === "SUCCEEDED" || r.providerReference !== null)
    .reduce((sum, r) => sum + r.amountMinor, 0);
  const step = Math.min(signal.refundedTotalMinor, payment.amountMinor) - known;
  if (step <= 0) return false;
  await context.db.paymentRefund.create({
    data: {
      organizationId: context.organizationId,
      paymentId: payment.id,
      amountMinor: step,
      status: "SUCCEEDED",
      refundedAt: signal.occurredAt,
    },
  });
  return true;
}

/** REFUNDED once the succeeded refunds cover the amount (a status, never moved back). */
async function settleStatus({ context, payment }: Omit<RefundSignalInput, "signal">) {
  const row = await context.db.payment.findFirstOrThrow({
    where: { id: payment.id },
    include: PAYMENT_INCLUDE,
  });
  const { refundedMinor } = refundTotals({ refunds: row.refunds });
  if (row.status !== "SUCCEEDED" || refundedMinor < row.amountMinor) return row;
  return context.db.payment.update({
    where: { id: row.id },
    data: { status: "REFUNDED" },
    include: PAYMENT_INCLUDE,
  });
}

/**
 * Applies `refund.succeeded|failed` (ADR 0100): completes the PENDING refund Bibi started, or
 * records a step the provider reports by its refunded total. A repeat changes nothing. Returns
 * the payment after it, or null when nothing changed.
 */
export async function applyRefundSignal({
  context,
  payment,
  signal,
}: RefundSignalInput): Promise<PaymentRow | null> {
  const input = { context, payment, signal };
  const refund = await findRefund(input);
  const changed = refund ? await complete({ ...input, refund }) : await recordReportedStep(input);
  if (!changed) return null;
  return settleStatus(input);
}

export { settleStatus as settleRefundStatus };
