import { dashboardSummary } from "../../features/dashboard/operations";
import { financeOverview } from "../../features/finance/operations";
import type { ExecuteContext } from "../../operations/context";
import { execute } from "../../operations/execute";
import { addDays, toIsoDate } from "../../time/plain-date";
import { toZonedParts } from "../../time/zoned-time";
import type { DemoOrg } from "./types";

export type CheckDemoDashboardInput = { context: ExecuteContext; org: DemoOrg };

const PERIOD_DAYS = 182;

/**
 * ADR 0080, 0086: the Workload tab has something to show from the start of this month to four
 * weeks ahead: every open status has tickets, a value and a trend against the month's start,
 * holds expire soon, an organization with invoices has overdue ones, tickets are scheduled, some
 * type is utilised and accepted quotes wait to be invoiced. The seed generates no sheets yet, so
 * unsent sheets are only required to be readable (not null).
 */
async function checkAhead({ context, org }: CheckDemoDashboardInput): Promise<string[]> {
  const today = toZonedParts({ instant: new Date(), timeZone: org.timeZone }).date;
  const input = {
    from: toIsoDate({ date: { ...today, day: 1 } }),
    to: toIsoDate({ date: addDays({ date: today, days: 27 }) }),
  };
  const result = await execute({ operation: dashboardSummary, input, context });
  if (!result.ok) return [`${org.slug}: dashboard.summary failed: ${result.error.message}`];
  const { statuses, attention, scheduled, utilisation, bookedAhead } = result.value;
  const failures: string[] = [];
  for (const tile of statuses) {
    if (tile.tickets === 0 || !(tile.estimatedValueMinor || tile.confirmedValueMinor)) {
      failures.push(`${org.slug}: dashboard status ${tile.name} has no tickets or value`);
    }
    if (tile.trend.series.length === 0 || tile.trend.previous === null) {
      failures.push(`${org.slug}: dashboard status ${tile.name} has no trend`);
    }
  }
  const empty = ({ what }: { what: string }) =>
    failures.push(`${org.slug}: dashboard shows no ${what}`);
  if (attention.expiringHolds.length === 0) empty({ what: "expiring holds" });
  if (attention.unsentSheets === null) empty({ what: "unsent sheets list" });
  if (org.finance && !attention.overdue?.invoices) empty({ what: "overdue invoices" });
  if (scheduled.length === 0) empty({ what: "tickets scheduled" });
  if (!(utilisation ?? []).some((row) => (row.rate ?? 0) > 0))
    empty({ what: "utilisation above 0" });
  if ((bookedAhead ?? []).length === 0) empty({ what: "value booked ahead" });
  return failures;
}

/**
 * ADR 0079, 0080: won and lost tickets on Financials for the last six months spread over several
 * months (past closings run at their own day through the context clock, ADR 0064).
 */
async function checkOutcomes({ context, org }: CheckDemoDashboardInput): Promise<string[]> {
  const today = toZonedParts({ instant: new Date(), timeZone: org.timeZone }).date;
  const input = {
    from: toIsoDate({ date: addDays({ date: today, days: -PERIOD_DAYS }) }),
    to: toIsoDate({ date: today }),
  };
  const result = await execute({ operation: financeOverview, input, context });
  if (!result.ok) return [`${org.slug}: finance.overview failed: ${result.error.message}`];
  const outcomes = result.value.outcomes ?? [];
  const failures: string[] = [];
  const { trends } = result.value;
  if (org.finance && !(trends?.invoiced.current && trends.received.current)) {
    failures.push(`${org.slug}: no invoiced or received trend over the last six months`);
  }
  const monthsWith = ({ key }: { key: "wonTickets" | "lostTickets" }) =>
    outcomes.filter((month) => month[key] > 0).length;
  const wantedWon = org.tickets.filter(
    (ticket) => ticket.won && ticket.status === "Completed",
  ).length;
  const won = outcomes.reduce((sum, month) => sum + month.wonTickets, 0);
  if (won < wantedWon) failures.push(`${org.slug}: ${won} won tickets, expected ${wantedWon}+`);
  if (monthsWith({ key: "wonTickets" }) < 2)
    failures.push(`${org.slug}: won tickets in under 2 months`);
  if (monthsWith({ key: "lostTickets" }) < 2)
    failures.push(`${org.slug}: lost tickets in under 2 months`);
  return failures;
}

/** The dashboard ahead and the outcomes on Financials; returns failure messages. */
export async function checkDemoDashboard({
  context,
  org,
}: CheckDemoDashboardInput): Promise<string[]> {
  const [ahead, behind] = await Promise.all([
    checkAhead({ context, org }),
    checkOutcomes({ context, org }),
  ]);
  return [...ahead, ...behind];
}
