"use client";

import { Bar, BarChart, CartesianGrid, Tooltip as ChartTooltip } from "recharts";
import { ChartContainer, chartSeriesColor } from "../chart/chart";
import { ChartAxes } from "./chart-axes";
import { ChartDataTable } from "./chart-data-table";
import { type ChartRow, type ChartSeries, toChartData } from "./chart-model";
import { ChartTooltipBody } from "./chart-tooltip";

export type BarOrientation = "columns" | "rows";

export type BarSeriesChartProps = {
  /** Accessible name; also the caption of the screen-reader table. */
  label: string;
  /** The heading of the category column in the screen-reader table. */
  categoryLabel: string;
  series: ChartSeries[];
  rows: ChartRow[];
  /** `columns` = vertical bars over a category axis, `rows` = horizontal bars. */
  orientation?: BarOrientation;
};

const ROW_HEIGHT = 36;

/** Grouped bars from preformatted data; the numbers are also written out in a hidden table. */
export function BarSeriesChart({
  label,
  categoryLabel,
  series,
  rows,
  orientation = "columns",
}: BarSeriesChartProps) {
  const horizontal = orientation === "rows";
  const style = horizontal ? { height: Math.max(160, rows.length * ROW_HEIGHT + 24) } : undefined;
  return (
    <div data-slot="bar-series-chart">
      <ChartContainer label={label} style={style}>
        <BarChart data={toChartData({ rows })} layout={horizontal ? "vertical" : "horizontal"}>
          <CartesianGrid vertical={horizontal} horizontal={!horizontal} />
          {ChartAxes({ horizontal })}
          <ChartTooltip content={(props) => <ChartTooltipBody {...props} series={series} />} />
          {series.map(({ label: name }, index) => (
            <Bar
              key={name}
              dataKey={`v${index}`}
              fill={chartSeriesColor({ index })}
              radius={4}
              isAnimationActive={false}
            />
          ))}
        </BarChart>
      </ChartContainer>
      <ChartDataTable caption={label} categoryLabel={categoryLabel} series={series} rows={rows} />
    </div>
  );
}
