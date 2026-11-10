import type { OperationContext } from "../../operations/types";
import { DUE_INCLUDE, invoiceDueMinor } from "../invoice/to-invoice-dto";
import { paidByReceivable, type ReceivableRef, settlementOf } from "./settlement";

export type ReceivableOpenInput = { context: Pick<OperationContext, "db">; ref: ReceivableRef };

/** The receivable's amount now, read without a feature check (internal callers only). */
async function amountOf({ context, ref }: ReceivableOpenInput) {
  if (ref.depositId) {
    const deposit = await context.db.deposit.findFirst({ where: { id: ref.depositId } });
    return deposit ? { orderId: deposit.orderId, amountMinor: deposit.amountMinor } : null;
  }
  if (ref.invoiceId) {
    const invoice = await context.db.invoice.findFirst({
      where: { id: ref.invoiceId },
      include: DUE_INCLUDE,
    });
    if (!invoice) return null;
    return { orderId: invoice.orderId, amountMinor: invoiceDueMinor({ invoice, ...invoice }) };
  }
  const quote = await context.db.quote.findFirst({ where: { id: ref.quoteId ?? "" } });
  return quote ? { orderId: quote.orderId, amountMinor: quote.totalInclVatMinor } : null;
}

/**
 * What is still open on a receivable (ADR 0057), derived: its amount less the net paid on it.
 * Null when the receivable is gone. Used to stop new attempts once it is paid by any route.
 */
export async function receivableOpenMinor({
  context,
  ref,
}: ReceivableOpenInput): Promise<number | null> {
  const found = await amountOf({ context, ref });
  if (!found) return null;
  const paid = await paidByReceivable({ context, orderIds: [found.orderId] });
  const id = ref.quoteId ?? ref.depositId ?? ref.invoiceId ?? "";
  return settlementOf({ paid, id, amountMinor: found.amountMinor }).openMinor;
}
