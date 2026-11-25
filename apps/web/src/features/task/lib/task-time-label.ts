import type { TaskShape as CoreShape, DateTimeFormat } from "@bibi/core/schemas";
import type { TaskShape } from "@bibi/ui";

type Instant = Date | string;

export type TaskTimeLabelInput = {
  task: { startsAt: Instant; endsAt: Instant | null };
  dates: DateTimeFormat;
  /** With the weekday and date first ("Thu 27 Nov 14:00"); without, the time alone (today). */
  withDay?: boolean;
};

/** Time first (spec: tasks): a meeting's span, a deadline's due time. */
export function taskTimeLabel({ task, dates, withDay = true }: TaskTimeLabelInput): string {
  const day = withDay
    ? `${dates.date({ instant: task.startsAt, year: false, weekday: "short" })} `
    : "";
  const time = task.endsAt
    ? dates.timeRange({ start: task.startsAt, end: task.endsAt })
    : dates.time({ instant: task.startsAt });
  return `${day}${time}`;
}

/** Core's shape as `@bibi/ui`'s task components name it. */
export function uiTaskShape({ shape }: { shape: CoreShape }): TaskShape {
  return shape === "MEETING" ? "meeting" : "deadline";
}
