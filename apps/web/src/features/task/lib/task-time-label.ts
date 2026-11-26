import type { DateTimeFormat } from "@bibi/core/schemas";

type Instant = Date | string;

export type TaskTimeLabelInput = {
  task: { dueAt: Instant };
  dates: DateTimeFormat;
  /** With the weekday and date first ("Thu 27 Nov 14:00"); without, the time alone (today). */
  withDay?: boolean;
};

/** Time first (spec: tasks): the due time, with its weekday and date unless it is today's. */
export function taskTimeLabel({ task, dates, withDay = true }: TaskTimeLabelInput): string {
  const day = withDay
    ? `${dates.date({ instant: task.dueAt, year: false, weekday: "short" })} `
    : "";
  return `${day}${dates.time({ instant: task.dueAt })}`;
}
