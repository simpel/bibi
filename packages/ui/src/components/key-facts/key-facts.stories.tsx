import type { Meta, StoryObj } from "@storybook/react-vite";
import { KeyFacts } from "./key-facts";

const meta = {
  title: "Components/KeyFacts",
  component: KeyFacts,
  args: {
    facts: [
      { label: "Customer", value: "Kvarnby Design AB", truncate: true },
      { label: "Contact person", value: "Linnea Kvist" },
      { label: "Desired dates", value: "5 Nov 2026, 09:00 – 17:00" },
      { label: "Estimated headcount", value: "16" },
    ],
  },
} satisfies Meta<typeof KeyFacts>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Large: Story = {};

export const Small: Story = {
  args: {
    size: "sm",
    facts: [
      { label: "Value", value: "11 200 kr" },
      { label: "Quantity", value: "2" },
      { label: "Time", value: "13:00–17:00" },
      { label: "Where", value: "Donsö" },
    ],
  },
};
