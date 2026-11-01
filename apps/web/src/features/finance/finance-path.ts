import "server-only";
import { type PlainDate, toZonedParts } from "@bibi/core/schemas";
import { ROUTES } from "@/lib/routes";
import { loadOrganizationTimeZone } from "@/server/time-zones";
import { lastMonthsPeriod, type Period } from "./lib/finance-period";

/** Today in the organization's zone (ADR 0064). */
export async function financeToday(): Promise<PlainDate> {
  const timeZone = await loadOrganizationTimeZone();
  return toZonedParts({ instant: new Date(), timeZone }).date;
}

/** `/financials/{from}/{to}`: inclusive plain days (ADR 0064). */
export const financialsHref = ({ from, to }: Period) => `${ROUTES.financials}/${from}/${to}`;

/** The period a bare `/financials` shows: the last 12 whole months, ending with this one. */
export async function defaultFinancePeriod(): Promise<Period> {
  return lastMonthsPeriod({ today: await financeToday(), months: 12 });
}
