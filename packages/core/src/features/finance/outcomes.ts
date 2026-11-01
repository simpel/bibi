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

/** Changes into a closing status in the period, oldest first; one customer's tickets if given. */
const loadClosings = ({ context, period, customerId }: OutcomesInput) =>
  context.db.ticketStatusChange.findMany({
    where: {
      changedAt: { gte: period.start, lt: period.end },
      toStatus: { closes: true },
      ...(customerId ? { ticket: { customerId } } : {}),
    },
    orderBy: { seq: "asc" },
    select: { ticketId: true, changedAt: true },
  });

/** The tickets of `ticketIds` that are won: they have an accepted quote or a sent invoice. */
async function wonTickets({ context, ticketIds }: { context: Context; ticketIds: string[] }) {
  const [accepted, invoiced] = await Promise.all([
    context.db.quote.findMany({
      where: { ticketId: { in: ticketIds }, quoteStatus: "ACCEPTED" },
      select: { ticketId: true },
    }),
    context.db.invoice.findMany({
      where: { ticketId: { in: ticketIds }, status: "SENT" },
      select: { ticketId: true },
    }),
  ]);
  return new Set([...accepted, ...invoiced].map((row) => row.ticketId));
}

/**
 * Won and lost tickets per month (ADR 0079, on Financials since ADR 0080). A ticket enters a
 * closing status once (nothing leaves one, ADR 0054), in the month of that change; it is won when
 * it has an accepted quote or a sent invoice.
 */
export async function outcomes({
  context,
  period,
  customerId,
}: OutcomesInput): Promise<OutcomeMonth[]> {
  const changes = await loadClosings({ context, period, customerId });
  const ticketIds = [...new Set(changes.map((change) => change.ticketId))];
  const [won, valuesOf] = await Promise.all([
    wonTickets({ context, ticketIds }),
    cardValues({ context, ticketIds }),
  ]);
  const rows = new Map<string, OutcomeMonth>(
    period.months.map((month) => [
      month,
      { month, wonTickets: 0, wonValueMinor: 0, lostTickets: 0, lostValueMinor: 0 },
    ]),
  );
  for (const ticketId of ticketIds) {
    const closed = changes.find((change) => change.ticketId === ticketId);
    const row = closed && rows.get(period.monthOf({ instant: closed.changedAt }));
    if (!row) continue;
    const { estimatedValueMinor, confirmedValueMinor } = valuesOf({ ticketId });
    if (won.has(ticketId)) {
      row.wonTickets += 1;
      row.wonValueMinor += confirmedValueMinor ?? estimatedValueMinor ?? 0;
    } else {
      row.lostTickets += 1;
      row.lostValueMinor += estimatedValueMinor ?? 0;
    }
  }
  return [...rows.values()];
}
