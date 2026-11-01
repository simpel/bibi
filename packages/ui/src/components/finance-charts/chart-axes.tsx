import { XAxis, YAxis } from "recharts";

export type ChartAxesInput = { horizontal: boolean; domain?: [number, number] };

const LABEL_WIDTH = 120;

/**
 * Category axis with labels, value axis hidden (the tooltip and the table carry the numbers).
 * Called as a function, not rendered: recharts reads its children's elements directly.
 */
export function ChartAxes({ horizontal, domain }: ChartAxesInput) {
  if (horizontal) {
    return [
      <XAxis key="x" type="number" hide {...(domain ? { domain } : {})} />,
      <YAxis
        key="y"
        type="category"
        dataKey="label"
        tickLine={false}
        axisLine={false}
        width={LABEL_WIDTH}
      />,
    ];
  }
  return [
    <XAxis key="x" dataKey="label" tickLine={false} axisLine={false} />,
    <YAxis key="y" hide {...(domain ? { domain } : {})} />,
  ];
}
