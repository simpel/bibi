import type { OperationContext } from "../../operations/types";
import type { ReceivableProgress } from "./settlement-schema";

/**
 * The one module that derives money (ADR 0057): what a receivable has been paid, how far it is
 * paid and, in `order-balance.ts`, what an order still owes. Nothing here is ever stored.
 */

/** Payment statuses whose money reached the venue; a refund is subtracted from them. */
const SETTLED_STATUSES = ["SUCCEEDED", "REFUNDED"] as const;

export type Settlement = { paidMinor: number; openMinor: number; progress: ReceivableProgress };

export type SettleInput = { amountMinor: number; paidMinor: number };

/** The derived fields of a receivable with a fixed amount and what has been paid against it. */
export function settle({ amountMinor, paidMinor }: SettleInput): Settlement {
  const openMinor = amountMinor - paidMinor;
  const progress: ReceivableProgress =
    openMinor < 0 ? "OVERPAID" : openMinor === 0 ? "PAID" : paidMinor > 0 ? "PARTLY_PAID" : "OPEN";
  return { paidMinor, openMinor, progress };
}

/** Which receivable a payment settles; exactly one is set (check constraint). */
export type ReceivableRef = {
  quoteId: string | null;
  depositId: string | null;
  invoiceId: string | null;
};

export type PaymentFacts = ReceivableRef & {
  amountMinor: number;
  refunds: readonly { amountMinor: number }[];
};

type Db = { context: Pick<OperationContext, "db"> };

export type PaidByReceivableInput = Db & { orderIds: readonly string[] };

/** Net paid per receivable id (quote, deposit or invoice) on the orders, in one query. */
export async function paidByReceivable({
  context,
  orderIds,
}: PaidByReceivableInput): Promise<Map<string, number>> {
  if (orderIds.length === 0) return new Map();
  return sumPaid({ context, where: { orderId: { in: [...orderIds] } } });
}

export type PaidForInvoicesInput = Db & { invoiceIds: readonly string[] };

/** Net paid per invoice id, for invoices across the organization (ADR 0077), in one query. */
export async function paidForInvoices({
  context,
  invoiceIds,
}: PaidForInvoicesInput): Promise<Map<string, number>> {
  if (invoiceIds.length === 0) return new Map();
  return sumPaid({ context, where: { invoiceId: { in: [...invoiceIds] } } });
}

type SumPaidInput = Db & {
  where: { orderId: { in: string[] } } | { invoiceId: { in: string[] } };
};

/** Settled payments matching `where`, summed per receivable id, succeeded refunds subtracted. */
async function sumPaid({ context, where }: SumPaidInput): Promise<Map<string, number>> {
  const paid = new Map<string, number>();
  const rows: PaymentFacts[] = await context.db.payment.findMany({
    where: { ...where, status: { in: [...SETTLED_STATUSES] } },
    select: {
      quoteId: true,
      depositId: true,
      invoiceId: true,
      amountMinor: true,
      refunds: { where: { status: "SUCCEEDED" }, select: { amountMinor: true } },
    },
  });
  for (const row of rows) {
    const id = row.quoteId ?? row.depositId ?? row.invoiceId;
    const refunded = row.refunds.reduce((sum, refund) => sum + refund.amountMinor, 0);
    if (id) paid.set(id, (paid.get(id) ?? 0) + row.amountMinor - refunded);
  }
  return paid;
}

export type SettlementOfInput = {
  paid: ReadonlyMap<string, number>;
  id: string;
  amountMinor: number;
};

/** `settle` for one receivable, looked up in a `paidByReceivable` map. */
export function settlementOf({ paid, id, amountMinor }: SettlementOfInput): Settlement {
  return settle({ amountMinor, paidMinor: paid.get(id) ?? 0 });
}
