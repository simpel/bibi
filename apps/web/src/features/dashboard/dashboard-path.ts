import "server-only";
import { financeToday } from "@/features/finance/finance-path";
import { lastMonthsPeriod, type Period } from "@/features/finance/lib/finance-period";

/** The months a bare `/dashboard` covers (ADR 0079). */
export const DEFAULT_DASHBOARD_MONTHS = 6;

/** The last 6 whole months, ending with this one, in the organization's zone. */
export async function defaultDashboardPeriod(): Promise<Period> {
  return lastMonthsPeriod({ today: await financeToday(), months: DEFAULT_DASHBOARD_MONTHS });
}
