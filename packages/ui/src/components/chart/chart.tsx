"use client";

import type { ComponentProps, ReactElement } from "react";
import { ResponsiveContainer } from "recharts";
import { cn } from "../../lib/cn";

const SERIES_COUNT = 5;

export type ChartSeriesColorInput = { index: number };

/** Token reference for the n-th series (cycles through `--chart-1` to `--chart-5`). */
export function chartSeriesColor({ index }: ChartSeriesColorInput): string {
  return `var(--chart-${(index % SERIES_COUNT) + 1})`;
}

export type ChartContainerProps = Omit<ComponentProps<"div">, "children"> & {
  /** Accessible name; charts are images to a screen reader, so also render a table or list nearby. */
  label: string;
  children: ReactElement;
};

/** Sizes a recharts chart to its parent, themes axes and grid with tokens. */
export function ChartContainer({ label, className, children, ...props }: ChartContainerProps) {
  return (
    <div
      data-slot="chart"
      role="img"
      aria-label={label}
      className={cn(
        "h-64 w-full text-xs",
        "[&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground",
        "[&_.recharts-cartesian-grid_line]:stroke-border",
        "[&_.recharts-tooltip-cursor]:fill-muted/50",
        className,
      )}
      {...props}
    >
      <ResponsiveContainer width="100%" height="100%">
        {children}
      </ResponsiveContainer>
    </div>
  );
}
