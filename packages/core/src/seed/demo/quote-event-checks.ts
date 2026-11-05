import type { ExecuteContext } from "../../operations/context";
import { checkDemoQuoteSnapshots } from "./quote-snapshot-checks";
import type { DemoOrg } from "./types";

export type CheckDemoQuoteEventsInput = { context: ExecuteContext; org: DemoOrg };

const STATUS = { QUOTE_SENT: "SENT", QUOTE_ACCEPTED: "ACCEPTED" } as const;

/**
 * ADR 0043: an order in a status with a quote event got there through its quote, which is SENT for
 * `QUOTE_SENT` and ACCEPTED, with its time and method, for `QUOTE_ACCEPTED`. Orders made from a
 * predefined order start in their status and have no quote. An organization without event
 * statuses has only the quotes of its won orders (ADR 0079), and the quotes are snapshots of the lines (ADR 0052). Returns failure
 * messages.
 */
export async function checkDemoQuoteEvents({
  context,
  org,
}: CheckDemoQuoteEventsInput): Promise<string[]> {
  const failures: string[] = [];
  const statuses = await context.db.orderStatus.findMany({ where: { event: { not: null } } });
  const orders = await context.db.order.findMany({
    where: {
      statusId: { in: statuses.map((orderStatus) => orderStatus.id) },
      quotes: { some: {} },
    },
    include: { quotes: true },
  });
  for (const order of orders) {
    const event = statuses.find((orderStatus) => orderStatus.id === order.statusId)?.event;
    const quote = order.quotes[0];
    const expected = event ? STATUS[event] : null;
    if (order.quotes.length !== 1 || quote?.quoteStatus !== expected) {
      failures.push(`${org.slug}: order #${order.reference} has no ${expected} quote`);
    } else if (expected === "ACCEPTED" && !(quote.acceptedAt && quote.acceptanceMethod)) {
      failures.push(`${org.slug}: order #${order.reference} has no acceptance record`);
    }
  }
  const quotes = await context.db.quote.count();
  // ADR 0079: only the won orders of the data have a quote without an event status.
  const wonQuotes = org.orders.filter((row) => row.won).length;
  if (statuses.length === 0 && quotes !== wonQuotes)
    failures.push(`${org.slug}: ${quotes} quotes, expected ${wonQuotes}`);
  const names = new Set(statuses.map((orderStatus) => orderStatus.name));
  const expected = org.orders.filter((row) => row.status && names.has(row.status) && !row.template);
  if (orders.length !== expected.length) {
    failures.push(
      `${org.slug}: ${orders.length} orders by quote event, expected ${expected.length}`,
    );
  }
  failures.push(...(await checkDemoQuoteSnapshots({ context, org })));
  return failures;
}
