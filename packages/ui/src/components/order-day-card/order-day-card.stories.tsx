import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import type { PinnedBooking } from "../availability-calendar/pins-context";
import { Badge } from "../badge/badge";
import type { BookingTone } from "../booking-tone/booking-tone";
import { OrderDayCard, type OrderDayCardProps } from "./order-day-card";

const booking: PinnedBooking = {
  id: "order_1042:2026-11-16",
  orderId: "order_1042",
  name: "HR offsite",
  type: "",
  place: "Älvrummet",
  assetId: "order_1042:2026-11-16",
  assetName: "Älvrummet",
  date: "2026-11-16",
  start: "09:00",
  end: "16:30",
  setupMinutes: 0,
  teardownMinutes: 0,
  state: {
    name: "Confirmed",
    color: "var(--chart-1)",
    ink: "var(--primary-foreground)",
    hold: "hard",
  },
  quantity: 1,
  order: "1042",
  reference: "1042",
  customer: "Volvo Cars",
  headcount: 48,
};

const facts = [
  { key: "assignee", label: "Assigned to", value: "Johan Ek" },
  { key: "total", label: "Total excl. VAT", value: "48 200,00 kr" },
  { key: "issues", label: "Issues", value: "1", tone: "warning" as const },
];

/** The card with its own expand state, as on My work. */
function Card(props: Omit<OrderDayCardProps, "expanded" | "onToggle">) {
  const [expanded, setExpanded] = useState(false);
  return <OrderDayCard {...props} expanded={expanded} onToggle={() => setExpanded(!expanded)} />;
}

const meta = {
  title: "Components/OrderDayCard",
  component: Card,
  args: {
    booking,
    href: "/orders/1042",
    tone: "confirmed",
    date: "Day 2 of 3",
    subtitle: "Volvo Cars · Your responsibility",
    facts,
  },
  decorators: [(Story) => <div className="max-w-sm">{Story()}</div>],
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Confirmed: Story = {};

/** The member has something to do: the most urgent flag in the bottom row. */
export const Action: Story = {
  args: { tone: "action", footer: <Badge variant="warning">Kitchen order changed</Badge> },
};

export const Conflict: Story = {
  args: { tone: "conflict", footer: <Badge variant="destructive">Room blocked by #1049</Badge> },
};

const TONES: BookingTone[] = [
  "conflict",
  "action",
  "live",
  "tentative",
  "confirmed",
  "done",
  "following",
];

/** Every tone: the outline and the header's wash, as the start page shows them. */
export const AllTones: Story = {
  render: (args) => (
    <div className="grid gap-3">
      {TONES.map((tone) => (
        <Card key={tone} {...args} tone={tone} subtitle={`Volvo Cars · ${tone}`} />
      ))}
    </div>
  ),
};
