/**
 * A line the planning module evaluates before anything is written (ADR 0081): from a package's
 * template lines or from a draft. Untimed when it has no times; a null quantity follows the
 * headcount (ADR 0052).
 */
export type PlannedLine = {
  entityTypeId: string;
  name: string;
  itemId?: string | null;
  setupId?: string | null;
  startsAt?: Date | null;
  endsAt?: Date | null;
  quantity?: number | null;
  unitPriceMinor?: number | null;
  discountPercent?: number | null;
};

export type TimedPlannedLine = PlannedLine & { startsAt: Date; endsAt: Date };

/** A period, start inclusive and end exclusive. */
export type Period = { startsAt: Date; endsAt: Date };

/** The line with both times, or null for an untimed one. */
export function asTimed({ line }: { line: PlannedLine }): TimedPlannedLine | null {
  const { startsAt, endsAt } = line;
  return startsAt && endsAt ? { ...line, startsAt, endsAt } : null;
}

export type OverlapsInput = { a: Period; b: Period };

/** Two half-open periods share time. */
export const overlaps = ({ a, b }: OverlapsInput): boolean =>
  a.startsAt < b.endsAt && b.startsAt < a.endsAt;

export type ShiftInput = { period: Period; ms: number };

/** The period moved by `ms` milliseconds. */
export const shift = ({ period, ms }: ShiftInput): Period => ({
  startsAt: new Date(period.startsAt.getTime() + ms),
  endsAt: new Date(period.endsAt.getTime() + ms),
});
