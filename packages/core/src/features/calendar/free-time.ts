import type { Interval } from "../../hours/within-hours";

/** How much of `a` lies inside `b`, in milliseconds. */
export function overlapMs({ a, b }: { a: Interval; b: Interval }): number {
  return Math.max(0, Math.min(a.to, b.to) - Math.max(a.from, b.from));
}

/** The intervals as one sorted set without overlaps. */
function merged({ intervals }: { intervals: readonly Interval[] }): Interval[] {
  const out: Interval[] = [];
  for (const next of [...intervals].sort((a, b) => a.from - b.from)) {
    const last = out[out.length - 1];
    if (last && next.from <= last.to) last.to = Math.max(last.to, next.to);
    else out.push({ ...next });
  }
  return out;
}

export type FreeTimeInput = { open: readonly Interval[]; taken: readonly Interval[] };

/** Open time not taken, in milliseconds: taken counts once where holds overlap. */
export function freeTime({ open, taken }: FreeTimeInput): number {
  const spans = merged({ intervals: open });
  const busy = merged({ intervals: taken });
  const openMs = spans.reduce((sum, span) => sum + (span.to - span.from), 0);
  const takenMs = spans.reduce(
    (sum, span) => sum + busy.reduce((inner, b) => inner + overlapMs({ a: b, b: span }), 0),
    0,
  );
  return openMs - takenMs;
}
