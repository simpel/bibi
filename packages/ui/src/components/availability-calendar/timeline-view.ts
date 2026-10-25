import { addDays, daysBetween } from "./calendar-dates";
import type { CalendarWindow } from "./calendar-types";
import { clampDayPx, fitDayPx, pitchOf } from "./timeline-scale";

/** The loaded days and the zoom. The track scrolls inside them and grows at either end. */
export type TimelineView = { start: string; count: number; dayPx: number };

/** A view and where the track should be scrolled to once it renders. */
export type Placement = { view: TimelineView; scroll: number };

/** Days loaded ahead of the edge you scroll towards. */
export const CHUNK = 28;

/** Show `days` days from `date`, fitted to the track; reload around `date` if it is far off. */
export function jumpView({
  view,
  date,
  days,
  trackPx,
  hours,
  floor = 0,
  dayPx: keep,
}: {
  view: TimelineView;
  date: string;
  days: number;
  trackPx: number;
  hours: CalendarWindow;
  /** The narrowest day allowed, from `floorDayPx`: a phone then scrolls instead. */
  floor?: number;
  /** Keep this zoom instead of fitting: prev, next and today move without zooming. */
  dayPx?: number;
}): Placement {
  const fit = Math.max(fitDayPx({ days, trackPx }), floor);
  const dayPx = clampDayPx({ dayPx: keep ?? fit, hours });
  const index = daysBetween({ from: view.start, to: date });
  const inside = index >= 0 && index + days <= view.count;
  const next = inside
    ? { ...view, dayPx }
    : { start: addDays({ date, days: -CHUNK }), count: CHUNK * 2 + days, dayPx };
  const at = daysBetween({ from: next.start, to: date });
  return { view: next, scroll: at * pitchOf({ dayPx }) };
}

/** Zoom by `factor`, keeping the moment under the pointer (`x` into the track) where it is. */
export function zoomView({
  view,
  scroll,
  factor,
  x,
  hours,
}: {
  view: TimelineView;
  scroll: number;
  factor: number;
  x: number;
  hours: CalendarWindow;
}): Placement {
  const dayPx = clampDayPx({ dayPx: view.dayPx * factor, hours });
  const days = (scroll + x) / pitchOf({ dayPx: view.dayPx });
  return { view: { ...view, dayPx }, scroll: days * pitchOf({ dayPx }) - x };
}

/** Near either end, load another chunk there; prepending shifts the scroll by what was added. */
export function extendView({
  view,
  scroll,
  trackPx,
}: {
  view: TimelineView;
  scroll: number;
  trackPx: number;
}): Placement | null {
  const pitch = pitchOf({ dayPx: view.dayPx });
  if (scroll < trackPx) {
    const start = addDays({ date: view.start, days: -CHUNK });
    return { view: { ...view, start, count: view.count + CHUNK }, scroll: scroll + CHUNK * pitch };
  }
  if (scroll + trackPx * 2 > view.count * pitch) {
    return { view: { ...view, count: view.count + CHUNK }, scroll };
  }
  return null;
}

/** Indexes of the days to draw: what is on screen plus one either side. */
export function drawnDays({
  view,
  scroll,
  trackPx,
}: {
  view: TimelineView;
  scroll: number;
  trackPx: number;
}) {
  const pitch = pitchOf({ dayPx: view.dayPx });
  const first = Math.max(0, Math.floor(scroll / pitch) - 1);
  const last = Math.min(view.count - 1, Math.ceil((scroll + trackPx) / pitch) + 1);
  return Array.from({ length: Math.max(0, last - first + 1) }, (_, index) => first + index);
}

/** The days mostly on screen: what the toolbar names and prev/next steps by. */
export function shownDays({
  view,
  scroll,
  trackPx,
}: {
  view: TimelineView;
  scroll: number;
  trackPx: number;
}) {
  const pitch = pitchOf({ dayPx: view.dayPx });
  const first = Math.round(scroll / pitch);
  const count = Math.max(1, Math.round((scroll + trackPx) / pitch) - first);
  return { from: addDays({ date: view.start, days: first }), count };
}
