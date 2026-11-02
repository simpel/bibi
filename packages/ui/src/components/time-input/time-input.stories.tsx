import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { TimeInput } from "./time-input";

const meta = {
  title: "Components/TimeInput",
  component: TimeInput,
  args: { value: "09:00", onValueChange: () => {}, "aria-label": "From" },
  argTypes: { width: { control: "select", options: ["auto", "full"] } },
} satisfies Meta<typeof TimeInput>;

export default meta;
type Story = StoryObj<typeof meta>;

function Demo({ initial }: { initial: string }) {
  const [value, setValue] = useState(initial);
  return (
    <div className="grid gap-2">
      <TimeInput value={value} onValueChange={setValue} aria-label="From" />
      <p className="text-sm text-muted-foreground">Value: {value || "–"}</p>
    </div>
  );
}

export const Default: Story = { render: () => <Demo initial="09:00" /> };
export const Empty: Story = { render: () => <Demo initial="" /> };
export const Invalid: Story = { args: { value: "25:00", "aria-invalid": true } };
export const Disabled: Story = { args: { disabled: true } };
