import type { Meta, StoryObj } from "@storybook/react-vite";
import { OrderView } from "./order-view";

const meta = {
  title: "Components/OrderView",
  component: OrderView,
  args: {
    title: <span className="hover:underline">#72 Board offsite</span>,
    status: { name: "Confirmed", color: "#22c55e" },
    hidden: "–",
    facts: [
      { key: "customer", label: "Customer", value: "Hisingen Energi AB" },
      { key: "contact", label: "Contact", value: "Anna Svensson, anna@example.com" },
      { key: "period", label: "When", value: "12 Nov 2026, 09:00–16:00" },
      { key: "guests", label: "Guests", value: "42" },
      { key: "assignee", label: "Assigned to", value: "Erik Lund" },
      { key: "lines", label: "Lines", value: "6" },
      { key: "total", label: "Total excl. VAT", value: "48 200,00 kr" },
      { key: "balance", label: "Open balance", value: "12 000,00 kr", tone: "warning" },
      { key: "issues", label: "Issues", value: "2", tone: "warning" },
    ],
    footer: <span className="text-primary underline">Open order</span>,
  },
} satisfies Meta<typeof OrderView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** A member without customer, program or payment access: those facts show the hidden text. */
export const Restricted: Story = {
  args: {
    status: null,
    facts: [
      { key: "customer", label: "Customer", value: null },
      { key: "guests", label: "Guests", value: "42" },
      { key: "assignee", label: "Assigned to", value: "Erik Lund" },
      { key: "total", label: "Total excl. VAT", value: null },
      { key: "balance", label: "Open balance", value: null },
    ],
  },
};
