import type { ExecuteContext } from "../../operations/context";
import type { DemoOrg } from "./types";

export type CheckDemoEstimatesInput = { context: ExecuteContext; org: DemoOrg };

const key = ({ values }: { values: readonly (number | null)[] }) => values.join(",");

/**
 * ADR 0074: every ticket's estimate history is the data's `estimatesKr`, in order, and nothing
 * else wrote one. Returns failure messages.
 */
export async function checkDemoEstimates({
  context,
  org,
}: CheckDemoEstimatesInput): Promise<string[]> {
  const rows = await context.db.ticketEstimate.findMany({
    orderBy: { seq: "asc" },
    select: { ticketId: true, valueMinor: true },
  });
  const byTicket = new Map<string, (number | null)[]>();
  for (const row of rows)
    byTicket.set(row.ticketId, [...(byTicket.get(row.ticketId) ?? []), row.valueMinor]);
  const actual = [...byTicket.values()].map((values) => key({ values })).sort();
  const expected = org.tickets
    .flatMap((ticket) => (ticket.estimatesKr ? [ticket.estimatesKr.map((kr) => kr * 100)] : []))
    .map((values) => key({ values }))
    .sort();
  return actual.join("|") === expected.join("|")
    ? []
    : [`${org.slug}: estimate histories ${actual.join("|")}, expected ${expected.join("|")}`];
}
