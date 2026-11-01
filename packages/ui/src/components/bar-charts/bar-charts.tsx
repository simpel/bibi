import { BarSeriesChart } from "../finance-charts/bar-series-chart";
import type { ChartPoint, ChartSeries } from "../finance-charts/chart-model";

export type StackedBarRow = { label: string; points: ChartPoint[] };

export type StackedBarChartProps = {
  label: string;
  categoryLabel: string;
  series: ChartSeries[];
  rows: StackedBarRow[];
};

/** Vertical bars with the series stacked per category and the numbers in a table beside it. */
export function StackedBarChart({ label, categoryLabel, series, rows }: StackedBarChartProps) {
  return (
    <BarSeriesChart
      label={label}
      categoryLabel={categoryLabel}
      series={series}
      rows={rows}
      stacked
      table="beside"
    />
  );
}

/** `point.value` is a share from 0 to 100; `point.text` is what the tooltip and table say. */
export type RateBarRow = { label: string; point: ChartPoint };

export type RateBarChartProps = {
  label: string;
  categoryLabel: string;
  rateLabel: string;
  rows: RateBarRow[];
};

/** Horizontal bars of a share (0 to 100 %) per category, with a table beside the chart. */
export function RateBarChart({ label, categoryLabel, rateLabel, rows }: RateBarChartProps) {
  return (
    <BarSeriesChart
      label={label}
      categoryLabel={categoryLabel}
      series={[{ label: rateLabel }]}
      rows={rows.map(({ label: name, point }) => ({ label: name, points: [point] }))}
      orientation="rows"
      domain={[0, 100]}
      table="beside"
    />
  );
}
