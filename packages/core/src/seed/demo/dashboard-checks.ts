import { dashboardSummary } from "../../features/dashboard/operations";
import type { ExecuteContext } from "../../operations/context";
import { execute } from "../../operations/execute";
import { addDays, toIsoDate } from "../../time/plain-date";
import { toZonedParts } from "../../time/zoned-time";
import type { DemoOrg } from "./types";

export type CheckDemoDashboardInput = { context: ExecuteContext; org: DemoOrg };

const PERIOD_DAYS = 182;

/**
 * ADR 0079: `dashboard.summary` for the last six months has something to show: every open
 * status has tickets and a value, won and lost tickets closed in the period spread over several
 * months (past closings run at their own day through the context clock, ADR 0064), and some
 * type is utilised. Returns failure messages.
 */
export async function checkDemoDashboard({
  context,
  org,
}: CheckDemoDashboardInput): Promise<string[]> {
  const today = toZonedParts({ instant: new Date(), timeZone: org.timeZone }).date;
  const input = {
    from: toIsoDate({ date: addDays({ date: today, days: -PERIOD_DAYS }) }),
    to: toIsoDate({ date: today }),
  };
  const result = await execute({ operation: dashboardSummary, input, context });
  if (!result.ok) return [`${org.slug}: dashboard.summary failed: ${result.error.message}`];
  const { statuses, outcomes, utilisation } = result.value;
  const failures: string[] = [];
  for (const tile of statuses) {
    if (tile.tickets === 0 || !(tile.estimatedValueMinor || tile.confirmedValueMinor)) {
      failures.push(`${org.slug}: dashboard status ${tile.name} has no tickets or value`);
    }
  }
  const monthsWith = ({ key }: { key: "wonTickets" | "lostTickets" }) =>
    (outcomes ?? []).filter((month) => month[key] > 0).length;
  const wantedWon = org.tickets.filter(
    (ticket) => ticket.won && ticket.status === "Completed",
  ).length;
  const won = (outcomes ?? []).reduce((sum, month) => sum + month.wonTickets, 0);
  if (won < wantedWon) failures.push(`${org.slug}: ${won} won tickets, expected ${wantedWon}+`);
  if (monthsWith({ key: "wonTickets" }) < 2)
    failures.push(`${org.slug}: won tickets in under 2 months`);
  if (monthsWith({ key: "lostTickets" }) < 2)
    failures.push(`${org.slug}: lost tickets in under 2 months`);
  if (!(utilisation ?? []).some((row) => (row.rate ?? 0) > 0)) {
    failures.push(`${org.slug}: no item type has utilisation above 0`);
  }
  return failures;
}
