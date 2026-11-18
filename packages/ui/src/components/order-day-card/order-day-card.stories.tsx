import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import type { PinnedBooking } from "../availability-calendar/pins-context";
import { Badge } from "../badge/badge";
import type { CardSurface } from "../booking-tone/booking-tone";
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
    date: "Day 2 of 3",
    subtitle: "Volvo Cars · Your responsibility",
    facts,
  },
  decorators: [(Story) => <div className="max-w-sm">{Story()}</div>],
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Confirmed: Story = {};

/** Something needs fixing: an amber badge in the header, the most urgent flag in the bottom row. */
export const Warning: Story = {
  args: {
    booking: {
      ...booking,
      issues: [{ key: "run-sheet", level: "warning", label: "Kitchen order changed" }],
    },
    footer: <Badge variant="warning">Kitchen order changed</Badge>,
  },
};

/** Something blocks it: a red badge in the header. */
export const Blocked: Story = {
  args: {
    booking: {
      ...booking,
      issues: [{ key: "clash", level: "error", label: "Room blocked by #1049" }],
    },
  },
};

const soft: PinnedBooking = {
  ...booking,
  state: { ...booking.state, name: "Prebooked", hold: "soft" },
};

const SURFACES: { name: string; surface: CardSurface; tentative?: boolean }[] = [
  { name: "plain", surface: {} },
  { name: "preliminary", surface: {}, tentative: true },
  { name: "following", surface: { following: true } },
  { name: "preliminary + following", surface: { following: true }, tentative: true },
  { name: "done", surface: { done: true } },
  {
    name: "preliminary + following + done",
    surface: { following: true, done: true },
    tentative: true,
  },
];

/** Each fact has its own cue on the surface, and the cues combine (spec: home, Tone). */
export const Surfaces: Story = {
  render: (args) => (
    <div className="grid gap-3">
      {SURFACES.map(({ name, surface, tentative }) => (
        <Card
          key={name}
          {...args}
          booking={tentative ? soft : booking}
          surface={surface}
          subtitle={`Volvo Cars · ${name}`}
        />
      ))}
    </div>
  ),
};

/** Happening now: the pulsing Live in the footer, never the surface. */
export const Live: Story = {
  args: {
    footer: (
      <span className="inline-flex items-center gap-1.5 font-semibold text-[10px] text-success uppercase tracking-wide">
        <span aria-hidden className="size-1.5 animate-pulse rounded-full bg-success" />
        Live
      </span>
    ),
  },
};
