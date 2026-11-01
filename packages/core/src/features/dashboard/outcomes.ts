import type { z } from "zod";
import type { OperationContext } from "../../operations/types";
import type { FinancePeriod } from "../finance/period";
import { cardValues } from "../pipeline/card-values";
import type { OutcomeMonthSchema } from "./schema";

type OutcomeMonth = z.infer<typeof OutcomeMonthSchema>;
type Context = Pick<OperationContext, "db" | "permissions">;

export type OutcomesInput = { context: Context; period: FinancePeriod };

/**
 * Won and lost tickets per month (ADR 0079). A ticket enters a closing status once (nothing
 * leaves one, ADR 0054), in the month of that change; it is won when it has an accepted quote or a sent invoice.
 */
export async function outcomes({ context, period }: OutcomesInput): Promise<OutcomeMonth[]> {
  const changes = await context.db.ticketStatusChange.findMany({
    where: { changedAt: { gte: period.start, lt: period.end }, toStatus: { closes: true } },
    orderBy: { seq: "asc" },
    select: { ticketId: true, changedAt: true },
  });
  const ticketIds = [...new Set(changes.map((change) => change.ticketId))];
  const [accepted, invoiced, valuesOf] = await Promise.all([
    context.db.quote.findMany({
      where: { ticketId: { in: ticketIds }, quoteStatus: "ACCEPTED" },
      select: { ticketId: true },
    }),
    context.db.invoice.findMany({
      where: { ticketId: { in: ticketIds }, status: "SENT" },
      select: { ticketId: true },
    }),
    cardValues({ context, ticketIds }),
  ]);
  const won = new Set([...accepted, ...invoiced].map((row) => row.ticketId));
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
