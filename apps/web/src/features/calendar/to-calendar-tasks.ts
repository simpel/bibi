import {
  type CalendarTask,
  type DateTimeFormat,
  toIsoDate,
  toZonedParts,
} from "@bibi/core/schemas";
import type { CalendarTaskEntry } from "@bibi/ui";

export type ToCalendarTasksInput = {
  tasks: readonly CalendarTask[];
  /** The zone the calendar draws in (ADR 0064 decision 12: the organization's). */
  timeZone: string;
  dates: DateTimeFormat;
  /** Where a task opens: its own page. */
  taskHref: (input: { id: string }) => string;
};

/**
 * `calendar.range` tasks as the calendar's task marks (spec: tasks, ADR 0120): a point on the
 * day they are due, at the zone's wall time. The rooms they name are passed as assets, so each
 * is also marked on its row.
 */
export function toCalendarTasks({
  tasks,
  timeZone,
  dates,
  taskHref,
}: ToCalendarTasksInput): CalendarTaskEntry[] {
  return tasks.map((task) => {
    const { date, time } = toZonedParts({ instant: task.dueAt, timeZone });
    return {
      id: task.id,
      date: toIsoDate({ date }),
      start: `${String(time.hour).padStart(2, "0")}:${String(time.minute).padStart(2, "0")}`,
      label: task.typeName,
      timeLabel: dates.time({ instant: task.dueAt, timeZone }),
      done: task.done,
      overdue: task.overdue,
      ...(task.itemIds.length > 0 ? { assetIds: task.itemIds } : {}),
      href: taskHref({ id: task.id }),
    };
  });
}
