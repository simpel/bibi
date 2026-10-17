import type { Row } from "@tanstack/react-table";

function rank({ value }: { value: unknown }): number {
  if (value === null || value === undefined || value === "") return 1;
  return 0;
}

function toComparable({ value }: { value: unknown }): string | number {
  if (typeof value === "number") return value;
  if (typeof value === "boolean") return Number(value);
  if (value instanceof Date) return value.getTime();
  return String(value);
}

/**
 * Compares two cell values: numbers numerically, dates by time, strings with `localeCompare`
 * (numeric aware, case and accent insensitive). Empty values sort last when ascending.
 */
export function compareValues({ a, b }: { a: unknown; b: unknown }): number {
  const rankDiff = rank({ value: a }) - rank({ value: b });
  if (rankDiff !== 0 || rank({ value: a }) === 1) return rankDiff;
  const left = toComparable({ value: a });
  const right = toComparable({ value: b });
  if (typeof left === "number" && typeof right === "number") return left - right;
  return String(left).localeCompare(String(right), undefined, {
    numeric: true,
    sensitivity: "base",
  });
}

export type CompareRowsInput<TData> = { rowA: Row<TData>; rowB: Row<TData>; columnId: string };

/**
 * Default `sortingFn` of every data column (see `compareValues`). The sort is stable: TanStack
 * falls back to the original row index on ties. To sort by a display value, give the column an
 * `accessorFn`.
 */
export function compareRows<TData>({ rowA, rowB, columnId }: CompareRowsInput<TData>): number {
  return compareValues({ a: rowA.getValue(columnId), b: rowB.getValue(columnId) });
}
