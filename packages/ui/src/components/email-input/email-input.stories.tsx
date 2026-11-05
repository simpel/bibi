import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { EmailInput } from "./email-input";

const meta = {
  title: "Components/EmailInput",
  component: EmailInput,
  args: { value: "alice@example.com", onValueChange: () => {}, "aria-label": "Email" },
} satisfies Meta<typeof EmailInput>;

export default meta;
type Story = StoryObj<typeof meta>;

function Demo({ initial }: { initial: string }) {
  const [value, setValue] = useState(initial);
  return (
    <div className="grid max-w-sm gap-2">
      <EmailInput value={value} onValueChange={setValue} aria-label="Email" />
      <p className="text-sm text-muted-foreground">Value: {value || "–"}</p>
    </div>
  );
}

export const Default: Story = { render: () => <Demo initial="alice@example.com" /> };
export const Empty: Story = { render: () => <Demo initial="" /> };
export const Invalid: Story = { args: { value: "invalid-email", "aria-invalid": true } };
export const Disabled: Story = { args: { disabled: true } };
