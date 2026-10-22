import { addDays, fromZonedParts, type PlainDate } from "@bibi/core/schemas";
import type { CalendarBlock } from "./calendar-blocks";
import { type CalendarParams, calendarDays, dayStart } from "./calendar-params";

/** One column: an hour of the day (day view) or a whole day (week view). */
export type CalendarColumn = { start: Date; end: Date; date: PlainDate; hour: number | null };

/** A block in the column where it starts; `offset` and `span` are fractions of the column. */
export type PlacedBlock = { block: CalendarBlock; offset: number; span: number };

type ColumnsInput = { params: CalendarParams; timeZone: string };

const HOURS = Array.from({ length: 24 }, (_, hour) => hour);

function hourColumns({ date, timeZone }: { date: PlainDate; timeZone: string }) {
  const at = ({ hour }: { hour: number }) =>
    fromZonedParts({ date, time: { hour, minute: 0, second: 0 }, timeZone });
  const next = dayStart({ date: addDays({ date, days: 1 }), timeZone });
  return HOURS.map((hour) => ({
    start: at({ hour }),
    end: hour < 23 ? at({ hour: hour + 1 }) : next,
    date,
    hour,
  }));
}

/** One whole-day column per shown day (one for the day view, Monday to Sunday for the week). */
export function dayColumns({ params, timeZone }: ColumnsInput): CalendarColumn[] {
  return calendarDays({ params }).map((date) => ({
    start: dayStart({ date, timeZone }),
    end: dayStart({ date: addDays({ date, days: 1 }), timeZone }),
    date,
    hour: null,
  }));
}

/** 24 hour columns for the day view, 7 day columns (Monday first) for the week view. */
export function calendarColumns({ params, timeZone }: ColumnsInput): CalendarColumn[] {
  if (params.view === "day") return hourColumns({ date: params.date, timeZone });
  return dayColumns({ params, timeZone });
}

export type PlaceBlocksInput = {
  columns: CalendarColumn[];
  blocks: CalendarBlock[];
  view: CalendarParams["view"];
};

const overlaps = ({ block, column }: { block: CalendarBlock; column: CalendarColumn }) =>
  block.startsAt < column.end && block.endsAt > column.start;

/** Day view: a block is clipped to the day and drawn from the hour it starts in. */
function placeInHours({ columns, blocks }: Omit<PlaceBlocksInput, "view">): PlacedBlock[][] {
  const placed: PlacedBlock[][] = columns.map(() => []);
  const first = columns[0];
  const last = columns[columns.length - 1];
  if (!first || !last) return placed;
  for (const block of blocks) {
    const start = Math.max(block.startsAt.getTime(), first.start.getTime());
    const end = Math.min(block.endsAt.getTime(), last.end.getTime());
    if (end <= start) continue;
    const index = columns.findIndex((column) => column.end.getTime() > start);
    const column = columns[index];
    if (!column) continue;
    const length = column.end.getTime() - column.start.getTime();
    const offset = (start - column.start.getTime()) / length;
    placed[index]?.push({ block, offset, span: (end - start) / length });
  }
  return placed;
}

/** The blocks of each column, earliest first. Week view: every day a block touches. */
export function placeBlocks({ columns, blocks, view }: PlaceBlocksInput): PlacedBlock[][] {
  const sorted = [...blocks].sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
  if (view === "day") return placeInHours({ columns, blocks: sorted });
  return columns.map((column) =>
    sorted
      .filter((block) => overlaps({ block, column }))
      .map((block) => ({ block, offset: 0, span: 1 })),
  );
}
