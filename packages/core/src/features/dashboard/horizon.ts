import type { OperationContext } from "../../operations/types";
import { loadZoneOfVenue } from "../../shared/time-zones";
import { nowOf } from "../../time/now";
import { addDays, toIsoDate } from "../../time/plain-date";
import { fromZonedParts, toZonedParts } from "../../time/zoned-time";
import { type FinancePeriod, periodOf } from "../finance/period";
import { DASHBOARD_HORIZON_DAYS, type DashboardWindow, EXPIRY_WARNING_DAYS } from "./schema";

const MIDNIGHT = { hour: 0, minute: 0, second: 0 };

/** Today and the next days as instants `[start, end)`, plus where hold warnings stop. */
export type DashboardHorizon = FinancePeriod &
  DashboardWindow & {
    now: Date;
    /** Start of the day `EXPIRY_WARNING_DAYS` after today: holds expiring before it are listed. */
    warnEnd: Date;
  };

/** Today (the context's clock, ADR 0064) and the next 27 days in the organization's zone. */
export async function resolveHorizon({
  context,
}: {
  context: Pick<OperationContext, "db" | "now">;
}): Promise<DashboardHorizon> {
  const now = nowOf({ context });
  const timeZone = (await loadZoneOfVenue({ context }))({ venue: null });
  const today = toZonedParts({ instant: now, timeZone }).date;
  const last = addDays({ date: today, days: DASHBOARD_HORIZON_DAYS - 1 });
  const warnDay = addDays({ date: today, days: EXPIRY_WARNING_DAYS });
  return {
    ...periodOf({ from: today, to: last, timeZone }),
    from: toIsoDate({ date: today }),
    to: toIsoDate({ date: last }),
    now,
    warnEnd: fromZonedParts({ date: warnDay, time: MIDNIGHT, timeZone }),
  };
}
