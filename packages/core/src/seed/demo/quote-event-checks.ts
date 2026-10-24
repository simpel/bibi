import type { ExecuteContext } from "../../operations/context";
import { checkDemoQuoteSnapshots } from "./quote-snapshot-checks";
import type { DemoOrg } from "./types";

export type CheckDemoQuoteEventsInput = { context: ExecuteContext; org: DemoOrg };

const STATUS = { QUOTE_SENT: "SENT", QUOTE_ACCEPTED: "ACCEPTED" } as const;

/**
 * ADR 0043: a ticket in a status with a quote event got there through its quote, which is SENT for
 * `QUOTE_SENT` and ACCEPTED, with its time and method, for `QUOTE_ACCEPTED`. Tickets made from a
 * predefined ticket start in their status and have no quote. An organization without event
 * statuses has no quotes, and the quotes are snapshots of the lines (ADR 0052). Returns failure
 * messages.
 */
export async function checkDemoQuoteEvents({
  context,
  org,
}: CheckDemoQuoteEventsInput): Promise<string[]> {
  const failures: string[] = [];
  const statuses = await context.db.ticketStatus.findMany({ where: { event: { not: null } } });
  const tickets = await context.db.ticket.findMany({
    where: {
      statusId: { in: statuses.map((ticketStatus) => ticketStatus.id) },
      quotes: { some: {} },
    },
    include: { quotes: true },
  });
  for (const ticket of tickets) {
    const event = statuses.find((ticketStatus) => ticketStatus.id === ticket.statusId)?.event;
    const quote = ticket.quotes[0];
    const expected = event ? STATUS[event] : null;
    if (ticket.quotes.length !== 1 || quote?.quoteStatus !== expected) {
      failures.push(`${org.slug}: ticket #${ticket.reference} has no ${expected} quote`);
    } else if (expected === "ACCEPTED" && !(quote.acceptedAt && quote.acceptanceMethod)) {
      failures.push(`${org.slug}: ticket #${ticket.reference} has no acceptance record`);
    }
  }
  const quotes = await context.db.quote.count();
  if (statuses.length === 0 && quotes > 0)
    failures.push(`${org.slug}: ${quotes} quotes, expected 0`);
  const names = new Set(statuses.map((ticketStatus) => ticketStatus.name));
  const expected = org.tickets.filter(
    (row) => row.status && names.has(row.status) && !row.template,
  );
  if (tickets.length !== expected.length) {
    failures.push(
      `${org.slug}: ${tickets.length} tickets by quote event, expected ${expected.length}`,
    );
  }
  failures.push(...(await checkDemoQuoteSnapshots({ context, org })));
  return failures;
}
