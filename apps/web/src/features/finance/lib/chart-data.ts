import type {
  BookedAheadMonth,
  FinanceAging,
  FinanceMonth,
  NumberFormat,
  RevenueByType,
} from "@bibi/core/schemas";
import type { ChartPoint } from "@bibi/ui";

/** The viewer's amounts and the month names; everything the builders need to write text. */
export type ChartFormat = {
  numbers: NumberFormat;
  currency: string;
  monthLabel: (input: { month: string }) => string;
};

type PointInput = Pick<ChartFormat, "numbers" | "currency"> & { minor: number };

const point = ({ numbers, currency, minor }: PointInput): ChartPoint => ({
  value: minor,
  text: numbers.money({ minor, currency }),
});

export type MonthlyInput = { monthly: FinanceMonth[] } & ChartFormat;

export function monthlyRows({ monthly, monthLabel, ...format }: MonthlyInput) {
  return monthly.map((row) => ({
    label: monthLabel({ month: row.month }),
    invoiced: point({ ...format, minor: row.invoicedExclVatMinor }),
    received: point({ ...format, minor: row.receivedMinor }),
  }));
}

export type AgingLabels = {
  notDue: string;
  overdue1to30: string;
  overdue31to60: string;
  overdue61Plus: string;
};

export type AgingInput = { aging: FinanceAging; labels: AgingLabels } & Omit<
  ChartFormat,
  "monthLabel"
>;

export function agingRows({ aging, labels, ...format }: AgingInput) {
  return [
    { label: labels.notDue, minor: aging.notDueMinor },
    { label: labels.overdue1to30, minor: aging.overdue1to30Minor },
    { label: labels.overdue31to60, minor: aging.overdue31to60Minor },
    { label: labels.overdue61Plus, minor: aging.overdue61PlusMinor },
  ].map(({ label, minor }) => ({ label, point: point({ ...format, minor }) }));
}

export type BookedAheadInput = { bookedAhead: BookedAheadMonth[] } & ChartFormat;

export function bookedAheadRows({ bookedAhead, monthLabel, ...format }: BookedAheadInput) {
  return bookedAhead.map((row) => ({
    label: monthLabel({ month: row.month }),
    point: point({ ...format, minor: row.valueExclVatMinor }),
  }));
}

export type TypeInput = { revenueByType: RevenueByType[]; withoutType: string } & Omit<
  ChartFormat,
  "monthLabel"
>;

export function typeRows({ revenueByType, withoutType, ...format }: TypeInput) {
  return revenueByType.map((row) => ({
    label: row.name ?? withoutType,
    point: point({ ...format, minor: row.invoicedExclVatMinor }),
  }));
}

/** True when any amount is not zero; a chart of only zeros is not shown (no filler data). */
export const hasMoney = ({ minors }: { minors: readonly number[] }) =>
  minors.some((minor) => minor !== 0);

/** The months, or none when every month is zero; `null` (no access) passes through. */
export function monthsWithMoney({ monthly }: { monthly: FinanceMonth[] | null }) {
  if (!monthly) return null;
  const minors = monthly.flatMap((row) => [row.invoicedExclVatMinor, row.receivedMinor]);
  return hasMoney({ minors }) ? monthly : [];
}

/** The aging as one row, or none when nothing is open; `null` (no access) passes through. */
export function agingWithMoney({ aging }: { aging: FinanceAging | null }) {
  if (!aging) return null;
  const { notDueMinor, overdue1to30Minor, overdue31to60Minor, overdue61PlusMinor } = aging;
  const minors = [notDueMinor, overdue1to30Minor, overdue31to60Minor, overdue61PlusMinor];
  return hasMoney({ minors }) ? [aging] : [];
}
