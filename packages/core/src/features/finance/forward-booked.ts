import type { ForwardBookedQuote } from "./load-facts";
import type { FinancePeriod } from "./period";
import type { ForwardBookedMonth } from "./schema";

/** The event's month: its first line's start, else when the quote was accepted. */
function eventInstant({ quote }: { quote: ForwardBookedQuote }): Date | null {
  const starts = quote.lines.flatMap(({ line }) =>
    line.startsAt ? [line.startsAt.getTime()] : [],
  );
  return starts.length > 0 ? new Date(Math.min(...starts)) : quote.acceptedAt;
}

export type ForwardInput = {
  quotes: readonly ForwardBookedQuote[];
  monthOf: FinancePeriod["monthOf"];
};

/** Won but not billed, per event month; the newest accepted version counts once per ticket. */
export function forwardBooked({ quotes, monthOf }: ForwardInput): ForwardBookedMonth[] {
  const newest = new Map<string, ForwardBookedQuote>();
  for (const quote of quotes) {
    const seen = newest.get(quote.ticketId);
    if (!seen || seen.version < quote.version) newest.set(quote.ticketId, quote);
  }
  const byMonth = new Map<string, ForwardBookedMonth>();
  for (const quote of newest.values()) {
    const instant = eventInstant({ quote });
    if (!instant) continue;
    const month = monthOf({ instant });
    const entry = byMonth.get(month) ?? { month, valueExclVatMinor: 0, tickets: 0 };
    entry.valueExclVatMinor += quote.totalExclVatMinor;
    entry.tickets += 1;
    byMonth.set(month, entry);
  }
  return [...byMonth.values()].sort((a, b) => a.month.localeCompare(b.month));
}
