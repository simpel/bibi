import type { TaskWire } from "@bibi/ai";
import type { DateTimeFormat } from "@bibi/core/schemas";

export type TaskTimeLabelInput = {
  format: DateTimeFormat;
  task: Pick<TaskWire, "shape" | "startsAt" | "endsAt">;
};

/** A meeting's span ("27 Aug 2026, 14:00 – 15:00") or a deadline's due time, time first. */
export function taskTimeLabel({ format, task }: TaskTimeLabelInput): string {
  return task.shape === "MEETING" && task.endsAt
    ? format.dateTimeRange({ start: task.startsAt, end: task.endsAt, weekday: "short" })
    : format.dateTime({ instant: task.startsAt, weekday: "short" });
}
