import type { OperationContext } from "../../operations/types";
import { addDays, parseIsoDate, weekdayOf } from "../../time/plain-date";
import { fromZonedParts } from "../../time/zoned-time";
import { type DashboardHorizon, resolveHorizon } from "../dashboard/horizon";

const MIDNIGHT = { hour: 0, minute: 0, second: 0 };

/** The instants Needs you groups by, in the organization's zone (ADR 0064). */
export type TaskWindow = {
  now: Date;
  timeZone: string;
  /** Midnight that ends today. */
  todayEnd: Date;
  /** Midnight that ends next week (weeks start on Monday): Soon stops here. */
  end: Date;
  /** The dashboard's horizon, for the hold warnings it already answers. */
  horizon: DashboardHorizon;
};

/** Now, the end of today and the end of next week, from the context's clock. */
export async function resolveTaskWindow({
  context,
}: {
  context: Pick<OperationContext, "db" | "now">;
}): Promise<TaskWindow> {
  const horizon = await resolveHorizon({ context });
  const { now, timeZone } = horizon;
  const today = parseIsoDate({ value: horizon.from });
  const at = ({ days }: { days: number }) =>
    fromZonedParts({ date: addDays({ date: today, days }), time: MIDNIGHT, timeZone });
  return {
    ...{ now, timeZone, horizon },
    todayEnd: at({ days: 1 }),
    end: at({ days: 14 - weekdayOf({ date: today }) }),
  };
}

const HOUR_MS = 3_600_000;

/** `hours` before `instant`. */
export const hoursBefore = ({ instant, hours }: { instant: Date; hours: number }) =>
  new Date(instant.getTime() - hours * HOUR_MS);
