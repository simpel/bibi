import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import type { DateRange } from "react-day-picker";
import { DateButton, DateRangeButton } from "./date-button";

const meta: Meta = { title: "Components/DatePicker" };

export default meta;
type Story = StoryObj;

const text = (date: Date | undefined) => (date ? date.toISOString().slice(0, 10) : "");

export const Single: Story = {
  render: () => {
    const [value, setValue] = useState<Date | undefined>();
    return (
      <DateButton
        value={value}
        onChange={setValue}
        label={text(value)}
        placeholder="Pick a date"
        clearLabel="Clear"
      />
    );
  },
};

export const Range: Story = {
  render: () => {
    const [range, setRange] = useState<DateRange | undefined>();
    const day = 86_400_000;
    const presets = [7, 30].map((days) => ({
      key: String(days),
      label: `Last ${days} days`,
      range: { from: new Date(Date.now() - days * day), to: new Date() },
    }));
    return (
      <DateRangeButton
        range={range}
        onChange={setRange}
        presets={presets}
        label={range ? `${text(range.from)} – ${text(range.to)}` : ""}
        placeholder="Pick a span"
      />
    );
  },
};
