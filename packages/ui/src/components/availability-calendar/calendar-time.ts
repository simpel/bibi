import type { CalendarAudience, CalendarLine, CalendarWindow } from "./calendar-types";

export function toMinutes({ time }: { time: string }): number {
  const [hours = 0, minutes = 0] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

/** 24-hour wall clock, "08:30". */
export function formatMinutes({ minutes }: { minutes: number }): string {
  const hours = String(Math.floor(minutes / 60)).padStart(2, "0");
  return `${hours}:${String(minutes % 60).padStart(2, "0")}`;
}

export function durationLabel({ minutes }: { minutes: number }): string {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest} min`;
  return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`;
}

/** What the audience may see: externally, no staffing or equipment allocations. */
export function visibleLines({
  lines,
  audience,
}: {
  lines: readonly CalendarLine[];
  audience: CalendarAudience;
}): CalendarLine[] {
  return lines.filter((line) => audience === "internal" || !line.internalOnly);
}

/** The line's footprint: booking time, plus setup and teardown for staff. */
export function footprint({ line, audience }: { line: CalendarLine; audience: CalendarAudience }) {
  const start = toMinutes({ time: line.start });
  const end = toMinutes({ time: line.end });
  if (audience === "external") return { from: start, to: end };
  return { from: start - line.setupMinutes, to: end + line.teardownMinutes };
}

/**
 * The axis fits the content rounded out to whole hours, never 00–24: an empty night is noise.
 * A real build also widens it to the venue's opening hours.
 */
export function axisWindow({
  lines,
  audience,
}: {
  lines: readonly CalendarLine[];
  audience: CalendarAudience;
}): CalendarWindow {
  const spans = lines.map((line) => footprint({ line, audience }));
  const from = Math.min(...spans.map((span) => span.from));
  const to = Math.max(...spans.map((span) => span.to));
  return { from: Math.floor(from / 60) * 60, to: Math.ceil(to / 60) * 60 };
}

export function hoursIn({ window }: { window: CalendarWindow }): number[] {
  const count = (window.to - window.from) / 60 + 1;
  return Array.from({ length: count }, (_, index) => window.from / 60 + index);
}

/** Offset and size of [from, to] inside the window, in percent. */
export function percentIn({ window, from, to }: CalendarWindow & { window: CalendarWindow }) {
  const range = window.to - window.from;
  return { offset: ((from - window.from) / range) * 100, size: ((to - from) / range) * 100 };
}
