import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import type { DateRange } from "react-day-picker";
import { Calendar } from "./calendar";

const meta = { title: "Components/Calendar", component: Calendar } satisfies Meta<typeof Calendar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Range: Story = {
  render: () => {
    const [range, setRange] = useState<DateRange | undefined>({
      from: new Date(2026, 5, 3),
      to: new Date(2026, 5, 12),
    });
    return <Calendar mode="range" numberOfMonths={2} selected={range} onSelect={setRange} />;
  },
};
