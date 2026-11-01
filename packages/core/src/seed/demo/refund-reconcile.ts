import { defineReconciliation, type ReconcileContext } from "./reconcile";

type Total = { id: string; value: number };

/** Each payment's refunded total from its `PaymentRefund` rows (ADR 0077). */
async function rebuildRefunds({ context: { db } }: ReconcileContext): Promise<Total[]> {
  const rows = await db.paymentRefund.findMany({
    select: { paymentId: true, amountMinor: true },
  });
  const totals = new Map<string, number>();
  for (const row of rows) {
    totals.set(row.paymentId, (totals.get(row.paymentId) ?? 0) + row.amountMinor);
  }
  return [...totals].map(([id, value]) => ({ id, value }));
}

/** `Payment.refundedMinor` (the Stripe mirror) against the sum of its refund rows. */
export const paymentRefundReconciliation = defineReconciliation({
  name: "payment refunds",
  rebuild: rebuildRefunds,
  compare: async ({ context, rebuilt }) => {
    const want = new Map(rebuilt.map((row) => [row.id, row.value]));
    const rows = await context.db.payment.findMany({ select: { id: true, refundedMinor: true } });
    return rows
      .filter((row) => (want.get(row.id) ?? 0) !== row.refundedMinor)
      .map(
        (row) =>
          `payment ${row.id} has refundedMinor ${row.refundedMinor}, refunds sum to ${want.get(row.id) ?? 0}`,
      );
  },
});
