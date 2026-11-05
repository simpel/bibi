import type { OperationContext } from "../../operations/types";
import { cardValues } from "../pipeline/card-values";
import type { FinancePeriod } from "./period";
import type { OutcomeMonth } from "./schema";

type Context = Pick<OperationContext, "db" | "permissions">;

export type OutcomesInput = {
  context: Context;
  period: FinancePeriod;
  customerId?: string | undefined;
};

/** Changes into a closing status in the period, oldest first; one customer's orders if given. */
const loadClosings = ({ context, period, customerId }: OutcomesInput) =>
  context.db.orderStatusChange.findMany({
    where: {
      changedAt: { gte: period.start, lt: period.end },
      toStatus: { closes: true },
      ...(customerId ? { order: { customerId } } : {}),
    },
    orderBy: { seq: "asc" },
    select: { orderId: true, changedAt: true },
  });

/** The orders of `orderIds` that are won: they have an accepted quote or a sent invoice. */
async function wonOrders({ context, orderIds }: { context: Context; orderIds: string[] }) {
  const [accepted, invoiced] = await Promise.all([
    context.db.quote.findMany({
      where: { orderId: { in: orderIds }, quoteStatus: "ACCEPTED" },
      select: { orderId: true },
    }),
    context.db.invoice.findMany({
      where: { orderId: { in: orderIds }, status: "SENT" },
      select: { orderId: true },
    }),
  ]);
  return new Set([...accepted, ...invoiced].map((row) => row.orderId));
}

/**
 * Won and lost orders per month (ADR 0079, on Financials since ADR 0080). An order enters a
 * closing status once (nothing leaves one, ADR 0054), in the month of that change; it is won when
 * it has an accepted quote or a sent invoice.
 */
export async function outcomes({
  context,
  period,
  customerId,
}: OutcomesInput): Promise<OutcomeMonth[]> {
  const changes = await loadClosings({ context, period, customerId });
  const orderIds = [...new Set(changes.map((change) => change.orderId))];
  const [won, valuesOf] = await Promise.all([
    wonOrders({ context, orderIds }),
    cardValues({ context, orderIds }),
  ]);
  const rows = new Map<string, OutcomeMonth>(
    period.months.map((month) => [
      month,
      { month, wonOrders: 0, wonValueMinor: 0, lostOrders: 0, lostValueMinor: 0 },
    ]),
  );
  for (const orderId of orderIds) {
    const closed = changes.find((change) => change.orderId === orderId);
    const row = closed && rows.get(period.monthOf({ instant: closed.changedAt }));
    if (!row) continue;
    const { estimatedValueMinor, confirmedValueMinor } = valuesOf({ orderId });
    if (won.has(orderId)) {
      row.wonOrders += 1;
      row.wonValueMinor += confirmedValueMinor ?? estimatedValueMinor ?? 0;
    } else {
      row.lostOrders += 1;
      row.lostValueMinor += estimatedValueMinor ?? 0;
    }
  }
  return [...rows.values()];
}
