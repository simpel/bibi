import type { Meta, StoryObj } from "@storybook/react-vite";
import { Badge } from "../badge/badge";
import type { BookingTone } from "../booking-tone/booking-tone";
import { OrderDayCard } from "./order-day-card";

const facts = [
  { label: "Guests", value: "48" },
  { label: "When", preheader: "Day 2 of 3", value: "09:00–16:30" },
  { label: "Where", value: "Älvrummet", truncate: true },
];

const meta = {
  title: "Components/OrderDayCard",
  component: OrderDayCard,
  args: {
    title: "HR offsite",
    reference: "#1042",
    subtitle: "Volvo Cars · Kitchen",
    href: "/orders/1042",
    status: { name: "Confirmed", color: "var(--chart-1)" },
    facts,
    tone: "confirmed",
  },
  decorators: [(Story) => <div className="max-w-sm">{Story()}</div>],
} satisfies Meta<typeof OrderDayCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Confirmed: Story = {};

/** The member has something to do: the most urgent flag and how many more. */
export const Action: Story = {
  args: {
    tone: "action",
    flag: <Badge variant="warning">Kitchen order changed</Badge>,
    more: "+2",
  },
};

export const Conflict: Story = {
  args: { tone: "conflict", flag: <Badge variant="destructive">Room blocked by #1049</Badge> },
};

export const Live: Story = { args: { tone: "live", live: "Live" } };

const TONES: BookingTone[] = [
  "conflict",
  "action",
  "live",
  "tentative",
  "confirmed",
  "done",
  "following",
];

/** Every tone, as the start page's timeline shows them. */
export const AllTones: Story = {
  render: (args) => (
    <div className="grid gap-3">
      {TONES.map((tone) => (
        <OrderDayCard key={tone} {...args} tone={tone} subtitle={`Volvo Cars · ${tone}`} />
      ))}
    </div>
  ),
};
