import { type ExecuteContext, execute, getLine, setItemHours, setVenueHours } from "../src/index";
import { unwrap } from "./helpers";

/** Monday–Friday 08:00–17:00 with lunch 12–13. */
export const OFFICE_DAYS = [0, 1, 2, 3, 4].map((weekday) => ({
  weekday,
  startMinute: 480,
  endMinute: 1020,
  breakStartMinute: 720,
  breakEndMinute: 780,
}));

/** Open all day, every day. */
export const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6].map((weekday) => ({
  weekday,
  startMinute: 0,
  endMinute: 1440,
  breakStartMinute: null,
  breakEndMinute: null,
}));

type Ctx = { context: ExecuteContext };
type Pattern = { days: unknown[]; exceptions?: unknown[] };

export const runVenueHours = ({
  context,
  venueId,
  days,
  exceptions = [],
}: Ctx & Pattern & { venueId: string }) =>
  execute({ operation: setVenueHours, input: { venueId, days, exceptions }, context });

export const runItemHours = ({
  context,
  itemId,
  days,
  exceptions = [],
}: Ctx & Pattern & { itemId: string }) =>
  execute({ operation: setItemHours, input: { itemId, days, exceptions }, context });

/** The line's warnings as read by `line.get`. */
export async function warningsOf({ context, lineId }: Ctx & { lineId: string }) {
  const line = unwrap({
    result: await execute({ operation: getLine, input: { id: lineId }, context }),
  });
  return line.warnings;
}
