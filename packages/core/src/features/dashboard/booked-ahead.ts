import type { OperationContext } from "../../operations/types";
import type { FinancePeriod } from "../finance/period";
import type { BookedAheadMonth } from "./schema";

type Context = Pick<OperationContext, "db">;

/** ACCEPTED quotes on active tickets that have no SENT invoice yet: won, not billed. */
function loadAcceptedNotInvoiced({ context }: { context: Context }) {
  return context.db.quote.findMany({
    where: {
      quoteStatus: "ACCEPTED",
      ticket: { status: "ACTIVE", invoices: { none: { status: "SENT" } } },
    },
    select: {
      ticketId: true,
      version: true,
      acceptedAt: true,
      totalExclVatMinor: true,
      lines: { select: { line: { select: { startsAt: true } } } },
    },
  });
}

type AcceptedQuote = Awaited<ReturnType<typeof loadAcceptedNotInvoiced>>[number];

/** The event's month: its first line's start, else when the quote was accepted. */
function eventInstant({ quote }: { quote: AcceptedQuote }): Date | null {
  const starts = quote.lines.flatMap(({ line }) =>
    line.startsAt ? [line.startsAt.getTime()] : [],
  );
  return starts.length > 0 ? new Date(Math.min(...starts)) : quote.acceptedAt;
}

export type BookedAheadInput = {
  context: Context;
  period: Pick<FinancePeriod, "monthOf" | "months">;
};

/**
 * Won but not billed, per event month in the range (ADR 0080, 0086); the newest accepted version
 * counts once per ticket.
 */
export async function bookedAhead({
  context,
  period,
}: BookedAheadInput): Promise<BookedAheadMonth[]> {
  const newest = new Map<string, AcceptedQuote>();
  for (const quote of await loadAcceptedNotInvoiced({ context })) {
    const seen = newest.get(quote.ticketId);
    if (!seen || seen.version < quote.version) newest.set(quote.ticketId, quote);
  }
  const byMonth = new Map<string, BookedAheadMonth>();
  for (const quote of newest.values()) {
    const instant = eventInstant({ quote });
    if (!instant) continue;
    const month = period.monthOf({ instant });
    if (!period.months.includes(month)) continue;
    const entry = byMonth.get(month) ?? { month, valueExclVatMinor: 0, tickets: 0 };
    entry.valueExclVatMinor += quote.totalExclVatMinor;
    entry.tickets += 1;
    byMonth.set(month, entry);
  }
  return [...byMonth.values()].sort((a, b) => a.month.localeCompare(b.month));
}
