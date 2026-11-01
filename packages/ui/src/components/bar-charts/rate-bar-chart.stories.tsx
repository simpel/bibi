import type { Meta, StoryObj } from "@storybook/react-vite";
import { RateBarChart } from "./bar-charts";

const meta = {
  title: "Components/RateBarChart",
  component: RateBarChart,
  args: {
    label: "Utilisation",
    categoryLabel: "Type",
    rateLabel: "Utilisation",
    rows: [
      { label: "Rooms", point: { value: 62, text: "62 % (120 h of 190 h)" } },
      { label: "Staff", point: { value: 35, text: "35 % (70 h of 200 h)" } },
    ],
  },
} satisfies Meta<typeof RateBarChart>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
