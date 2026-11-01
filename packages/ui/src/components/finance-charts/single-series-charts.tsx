import { BarSeriesChart } from "./bar-series-chart";
import type { ChartPoint } from "./chart-model";

export type AgingBucket = { label: string; point: ChartPoint };

export type AgingChartProps = {
  label: string;
  categoryLabel: string;
  amountLabel: string;
  buckets: AgingBucket[];
};

/** Open amount per age bucket, as bars. */
export function AgingChart({ label, categoryLabel, amountLabel, buckets }: AgingChartProps) {
  return (
    <BarSeriesChart
      label={label}
      categoryLabel={categoryLabel}
      series={[{ label: amountLabel }]}
      rows={buckets.map(({ label, point }) => ({ label, points: [point] }))}
      orientation="columns"
    />
  );
}

export type ForwardBookedMonthRow = { label: string; point: ChartPoint };

export type ForwardBookedChartProps = {
  label: string;
  categoryLabel: string;
  valueLabel: string;
  months: ForwardBookedMonthRow[];
};

/** Accepted but not yet invoiced value per month, as bars. */
export function ForwardBookedChart({
  label,
  categoryLabel,
  valueLabel,
  months,
}: ForwardBookedChartProps) {
  return (
    <BarSeriesChart
      label={label}
      categoryLabel={categoryLabel}
      series={[{ label: valueLabel }]}
      rows={months.map(({ label, point }) => ({ label, points: [point] }))}
      orientation="columns"
    />
  );
}

export type RevenueByTypeRow = { label: string; point: ChartPoint };

export type RevenueByTypeChartProps = {
  label: string;
  categoryLabel: string;
  amountLabel: string;
  types: RevenueByTypeRow[];
};

/** Invoiced amount per item type, as horizontal bars. */
export function RevenueByTypeChart({
  label,
  categoryLabel,
  amountLabel,
  types,
}: RevenueByTypeChartProps) {
  return (
    <BarSeriesChart
      label={label}
      categoryLabel={categoryLabel}
      series={[{ label: amountLabel }]}
      rows={types.map(({ label, point }) => ({ label, points: [point] }))}
      orientation="rows"
    />
  );
}
