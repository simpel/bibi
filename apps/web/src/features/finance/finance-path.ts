import "server-only";
import { type PlainDate, toZonedParts } from "@bibi/core/schemas";
import { presetPeriod } from "@/lib/time/period-presets";
import { loadOrganizationTimeZone } from "@/server/time-zones";
import type { Period } from "./lib/finance-period";

/** Today in the organization's zone (ADR 0064). */
export async function financeToday(): Promise<PlainDate> {
  const timeZone = await loadOrganizationTimeZone();
  return toZonedParts({ instant: new Date(), timeZone }).date;
}

/** The range a financial dashboard tab opens on: this month (ADR 0086). */
export async function defaultFinancePeriod(): Promise<Period> {
  return presetPeriod({ today: await financeToday(), preset: { key: "thisMonth", month: true } });
}

/** The default range for Forecast: next 30 days forward. */
export async function defaultForecastPeriod(): Promise<Period> {
  return presetPeriod({ today: await financeToday(), preset: { key: "next30Days", days: 30 } });
}

/** The 30-day reset range when a historical dashboard receives an invalid forward range. */
export async function defaultHistoricalResetPeriod(): Promise<Period> {
  return presetPeriod({ today: await financeToday(), preset: { key: "last30Days", days: -30 } });
}
