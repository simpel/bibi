import type { ExecuteContext } from "../../operations/context";
import type { DemoOrg } from "./types";

export type CheckDemoOrdersInput = { context: ExecuteContext; org: DemoOrg };

type Counts = Map<string, number>;

const countBy = ({ names }: { names: readonly string[] }): Counts =>
  names.reduce((counts, name) => counts.set(name, (counts.get(name) ?? 0) + 1), new Map());

/**
 * ADR 0043: the minimum status configuration (one entry, one closing status), the number of
 * orders and how many are in each status, against the data files. Returns failure messages.
 */
export async function checkDemoOrders({ context, org }: CheckDemoOrdersInput): Promise<string[]> {
  const failures: string[] = [];
  const statuses = await context.db.orderStatus.findMany({});
  if (!statuses.some((orderStatus) => orderStatus.entry))
    failures.push(`${org.slug}: no entry status`);
  if (!statuses.some((orderStatus) => orderStatus.closes))
    failures.push(`${org.slug}: no closing status`);
  const entry = statuses.find((orderStatus) => orderStatus.entry)?.name ?? "";
  const rows = await context.db.order.findMany({
    select: { orderStatus: { select: { name: true } } },
  });
  if (rows.length !== org.orders.length) {
    failures.push(`${org.slug}: ${rows.length} orders, expected ${org.orders.length}`);
  }
  const actual = countBy({ names: rows.map((row) => row.orderStatus.name) });
  const expected = countBy({ names: org.orders.map((order) => order.status ?? entry) });
  for (const [name, count] of expected) {
    const found = actual.get(name) ?? 0;
    if (found !== count)
      failures.push(`${org.slug}: ${found} orders in ${name}, expected ${count}`);
  }
  return failures;
}
