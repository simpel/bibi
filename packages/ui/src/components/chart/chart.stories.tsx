import type { Meta, StoryObj } from "@storybook/react-vite";
import { Bar, BarChart, CartesianGrid, Tooltip as ChartTooltip, XAxis, YAxis } from "recharts";
import { ChartContainer, chartSeriesColor } from "./chart";

const data = [
  { week: "W1", tickets: 4, options: 2 },
  { week: "W2", tickets: 7, options: 3 },
  { week: "W3", tickets: 5, options: 6 },
  { week: "W4", tickets: 9, options: 1 },
];

function Demo() {
  return (
    <ChartContainer label="Tickets and options per week">
      <BarChart data={data}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="week" tickLine={false} axisLine={false} />
        <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={24} />
        <ChartTooltip />
        <Bar dataKey="tickets" fill={chartSeriesColor({ index: 0 })} radius={4} />
        <Bar dataKey="options" fill={chartSeriesColor({ index: 1 })} radius={4} />
      </BarChart>
    </ChartContainer>
  );
}

const meta = { title: "Components/Chart", component: Demo } satisfies Meta<typeof Demo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Bars: Story = {};
