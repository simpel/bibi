import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { PhoneInput } from "./phone-input";

const meta = {
  title: "Components/PhoneInput",
  component: PhoneInput,
  args: { value: "+46 70 123 45 67", onValueChange: () => {}, "aria-label": "Phone" },
} satisfies Meta<typeof PhoneInput>;

export default meta;
type Story = StoryObj<typeof meta>;

function Demo({ initial }: { initial: string }) {
  const [value, setValue] = useState(initial);
  return (
    <div className="grid max-w-sm gap-2">
      <PhoneInput value={value} onValueChange={setValue} aria-label="Phone" />
      <p className="text-sm text-muted-foreground">Value: {value || "–"}</p>
    </div>
  );
}

export const Default: Story = { render: () => <Demo initial="+46 70 123 45 67" /> };
export const Empty: Story = { render: () => <Demo initial="" /> };
export const SwedishNational: Story = { render: () => <Demo initial="070-123 45 67" /> };
export const Invalid: Story = { args: { value: "123", "aria-invalid": true } };
export const Disabled: Story = { args: { disabled: true } };
