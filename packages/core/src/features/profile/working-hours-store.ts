import type { OperationContext } from "../../operations/types";
import type { WorkingDay, WorkingHoursDto } from "./working-hours-schema";

const DAY_SELECT = {
  weekday: true,
  startMinute: true,
  endMinute: true,
  breakStartMinute: true,
  breakEndMinute: true,
} as const;

export type LoadWorkingHoursInput = { context: Pick<OperationContext, "db"> };

/** The acting user's working days, sorted by weekday (`scopedDb` pins the rows to the user). */
export async function loadWorkingHours({
  context,
}: LoadWorkingHoursInput): Promise<WorkingHoursDto> {
  const days = await context.db.userWorkingHours.findMany({
    orderBy: { weekday: "asc" },
    select: DAY_SELECT,
  });
  return { days };
}

export type ReplaceWorkingHoursInput = LoadWorkingHoursInput & { days: readonly WorkingDay[] };

/**
 * Replaces every working day of the acting user. Runs in the command's transaction, so a
 * concurrent replace either sees all old or all new rows; the `(userId, weekday)` unique key
 * turns an interleaving into a failed transaction instead of duplicates.
 */
export async function replaceWorkingHours({
  context,
  days,
}: ReplaceWorkingHoursInput): Promise<WorkingHoursDto> {
  await context.db.userWorkingHours.deleteMany({ where: {} });
  // `scopedDb` forces `userId` on every created row.
  const rows = days.map((day) => ({ ...day, userId: "" }));
  await context.db.userWorkingHours.createMany({ data: rows });
  return loadWorkingHours({ context });
}
