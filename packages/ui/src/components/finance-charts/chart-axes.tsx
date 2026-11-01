import { XAxis, YAxis } from "recharts";

export type ChartAxesInput = { horizontal: boolean };

const LABEL_WIDTH = 120;

/**
 * Category axis with labels, value axis hidden (the tooltip and the table carry the numbers).
 * Called as a function, not rendered: recharts reads its children's elements directly.
 */
export function ChartAxes({ horizontal }: ChartAxesInput) {
  if (horizontal) {
    return [
      <XAxis key="x" type="number" hide />,
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
    <YAxis key="y" hide />,
  ];
}
