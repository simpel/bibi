import type { CalendarBlockDto } from "@bibi/core/schemas";
import { addDays, type PlainDate, toZonedParts } from "@bibi/core/schemas";
import { dayStart } from "./calendar-params";

/** The views drawn as a space × time grid; month and list have their own components. */
export type GridView = "day" | "week";

/** One column: an hour of the day (day view) or a whole day (week view). */
export type CalendarColumn = { start: Date; end: Date; date: PlainDate; hour: number | null };

/** A block in the column where it starts; `offset` and `span` are fractions of the column. */
export type PlacedBlock = { block: CalendarBlockDto; offset: number; span: number };

type DaysInput = { days: PlainDate[]; timeZone: string };

const HOUR_MS = 3_600_000;

/**
 * The hours of one day from its instants (ADR 0064 decision 8): midnight to the next midnight in
 * the zone, so a DST day has 23 or 25 columns and the repeated autumn hour shows twice.
 */
function hourColumns({ date, timeZone }: { date: PlainDate; timeZone: string }) {
  const start = dayStart({ date, timeZone }).getTime();
  const end = dayStart({ date: addDays({ date, days: 1 }), timeZone }).getTime();
  return Array.from({ length: Math.ceil((end - start) / HOUR_MS) }, (_, index) => {
    const at = new Date(start + index * HOUR_MS);
    const hour = toZonedParts({ instant: at, timeZone }).time.hour;
    return { start: at, end: new Date(Math.min(at.getTime() + HOUR_MS, end)), date, hour };
  });
}

/** One whole-day column per shown day, each from midnight to the next midnight in the zone. */
export function dayColumns({ days, timeZone }: DaysInput): CalendarColumn[] {
  return days.map((date) => ({
    start: dayStart({ date, timeZone }),
    end: dayStart({ date: addDays({ date, days: 1 }), timeZone }),
    date,
    hour: null,
  }));
}

/** The day's hour columns for the day view, one column per day for the week view. */
export function calendarColumns({ view, days, timeZone }: DaysInput & { view: GridView }) {
  const [date] = days;
  if (view === "day" && date) return hourColumns({ date, timeZone });
  return dayColumns({ days, timeZone });
}

export type PlaceBlocksInput = {
  columns: CalendarColumn[];
  blocks: CalendarBlockDto[];
  view: GridView;
};

const overlaps = ({ block, column }: { block: CalendarBlockDto; column: CalendarColumn }) =>
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
