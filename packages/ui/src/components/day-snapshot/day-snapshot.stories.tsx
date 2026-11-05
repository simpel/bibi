import type { Meta, StoryObj } from "@storybook/react-vite";
import { DaySnapshot } from "./day-snapshot";

const meta = {
  title: "Components/DaySnapshot",
  component: DaySnapshot,
  args: {
    startMinute: 8 * 60,
    endMinute: 20 * 60,
    hourLabel: ({ hour }) => (hour >= 24 ? `${String(hour - 24).padStart(2, "0")} +1` : `${hour}`),
    rows: [
      {
        id: "room",
        label: "Meeting room Vinga",
        blocks: [
          { id: "c", start: 8 * 60, end: 10 * 60, label: "#41 Saab", tone: "hard" },
          { id: "d", start: 9 * 60, end: 12 * 60, label: "Meeting room", tone: "clash" },
          { id: "e", start: 14 * 60, end: 16 * 60, label: "#44 Ericsson", tone: "soft" },
          { id: "f", start: 16 * 60, end: 16 * 60 + 15, label: "#45 Volvo Cars", tone: "hard" },
        ],
      },
      {
        id: "other",
        label: "Other lines",
        blocks: [{ id: "b", start: 12 * 60, end: 13 * 60, label: "Lunch buffet", tone: "draft" }],
      },
    ],
  },
} satisfies Meta<typeof DaySnapshot>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { render: (args) => <DaySnapshot {...args} className="w-[40rem]" /> };

export const PastMidnight: Story = { ...Default, args: { endMinute: 26 * 60 } };

/** Narrow: the label column stays, the hours shrink, and nothing scrolls sideways. */
export const Narrow: Story = { render: (args) => <DaySnapshot {...args} className="w-[22rem]" /> };

/** A saved order's day (the order page): its lines solid, the day's other bookings dimmed. */
export const Saved: Story = {
  ...Default,
  args: {
    rows: [
      {
        id: "room",
        label: "Meeting room Vinga",
        blocks: [
          { id: "a", start: 8 * 60, end: 10 * 60, label: "#41 Saab", tone: "hard" },
          { id: "b", start: 10 * 60, end: 12 * 60, label: "Morning session", tone: "own" },
          { id: "c", start: 14 * 60, end: 16 * 60, label: "#44 Ericsson", tone: "soft" },
        ],
      },
    ],
  },
};
