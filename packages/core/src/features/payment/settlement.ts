import type { OperationContext } from "../../operations/types";
import type { ReceivableProgress } from "./settlement-schema";

/**
 * The one module that derives money (ADR 0057): what a receivable has been paid, how far it is
 * paid and, in `ticket-balance.ts`, what a ticket still owes. Nothing here is ever stored.
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

export type PaymentFacts = ReceivableRef & { amountMinor: number; refundedMinor: number };

type Db = { context: Pick<OperationContext, "db"> };

export type PaidByReceivableInput = Db & { ticketIds: readonly string[] };

/** Net paid per receivable id (quote, deposit or invoice) on the tickets, in one query. */
export async function paidByReceivable({
  context,
  ticketIds,
}: PaidByReceivableInput): Promise<Map<string, number>> {
  const paid = new Map<string, number>();
  if (ticketIds.length === 0) return paid;
  const rows: PaymentFacts[] = await context.db.payment.findMany({
    where: { ticketId: { in: [...ticketIds] }, status: { in: [...SETTLED_STATUSES] } },
    select: {
      quoteId: true,
      depositId: true,
      invoiceId: true,
      amountMinor: true,
      refundedMinor: true,
    },
  });
  for (const row of rows) {
    const id = row.quoteId ?? row.depositId ?? row.invoiceId;
    if (id) paid.set(id, (paid.get(id) ?? 0) + row.amountMinor - row.refundedMinor);
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
