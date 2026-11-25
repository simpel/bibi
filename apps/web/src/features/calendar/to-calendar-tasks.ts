import {
  type CalendarTask,
  type DateTimeFormat,
  toIsoDate,
  toZonedParts,
} from "@bibi/core/schemas";
import type { CalendarTaskEntry } from "@bibi/ui";
import { uiTaskShape } from "../task/lib/task-time-label";

const clock = ({ instant, timeZone }: { instant: Date; timeZone: string }) => {
  const { time } = toZonedParts({ instant, timeZone });
  return `${String(time.hour).padStart(2, "0")}:${String(time.minute).padStart(2, "0")}`;
};

const dayOf = ({ instant, timeZone }: { instant: Date; timeZone: string }) =>
  toIsoDate({ date: toZonedParts({ instant, timeZone }).date });

export type ToCalendarTasksInput = {
  tasks: readonly CalendarTask[];
  /** The zone the calendar draws in (ADR 0064 decision 12: the organization's). */
  timeZone: string;
  dates: DateTimeFormat;
  /** Where a task opens: its own page. */
  taskHref: (input: { id: string }) => string;
};

/**
 * `calendar.range` tasks as the calendar's task marks (spec: tasks): on the day they start, in
 * the zone's wall time; a meeting that runs past midnight ends at the day's end. The item it
 * names is passed as its asset, so it is also outlined on that row.
 */
export function toCalendarTasks({
  tasks,
  timeZone,
  dates,
  taskHref,
}: ToCalendarTasksInput): CalendarTaskEntry[] {
  return tasks.map((task) => {
    const date = dayOf({ instant: task.startsAt, timeZone });
    const sameDay = task.endsAt && dayOf({ instant: task.endsAt, timeZone }) === date;
    const end = task.endsAt
      ? sameDay
        ? clock({ instant: task.endsAt, timeZone })
        : "24:00"
      : undefined;
    const timeLabel = task.endsAt
      ? dates.timeRange({ start: task.startsAt, end: task.endsAt, timeZone })
      : dates.time({ instant: task.startsAt, timeZone });
    return {
      id: task.id,
      shape: uiTaskShape({ shape: task.shape }),
      date,
      start: clock({ instant: task.startsAt, timeZone }),
      ...(end ? { end } : {}),
      label: task.typeName,
      timeLabel,
      done: task.done,
      overdue: task.overdue,
      ...(task.itemId ? { itemId: task.itemId, assetId: task.itemId } : {}),
      href: taskHref({ id: task.id }),
    };
  });
}
