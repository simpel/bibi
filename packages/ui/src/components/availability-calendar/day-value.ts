/**
 * What one asset's day is worth, excl. VAT, in whole units of `currency`: booked (hard holds),
 * prebooked (soft holds) and still open (free time at its hourly price). Null = not visible.
 */
export type CalendarDayValue = {
  assetId: string;
  /** The day, "YYYY-MM-DD" (ADR 0064: a code-level key only). */
  date: string;
  booked: number | null;
  prebooked: number | null;
  open: number | null;
  currency: string;
};

/** A day's value across the assets shown. */
export type DayTotal = Pick<CalendarDayValue, "booked" | "prebooked" | "open" | "currency">;

const plus = ({ a, b }: { a: number | null; b: number | null }) =>
  a === null && b === null ? null : (a ?? 0) + (b ?? 0);

/** The values of the shown assets summed per day key. */
export function dayTotals({
  values,
  assetIds,
}: {
  values: readonly CalendarDayValue[];
  assetIds: ReadonlySet<string>;
}): Map<string, DayTotal> {
  const totals = new Map<string, DayTotal>();
  for (const value of values) {
    if (!assetIds.has(value.assetId)) continue;
    const own = totals.get(value.date);
    totals.set(
      value.date,
      own
        ? {
            booked: plus({ a: own.booked, b: value.booked }),
            prebooked: plus({ a: own.prebooked, b: value.prebooked }),
            open: plus({ a: own.open, b: value.open }),
            currency: own.currency,
          }
        : { ...value },
    );
  }
  return totals;
}

/** The total of some days, e.g. a week's, from those of them that are loaded. */
export function totalOf({
  totals,
  dates,
}: {
  totals: ReadonlyMap<string, DayTotal>;
  dates: readonly string[];
}): DayTotal | undefined {
  let sum: DayTotal | undefined;
  for (const date of dates) {
    const total = totals.get(date);
    if (!total) continue;
    sum = sum
      ? {
          booked: plus({ a: sum.booked, b: total.booked }),
          prebooked: plus({ a: sum.prebooked, b: total.prebooked }),
          open: plus({ a: sum.open, b: total.open }),
          currency: sum.currency,
        }
      : { ...total };
  }
  return sum;
}

/** How much of what the day could sell is sold: booked, and booked with prebooked, 0–1. */
export function fillOf({ total }: { total: DayTotal }) {
  const sold = total.booked ?? 0;
  const held = sold + (total.prebooked ?? 0);
  const whole = held + (total.open ?? 0);
  return whole === 0 ? null : { booked: sold / whole, held: held / whole };
}

/** Each part's share of the day's whole, 0–1, for the bar. */
export function sharesOf({ total }: { total: DayTotal }) {
  const parts = [total.booked ?? 0, total.prebooked ?? 0, total.open ?? 0];
  const sum = parts.reduce((a, b) => a + b, 0) || 1;
  const [booked = 0, prebooked = 0, open = 0] = parts.map((part) => part / sum);
  return { booked, prebooked, open };
}
