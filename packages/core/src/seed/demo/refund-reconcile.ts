import { defineReconciliation, type ReconcileContext } from "./reconcile";

type Total = { id: string; value: number };

/** Each payment's succeeded refunds summed from its `PaymentRefund` rows (ADR 0057, 0100). */
async function rebuildRefunds({ context: { db } }: ReconcileContext): Promise<Total[]> {
  const rows = await db.paymentRefund.findMany({
    where: { status: "SUCCEEDED" },
    select: { paymentId: true, amountMinor: true },
  });
  const totals = new Map<string, number>();
  for (const row of rows) {
    totals.set(row.paymentId, (totals.get(row.paymentId) ?? 0) + row.amountMinor);
  }
  return [...totals].map(([id, value]) => ({ id, value }));
}

/**
 * The refunded total is derived, never stored; what follows from it is checked: a payment is
 * REFUNDED exactly when its succeeded refunds cover its amount, and never refunds more.
 */
export const paymentRefundReconciliation = defineReconciliation({
  name: "payment refunds",
  rebuild: rebuildRefunds,
  compare: async ({ context, rebuilt }) => {
    const refunded = new Map(rebuilt.map((row) => [row.id, row.value]));
    const rows = await context.db.payment.findMany({
      where: { status: { in: ["SUCCEEDED", "REFUNDED"] } },
      select: { id: true, status: true, amountMinor: true },
    });
    return rows.flatMap((row) => {
      const sum = refunded.get(row.id) ?? 0;
      const full = sum >= row.amountMinor;
      if (sum > row.amountMinor) return [`payment ${row.id} refunds ${sum} of ${row.amountMinor}`];
      if (full !== (row.status === "REFUNDED")) {
        return [`payment ${row.id} is ${row.status} with ${sum} of ${row.amountMinor} refunded`];
      }
      return [];
    });
  },
});
