import type { Meta, StoryObj } from "@storybook/react-vite";
import { Bar, BarChart, CartesianGrid, Tooltip as ChartTooltip, XAxis, YAxis } from "recharts";
import { ChartContainer, chartSeriesColor } from "./chart";

const data = [
  { week: "W1", bookings: 4, options: 2 },
  { week: "W2", bookings: 7, options: 3 },
  { week: "W3", bookings: 5, options: 6 },
  { week: "W4", bookings: 9, options: 1 },
];

function Demo() {
  return (
    <ChartContainer label="Bookings and options per week">
      <BarChart data={data}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="week" tickLine={false} axisLine={false} />
        <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={24} />
        <ChartTooltip />
        <Bar dataKey="bookings" fill={chartSeriesColor({ index: 0 })} radius={4} />
        <Bar dataKey="options" fill={chartSeriesColor({ index: 1 })} radius={4} />
      </BarChart>
    </ChartContainer>
  );
}

const meta = { title: "Components/Chart", component: Demo } satisfies Meta<typeof Demo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Bars: Story = {};
