import type { TooltipContentProps } from "recharts";
import { chartSeriesColor } from "../chart/chart";
import type { ChartSeries } from "./chart-model";

export type ChartTooltipBodyProps = Pick<TooltipContentProps, "active" | "payload" | "label"> & {
  series: ChartSeries[];
};

/** Tooltip card: the category and the preformatted text of every series. */
export function ChartTooltipBody({ active, payload, label, series }: ChartTooltipBodyProps) {
  const datum = payload?.[0]?.payload as Record<string, string | number> | undefined;
  if (!active || !datum) return null;
  return (
    <div
      data-slot="chart-tooltip"
      className="grid gap-1 rounded-md border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-md"
    >
      <span className="font-medium">{label ?? datum.label}</span>
      {series.map(({ label: name }, index) => (
        <span key={name} className="flex items-center gap-2">
          <span
            aria-hidden
            className="size-2 rounded-full"
            style={{ backgroundColor: chartSeriesColor({ index }) }}
          />
          <span className="text-muted-foreground">{name}</span>
          <span className="ml-auto font-medium">{datum[`t${index}`]}</span>
        </span>
      ))}
    </div>
  );
}
