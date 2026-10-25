import { daysInMonth, type FormatDate, startOfMonth, startOfWeek } from "./calendar-dates";
import type { CalendarWindow } from "./calendar-types";

/**
 * The timeline is a row of day columns. Only open hours get width; the night between two days is
 * a thin seam. Zoom is one number, the width of a day, and that width picks how a day is drawn.
 */
export type TimelineLevel = "day" | "week" | "month";

/** Hours: blocks with times and hour labels. Blocks: thin blocks. Cells: one occupancy cell. */
export type TimelineDetail = "hours" | "blocks" | "cells";

/** Below this a block cannot hold a name: the day becomes a cell. */
const BLOCKS_MIN_DAY_PX = 72;
/** From this many pixels per hour, every hour gets a label. */
const HOURS_MIN_HOUR_PX = 36;
const MIN_DAY_PX = 20;
/** A phone's week: about two days on screen, wide enough that blocks can hold a name. */
const WEEK_MIN_DAY_PX = 120;
const MAX_HOUR_PX = 160;

const hoursOf = ({ hours }: { hours: CalendarWindow }) => (hours.to - hours.from) / 60;

export function detailOf({ dayPx, hours }: { dayPx: number; hours: CalendarWindow }) {
  if (dayPx / hoursOf({ hours }) >= HOURS_MIN_HOUR_PX) return "hours" satisfies TimelineDetail;
  return dayPx >= BLOCKS_MIN_DAY_PX ? "blocks" : ("cells" satisfies TimelineDetail);
}

/** The night between two days: wide enough to read as a break, never as time. */
export function seamOf({ dayPx }: { dayPx: number }): number {
  return dayPx >= BLOCKS_MIN_DAY_PX ? 8 : 2;
}

/** From one day's start to the next. */
export function pitchOf({ dayPx }: { dayPx: number }): number {
  return dayPx + seamOf({ dayPx });
}

export function clampDayPx({ dayPx, hours }: { dayPx: number; hours: CalendarWindow }): number {
  return Math.min(Math.max(dayPx, MIN_DAY_PX), hoursOf({ hours }) * MAX_HOUR_PX);
}

/** The day width that fits `days` days into the visible track. */
export function fitDayPx({ days, trackPx }: { days: number; trackPx: number }): number {
  const wide = trackPx / days - 8;
  return wide >= BLOCKS_MIN_DAY_PX ? wide : Math.max(trackPx / days - 2, MIN_DAY_PX);
}

/**
 * The narrowest day a level may fit to, so a phone keeps the level's detail and scrolls instead:
 * a day keeps hour labels, a week keeps named blocks.
 */
export function floorDayPx({ level, hours }: { level: TimelineLevel; hours: CalendarWindow }) {
  if (level === "day") return hoursOf({ hours }) * HOURS_MIN_HOUR_PX;
  return level === "week" ? WEEK_MIN_DAY_PX : MIN_DAY_PX;
}

/** Where a level starts around a date: the day itself, its Monday, or the 1st. */
export function anchorOf({ level, date }: { level: TimelineLevel; date: string }): string {
  if (level === "day") return date;
  return level === "week" ? startOfWeek({ date }) : startOfMonth({ date });
}

export function levelDays({ level, date }: { level: TimelineLevel; date: string }): number {
  if (level === "day") return 1;
  return level === "week" ? 7 : daysInMonth({ date });
}

/** The level whose fit is nearest the current zoom, so the tabs follow a pinch. */
export function nearestLevel({
  dayPx,
  trackPx,
  date,
  hours,
}: {
  dayPx: number;
  trackPx: number;
  date: string;
  hours: CalendarWindow;
}): TimelineLevel {
  const levels: TimelineLevel[] = ["day", "week", "month"];
  const widthOf = ({ level }: { level: TimelineLevel }) =>
    Math.max(fitDayPx({ days: levelDays({ level, date }), trackPx }), floorDayPx({ level, hours }));
  const distance = ({ level }: { level: TimelineLevel }) =>
    Math.abs(Math.log(widthOf({ level }) / dayPx));
  return levels.reduce((best, level) =>
    distance({ level }) < distance({ level: best }) ? level : best,
  );
}

/** What a row or the header needs to place its days on the track. */
export type TimelineFrame = {
  /** Key of the first loaded day: index 0. */
  start: string;
  /** Indexes of the days to draw. */
  drawn: readonly number[];
  dayPx: number;
  pitch: number;
  /** Width of all loaded days. */
  width: number;
  detail: TimelineDetail;
  hours: CalendarWindow;
  today: string;
  locale: string;
  /** The user's date format, for every date written out. */
  formatDate: FormatDate;
  /** Zooms in to one day. */
  onDrill: (input: { date: string }) => void;
};
