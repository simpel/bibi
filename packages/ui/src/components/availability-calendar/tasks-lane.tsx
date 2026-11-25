"use client";

import { cn } from "../../lib/cn";
import { DayColumn, ROW_GRID } from "./availability-row";
import { addDays } from "./calendar-dates";
import { useOptionalCalendarLabels } from "./calendar-labels";
import type { CalendarTaskEntry } from "./calendar-types";
import { LANE_REM } from "./day-track";
import { DayTasks, taskLanesOf, tasksByDate } from "./task-marks";
import type { TimelineFrame } from "./timeline-scale";

export type TasksLaneProps = { tasks: readonly CalendarTaskEntry[]; frame: TimelineFrame };

/** The first row: the organization's tasks across the days, above every asset. */
export function TasksLane({ tasks, frame }: TasksLaneProps) {
  const labels = useOptionalCalendarLabels();
  const days = tasksByDate({ tasks });
  const lanes = [...days.values()].map((day) => taskLanesOf({ tasks: day }).count);
  return (
    <div data-slot="calendar-tasks-lane" className={cn(ROW_GRID, "border-t")}>
      <div className="sticky left-0 z-30 flex min-w-0 items-center border-r bg-card py-1.5 pr-2 pl-[var(--gutter,0px)] @2xl:pr-3">
        <span className="truncate text-sm font-medium">{labels?.tasks}</span>
      </div>
      <div
        className="relative bg-muted"
        style={{ height: `${Math.max(1, ...lanes) * LANE_REM + 0.75}rem`, width: frame.width }}
      >
        {frame.drawn.map((index) => {
          const date = addDays({ date: frame.start, days: index });
          return (
            <DayColumn key={date} index={index} frame={frame}>
              <DayTasks tasks={days.get(date) ?? []} window={frame.hours} />
            </DayColumn>
          );
        })}
      </div>
    </div>
  );
}
