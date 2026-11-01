"use client";

import { cva } from "class-variance-authority";
import { Bar, BarChart, CartesianGrid, Tooltip as ChartTooltip } from "recharts";
import { ChartContainer, chartSeriesColor } from "../chart/chart";
import { ChartAxes } from "./chart-axes";
import { ChartDataTable } from "./chart-data-table";
import { type ChartRow, type ChartSeries, toChartData } from "./chart-model";
import { ChartTooltipBody } from "./chart-tooltip";

export type BarOrientation = "columns" | "rows";

export const barSeriesChartVariants = cva("", {
  variants: { table: { hidden: "", beside: "grid items-start gap-4 md:grid-cols-2" } },
  defaultVariants: { table: "hidden" },
});

export type BarSeriesChartProps = {
  /** Accessible name; also the caption of the screen-reader table. */
  label: string;
  /** The heading of the category column in the screen-reader table. */
  categoryLabel: string;
  series: ChartSeries[];
  rows: ChartRow[];
  /** `columns` = vertical bars over a category axis, `rows` = horizontal bars. */
  orientation?: BarOrientation;
  /** Stack the series on top of each other instead of grouping them. */
  stacked?: boolean;
  /** Fixed range of the value axis (default: fitted to the data). */
  domain?: [number, number];
  /** `beside` shows the numbers as a visible table next to the chart. */
  table?: "hidden" | "beside";
};

const ROW_HEIGHT = 36;

type HeightInput = { horizontal: boolean; count: number };

const heightStyle = ({ horizontal, count }: HeightInput) =>
  horizontal ? { height: Math.max(160, count * ROW_HEIGHT + 24) } : undefined;

type BarsInput = { series: ChartSeries[]; stacked: boolean };

/** One `Bar` per series; called as a function because recharts reads its children directly. */
const seriesBars = ({ series, stacked }: BarsInput) =>
  series.map(({ label: name }, index) => (
    <Bar
      key={name}
      dataKey={`v${index}`}
      fill={chartSeriesColor({ index })}
      {...(stacked ? { stackId: "stack" } : {})}
      radius={4}
      isAnimationActive={false}
    />
  ));

/** Grouped bars from preformatted data; the numbers are also written out in a hidden table. */
export function BarSeriesChart({
  label,
  categoryLabel,
  series,
  rows,
  orientation = "columns",
  stacked = false,
  domain,
  table = "hidden",
}: BarSeriesChartProps) {
  const horizontal = orientation === "rows";
  const style = heightStyle({ horizontal, count: rows.length });
  return (
    <div data-slot="bar-series-chart" className={barSeriesChartVariants({ table })}>
      <ChartContainer label={label} style={style}>
        <BarChart data={toChartData({ rows })} layout={horizontal ? "vertical" : "horizontal"}>
          <CartesianGrid vertical={horizontal} horizontal={!horizontal} />
          {ChartAxes({ horizontal, ...(domain ? { domain } : {}) })}
          <ChartTooltip content={(props) => <ChartTooltipBody {...props} series={series} />} />
          {seriesBars({ series, stacked })}
        </BarChart>
      </ChartContainer>
      <ChartDataTable
        caption={label}
        categoryLabel={categoryLabel}
        series={series}
        rows={rows}
        placement={table}
      />
    </div>
  );
}
