import type { OperationContext } from "../../operations/types";
import { paidByReceivable } from "../payment/settlement";

export type DeductDepositsInput = {
  context: Pick<OperationContext, "db" | "organizationId" | "actor">;
  invoiceId: string;
  orderId: string;
};

/**
 * Freezes the order's paid deposits onto a new invoice (ADR 0090): one row per deposit that is
 * not VOID and has something paid, at what is paid on it now. A deposit paid later is not
 * deducted; void and recreate the invoice to include it.
 */
export async function deductPaidDeposits({
  context,
  invoiceId,
  orderId,
}: DeductDepositsInput): Promise<void> {
  const [deposits, paid] = await Promise.all([
    context.db.deposit.findMany({
      where: { orderId, status: { not: "VOID" } },
      select: { id: true },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    }),
    paidByReceivable({ context, orderIds: [orderId] }),
  ]);
  const rows = deposits.flatMap(({ id }) => {
    const amountMinor = paid.get(id) ?? 0;
    return amountMinor > 0 ? [{ depositId: id, amountMinor }] : [];
  });
  if (rows.length === 0) return;
  await context.db.invoiceDeposit.createMany({
    data: rows.map((row) => ({
      ...row,
      invoiceId,
      organizationId: context.organizationId,
      createdBy: context.actor.userId,
    })),
  });
}
