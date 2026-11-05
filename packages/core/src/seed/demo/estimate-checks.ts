import type { ExecuteContext } from "../../operations/context";
import type { DemoOrg } from "./types";

export type CheckDemoEstimatesInput = { context: ExecuteContext; org: DemoOrg };

const key = ({ values }: { values: readonly (number | null)[] }) => values.join(",");

/**
 * ADR 0074: every order's estimate history is the data's `estimatesKr`, in order, and nothing
 * else wrote one. Returns failure messages.
 */
export async function checkDemoEstimates({
  context,
  org,
}: CheckDemoEstimatesInput): Promise<string[]> {
  const rows = await context.db.orderEstimate.findMany({
    orderBy: { seq: "asc" },
    select: { orderId: true, valueMinor: true },
  });
  const byOrder = new Map<string, (number | null)[]>();
  for (const row of rows)
    byOrder.set(row.orderId, [...(byOrder.get(row.orderId) ?? []), row.valueMinor]);
  const actual = [...byOrder.values()].map((values) => key({ values })).sort();
  const expected = org.orders
    .flatMap((order) => (order.estimatesKr ? [order.estimatesKr.map((kr) => kr * 100)] : []))
    .map((values) => key({ values }))
    .sort();
  return actual.join("|") === expected.join("|")
    ? []
    : [`${org.slug}: estimate histories ${actual.join("|")}, expected ${expected.join("|")}`];
}
