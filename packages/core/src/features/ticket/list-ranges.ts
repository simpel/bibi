import { addDays, addMonths, type PlainDate } from "../../time/plain-date";

/** Inclusive bounds; a missing bound is open. */
export type NumberRange = { min?: number; max?: number };

/** Days from `from` (inclusive) until `until` (exclusive); a missing bound is open. */
export type DateRange = { from?: PlainDate; until?: PlainDate };

type Span<T> = { start: T; end: T };
type ReadSpan<T> = (input: { token: string }) => Span<T> | null;

const COMPARISON = /^(>=|<=|>|<)?(.+)$/;
const NUMBER = /^\d{1,9}$/;
const DATE = /^(\d{4})(?:-(\d{2})(?:-(\d{2}))?)?$/;

/** A whole number as the span [n, n + 1). */
const numberSpan: ReadSpan<number> = ({ token }) =>
  NUMBER.test(token) ? { start: Number(token), end: Number(token) + 1 } : null;

/** `2026`, `2026-12` or `2026-12-24` as the days it covers. */
const dateSpan: ReadSpan<PlainDate> = ({ token }) => {
  const [, year, month, day] = DATE.exec(token) ?? [];
  if (!year) return null;
  const start = { year: Number(year), month: Number(month ?? 1), day: Number(day ?? 1) };
  if (start.month < 1 || start.month > 12 || start.day < 1 || start.day > 31) return null;
  if (day) return { start, end: addDays({ date: start, days: 1 }) };
  return { start, end: addMonths({ date: start, months: month ? 1 : 12 }) };
};

/**
 * GitHub's range syntax over spans: `x` is all of x, `>x` after it, `>=x` from it, `<x` before it,
 * `<=x` up to its end, `a..b` from a through b (`*` leaves a side open). Null when unreadable.
 */
function spanRange<T>({ raw, read }: { raw: string; read: ReadSpan<T> }) {
  const [low, high, extra] = raw.split("..");
  if (high !== undefined) {
    if (extra !== undefined) return null;
    const a = low === "*" ? undefined : read({ token: low ?? "" });
    const b = high === "*" ? undefined : read({ token: high });
    if (a === null || b === null) return null;
    return { from: a?.start, until: b?.end };
  }
  const [, op, token = ""] = COMPARISON.exec(raw) ?? [];
  const span = read({ token });
  if (!span) return null;
  if (op === ">") return { from: span.end };
  if (op === ">=") return { from: span.start };
  if (op === "<") return { until: span.start };
  if (op === "<=") return { until: span.end };
  return { from: span.start, until: span.end };
}

/** A whole-number range (`50`, `>50`, `10..20`, `<=10`), bounds inclusive. */
export function numberRange({ raw }: { raw: string }): NumberRange | null {
  const range = spanRange({ raw, read: numberSpan });
  if (!range) return null;
  return {
    ...(range.from !== undefined ? { min: range.from } : {}),
    ...(range.until !== undefined ? { max: range.until - 1 } : {}),
  };
}

/** A range of days (`2026-12`, `>2026-12-01`, `2026-11-01..2026-11-30`). */
export function dateRange({ raw }: { raw: string }): DateRange | null {
  const range = spanRange({ raw, read: dateSpan });
  if (!range) return null;
  return {
    ...(range.from ? { from: range.from } : {}),
    ...(range.until ? { until: range.until } : {}),
  };
}
