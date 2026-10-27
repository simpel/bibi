import { footprint } from "./calendar-time";
import type { CalendarLine, CalendarWindow } from "./calendar-types";

/**
 * Where two lines on one asset take the same time, buffers included: a double-booked projector,
 * two soft holds on one room, a teardown running into the next setup. Merged into stretches.
 */
export function clashesOf({ lines }: { lines: readonly CalendarLine[] }): CalendarWindow[] {
  const spans = lines.map((line) => footprint({ line, audience: "internal" }));
  const overlaps = spans.flatMap((a, index) =>
    spans
      .slice(index + 1)
      .map((b) => ({ from: Math.max(a.from, b.from), to: Math.min(a.to, b.to) }))
      .filter((overlap) => overlap.to > overlap.from),
  );
  return overlaps
    .sort((a, b) => a.from - b.from)
    .reduce<CalendarWindow[]>((merged, next) => {
      const last = merged.at(-1);
      if (last && next.from <= last.to) last.to = Math.max(last.to, next.to);
      else merged.push({ ...next });
      return merged;
    }, []);
}

/** Free from `from` until the next line's footprint starts, capped at an hour. Null if taken. */
export function freeSlotAt({
  lines,
  from,
  window,
}: {
  lines: readonly CalendarLine[];
  from: number;
  window: CalendarWindow;
}): CalendarWindow | null {
  const spans = lines.map((line) => footprint({ line, audience: "internal" }));
  if (spans.some((span) => span.from <= from && span.to > from)) return null;
  const next = Math.min(window.to, ...spans.map((span) => span.from).filter((at) => at > from));
  const to = Math.min(from + 60, next);
  return to - from >= 15 ? { from, to } : null;
}

/**
 * Overlapping lines on one asset get their own sub-lane, so a clash shows both bookings in full
 * instead of one over the other. Greedy by start, buffers included.
 */
export function lanesOf({ lines }: { lines: readonly CalendarLine[] }) {
  const ends: number[] = [];
  const lane = new Map<string, number>();
  const sorted = [...lines].sort(
    (a, b) =>
      footprint({ line: a, audience: "internal" }).from -
      footprint({ line: b, audience: "internal" }).from,
  );
  for (const line of sorted) {
    const { from, to } = footprint({ line, audience: "internal" });
    const free = ends.findIndex((end) => end <= from);
    const index = free === -1 ? ends.length : free;
    ends[index] = to;
    lane.set(line.id, index);
  }
  return { lane, count: Math.max(1, ends.length) };
}

/** The other lines on this asset that take some of `line`'s time, each with the stretch shared. */
export function clashesWith<Line extends CalendarLine>({
  line,
  lines,
}: {
  line: Line;
  lines: readonly Line[];
}) {
  const own = footprint({ line, audience: "internal" });
  return lines.flatMap((other) => {
    if (other.id === line.id) return [];
    const span = footprint({ line: other, audience: "internal" });
    const from = Math.max(own.from, span.from);
    const to = Math.min(own.to, span.to);
    return to > from ? [{ line: other, from, to }] : [];
  });
}
