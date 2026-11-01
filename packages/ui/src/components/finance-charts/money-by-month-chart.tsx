import { BarSeriesChart } from "./bar-series-chart";
import type { ChartPoint } from "./chart-model";

export type MoneyByMonthRow = { label: string; invoiced: ChartPoint; received: ChartPoint };

export type MoneyByMonthChartProps = {
  label: string;
  categoryLabel: string;
  invoicedLabel: string;
  receivedLabel: string;
  months: MoneyByMonthRow[];
};

/** Invoiced against received per month, as grouped bars. */
export function MoneyByMonthChart({
  label,
  categoryLabel,
  invoicedLabel,
  receivedLabel,
  months,
}: MoneyByMonthChartProps) {
  return (
    <BarSeriesChart
      label={label}
      categoryLabel={categoryLabel}
      series={[{ label: invoicedLabel }, { label: receivedLabel }]}
      rows={months.map(({ label, invoiced, received }) => ({
        label,
        points: [invoiced, received],
      }))}
    />
  );
}
