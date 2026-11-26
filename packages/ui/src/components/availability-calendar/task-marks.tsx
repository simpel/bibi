import type { CSSProperties } from "react";
import { TaskCalendarMarker } from "../task-calendar-marker/task-calendar-marker";
import { percentIn, toMinutes } from "./calendar-time";
import type { CalendarTaskEntry, CalendarWindow } from "./calendar-types";
import { LANE_REM } from "./day-track";

/** Room a point takes on its lane, so its icon and words do not run into the next task. */
const POINT_MINUTES = 60;

/** Where a task's marker sits on a day's track: a point at its due time. */
function extentOf({ task }: { task: CalendarTaskEntry }) {
  const from = toMinutes({ time: task.start });
  return { from, to: from + POINT_MINUTES };
}

export type TaskPlacementInput = { task: CalendarTaskEntry; window: CalendarWindow };

/** Left and width in percent of the day's track; a task outside the hours sits at the edge. */
export function taskPlacement({ task, window }: TaskPlacementInput): CSSProperties {
  const { offset, size } = percentIn({ window, ...extentOf({ task }) });
  const left = Math.min(Math.max(offset, 0), 98);
  const width = Math.max(Math.min(size + Math.min(offset, 0), 100 - left), 2);
  return { left: `${left}%`, width: `${width}%` };
}

/** One sub-lane per overlapping task on a day, the earliest first. */
export function taskLanesOf({ tasks }: { tasks: readonly CalendarTaskEntry[] }) {
  const ends: number[] = [];
  const lane = new Map<string, number>();
  const sorted = [...tasks].sort(
    (a, b) => toMinutes({ time: a.start }) - toMinutes({ time: b.start }),
  );
  for (const task of sorted) {
    const { from, to } = extentOf({ task });
    const free = ends.findIndex((end) => end <= from);
    const index = free === -1 ? ends.length : free;
    ends[index] = to;
    lane.set(task.id, index);
  }
  return { lane, count: Math.max(1, ends.length) };
}

/** Tasks by their day key. */
export function tasksByDate({ tasks }: { tasks: readonly CalendarTaskEntry[] }) {
  const days = new Map<string, CalendarTaskEntry[]>();
  for (const task of tasks) days.set(task.date, [...(days.get(task.date) ?? []), task]);
  return days;
}

/** A day's tasks, each on its sub-lane, outlined and unfilled. */
export function DayTasks({
  tasks,
  window,
}: {
  tasks: readonly CalendarTaskEntry[];
  window: CalendarWindow;
}) {
  const { lane } = taskLanesOf({ tasks });
  return tasks.map((task) => (
    <TaskCalendarMarker
      key={task.id}
      label={task.label}
      timeLabel={task.timeLabel}
      done={task.done}
      overdue={task.overdue}
      href={task.href}
      onClick={task.onClick}
      className="absolute z-10 h-7"
      style={{
        ...taskPlacement({ task, window }),
        top: `${(lane.get(task.id) ?? 0) * LANE_REM + 0.375}rem`,
      }}
    />
  ));
}

/** A task's echo on its room's row: only the outline, over the bookings, never in the way. */
export function AssetTaskMarks({
  tasks,
  window,
}: {
  tasks: readonly CalendarTaskEntry[];
  window: CalendarWindow;
}) {
  return tasks.map((task) => (
    <TaskCalendarMarker
      key={task.id}
      bare
      label={task.label}
      timeLabel={task.timeLabel}
      className="absolute inset-y-1 z-20"
      style={{ left: taskPlacement({ task, window }).left, width: 0 }}
    />
  ));
}
