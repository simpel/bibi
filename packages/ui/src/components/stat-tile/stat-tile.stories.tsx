import type { Meta, StoryObj } from "@storybook/react-vite";
import { StatTile } from "./stat-tile";

const meta = {
  title: "Components/StatTile",
  component: StatTile,
  args: { label: "Invoiced excl. VAT", value: "1 240 000,00 kr" },
} satisfies Meta<typeof StatTile>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Overdue: Story = {
  args: { label: "Overdue", value: "86 500,00 kr", hint: "3 invoices", tone: "destructive" },
};
