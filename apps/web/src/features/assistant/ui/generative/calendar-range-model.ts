import type { CalendarRangeWire } from "@bibi/ai";

export type CalendarBlockWire = CalendarRangeWire["blocks"][number];

export type CalendarDayGroup = {
  /** `YYYY-MM-DD` in the range's zone; only a grouping key. */
  key: string;
  /** Start of the day's first block, to format the day heading. */
  firstStart: string;
  blocks: CalendarBlockWire[];
};

export type GroupBlocksInput = {
  blocks: CalendarBlockWire[];
  timeZone: string;
  limit: number;
};

/** The first `limit` blocks grouped by day (in `timeZone`), plus how many were left out. */
export function groupBlocksByDay({ blocks, timeZone, limit }: GroupBlocksInput): {
  days: CalendarDayGroup[];
  hidden: number;
} {
  const dayKey = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const days: CalendarDayGroup[] = [];
  for (const block of blocks.slice(0, limit)) {
    const key = dayKey.format(new Date(block.startsAt));
    const last = days[days.length - 1];
    if (last && last.key === key) last.blocks.push(block);
    else days.push({ key, firstStart: block.startsAt, blocks: [block] });
  }
  return { days, hidden: Math.max(0, blocks.length - limit) };
}
