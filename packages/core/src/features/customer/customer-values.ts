import type { OperationContext } from "../../operations/types";
import { canView } from "../../shared/can-view";
import { type BilledInvoice, type BilledQuote, billOf } from "../payment/billed";

type Context = Pick<OperationContext, "db" | "permissions">;

/** Each customer's billed value in minor units incl. VAT, by customer id; null without `payment:read`. */
export type CustomerValues = ReadonlyMap<string, number> | null;

export type CustomerValuesInput = { context: Context; customerIds: readonly string[] };

type Billing = { quotes: BilledQuote[]; invoices: BilledInvoice[] };

/** The accepted quotes (only with `quote:read`, as on the order balance) and sent invoices. */
async function loadBilling({ context, customerIds }: CustomerValuesInput) {
  const order = { customerId: { in: [...customerIds] }, status: "ACTIVE" as const };
  const select = {
    orderId: true,
    totalInclVatMinor: true,
    order: { select: { customerId: true } },
  };
  const [quotes, invoices] = await Promise.all([
    canView({ context, feature: "quote" })
      ? context.db.quote.findMany({
          where: { order, quoteStatus: "ACCEPTED" },
          orderBy: { version: "asc" },
          select: { ...select, quoteStatus: true },
        })
      : [],
    context.db.invoice.findMany({
      where: { order, status: "SENT" },
      select: {
        ...select,
        status: true,
        creditNotes: { where: { status: { not: "FAILED" } }, select: { amountMinor: true } },
      },
    }),
  ]);
  const byOrder = new Map<string, Billing & { customerId: string }>();
  const entry = ({ orderId, customerId }: { orderId: string; customerId: string }) => {
    const found = byOrder.get(orderId) ?? { customerId, quotes: [], invoices: [] };
    byOrder.set(orderId, found);
    return found;
  };
  for (const q of quotes)
    entry({ orderId: q.orderId, customerId: q.order.customerId }).quotes.push(q);
  for (const i of invoices) {
    entry({ orderId: i.orderId, customerId: i.order.customerId }).invoices.push(i);
  }
  return byOrder;
}

/**
 * What each customer is billed so far, incl. VAT: per active order what the order balance
 * counts as billed (sent invoices less credit notes, else the accepted quote, ADR 0057).
 */
export async function customerValues({
  context,
  customerIds,
}: CustomerValuesInput): Promise<CustomerValues> {
  if (!canView({ context, feature: "payment" })) return null;
  if (customerIds.length === 0) return new Map();
  const values = new Map<string, number>();
  for (const { customerId, ...billing } of (await loadBilling({ context, customerIds })).values()) {
    values.set(customerId, (values.get(customerId) ?? 0) + billOf(billing).billedMinor);
  }
  return values;
}
