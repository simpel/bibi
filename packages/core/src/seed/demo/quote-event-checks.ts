import type { ExecuteContext } from "../../operations/context";
import type { DemoOrg } from "./types";

export type CheckDemoQuoteEventsInput = { context: ExecuteContext; org: DemoOrg };

const STATUS = { QUOTE_SENT: "SENT", QUOTE_ACCEPTED: "ACCEPTED" } as const;

/**
 * ADR 0043: a ticket in a phase with a quote event got there through its quote, which is SENT for
 * `QUOTE_SENT` and ACCEPTED, with its time and method, for `QUOTE_ACCEPTED`. Tickets made from a
 * predefined ticket start in their phase and have no quote. An organization without event
 * phases has no quotes. Returns failure messages.
 */
export async function checkDemoQuoteEvents({
  context,
  org,
}: CheckDemoQuoteEventsInput): Promise<string[]> {
  const failures: string[] = [];
  const phases = await context.db.ticketPhase.findMany({ where: { event: { not: null } } });
  const tickets = await context.db.ticket.findMany({
    where: { phaseId: { in: phases.map((phase) => phase.id) }, quotes: { some: {} } },
    include: { quotes: true },
  });
  for (const ticket of tickets) {
    const event = phases.find((phase) => phase.id === ticket.phaseId)?.event;
    const quote = ticket.quotes[0];
    const expected = event ? STATUS[event] : null;
    if (ticket.quotes.length !== 1 || quote?.quoteStatus !== expected) {
      failures.push(`${org.slug}: ticket #${ticket.reference} has no ${expected} quote`);
    } else if (expected === "ACCEPTED" && !(quote.acceptedAt && quote.acceptanceMethod)) {
      failures.push(`${org.slug}: ticket #${ticket.reference} has no acceptance record`);
    }
  }
  const quotes = await context.db.quote.count();
  if (phases.length === 0 && quotes > 0) failures.push(`${org.slug}: ${quotes} quotes, expected 0`);
  const names = new Set(phases.map((phase) => phase.name));
  const expected = org.tickets.filter((row) => row.phase && names.has(row.phase) && !row.template);
  if (tickets.length !== expected.length) {
    failures.push(
      `${org.slug}: ${tickets.length} tickets by quote event, expected ${expected.length}`,
    );
  }
  return failures;
}
