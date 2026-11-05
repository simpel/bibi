import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { WebsiteInput } from "./website-input";

const meta = {
  title: "Components/WebsiteInput",
  component: WebsiteInput,
  args: { value: "https://example.se", onValueChange: () => {}, "aria-label": "Website" },
} satisfies Meta<typeof WebsiteInput>;

export default meta;
type Story = StoryObj<typeof meta>;

function Demo({ initial }: { initial: string }) {
  const [value, setValue] = useState(initial);
  return (
    <div className="grid max-w-sm gap-2">
      <WebsiteInput value={value} onValueChange={setValue} aria-label="Website" />
      <p className="text-sm text-muted-foreground">Value: {value || "–"}</p>
    </div>
  );
}

export const Default: Story = { render: () => <Demo initial="https://example.se" /> };
export const Empty: Story = { render: () => <Demo initial="" /> };
export const Invalid: Story = { args: { value: "invalid-url", "aria-invalid": true } };
export const Disabled: Story = { args: { disabled: true } };
