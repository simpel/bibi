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

/** The range a dashboard tab opens on: this month (ADR 0086). */
export async function defaultFinancePeriod(): Promise<Period> {
  return presetPeriod({ today: await financeToday(), preset: { key: "thisMonth", month: true } });
}
