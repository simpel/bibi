import { loadQuote } from "../../features/quote/to-quote-dto";
import type { ExecuteContext } from "../../operations/context";
import type { DemoOrg } from "./types";

export type CheckDemoQuoteSnapshotsInput = { context: ExecuteContext; org: DemoOrg };

/** Every order line prices a line of its own quote's or invoice's order (ADR 0052). */
async function checkLineIds({ context, org }: CheckDemoQuoteSnapshotsInput): Promise<string[]> {
  const rows = await context.db.orderLine.findMany({
    select: {
      id: true,
      lineId: true,
      quote: { select: { orderId: true } },
      invoice: { select: { orderId: true } },
    },
  });
  const lineIds = [...new Set(rows.map((row) => row.lineId))];
  const lines = await context.db.line.findMany({
    where: { id: { in: lineIds }, status: { in: ["ACTIVE", "ARCHIVED"] } },
    select: { id: true, orderId: true },
  });
  const orderOf = new Map(lines.map((line) => [line.id, line.orderId]));
  return rows
    .filter((row) => orderOf.get(row.lineId) !== (row.quote ?? row.invoice)?.orderId)
    .map((row) => `${org.slug}: order line ${row.id} prices no line of its owner's order`);
}

/**
 * ADR 0052: the accepted quotes that differ from their orders are exactly the orders whose data
 * changes a line after the quote (`changeAfterQuote`), each flagging only that line's quantity.
 */
async function checkDrift({ context, org }: CheckDemoQuoteSnapshotsInput): Promise<string[]> {
  const failures: string[] = [];
  const changes = org.orders.flatMap((order) => order.changeAfterQuote ?? []);
  const names = new Set(changes.map((change) => change.line));
  const accepted = await context.db.quote.findMany({
    where: { quoteStatus: "ACCEPTED" },
    select: { id: true },
  });
  let drifting = 0;
  for (const { id } of accepted) {
    const quote = await loadQuote({ context, id });
    if (!quote?.differsFromOrder) continue;
    drifting += 1;
    const flagged = quote.orderChanges.map((line) => [line.name, ...line.changedFields].join(":"));
    const only = flagged.length === 1 && quote.orderRemovedLines.length === 0;
    if (
      !only ||
      !names.has(quote.orderChanges[0]?.name ?? "") ||
      !flagged[0]?.endsWith(":quantity")
    ) {
      failures.push(`${org.slug}: quote ${id} differs by ${flagged.join(", ") || "removed lines"}`);
    }
  }
  if (drifting !== changes.length) {
    failures.push(`${org.slug}: ${drifting} accepted quotes differ, expected ${changes.length}`);
  }
  return failures;
}

/** The snapshot rules of ADR 0052 on the seeded quotes. Returns failure messages. */
export async function checkDemoQuoteSnapshots({
  context,
  org,
}: CheckDemoQuoteSnapshotsInput): Promise<string[]> {
  return [...(await checkLineIds({ context, org })), ...(await checkDrift({ context, org }))];
}
