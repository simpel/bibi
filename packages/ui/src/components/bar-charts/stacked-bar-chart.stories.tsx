import type { Meta, StoryObj } from "@storybook/react-vite";
import { StackedBarChart } from "./bar-charts";

const row = (label: string, a: number, b: number) => ({
  label,
  points: [
    { value: a, text: `${a} · ${a * 10000} kr` },
    { value: b, text: `${b} · ${b * 10000} kr` },
  ],
});

const meta = {
  title: "Components/StackedBarChart",
  component: StackedBarChart,
  args: {
    label: "Outcomes per month",
    categoryLabel: "Month",
    series: [{ label: "Won" }, { label: "Lost" }],
    rows: [row("jan 26", 4, 2), row("feb 26", 6, 1), row("mar 26", 3, 3)],
  },
} satisfies Meta<typeof StackedBarChart>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
