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
        id: "program",
        label: "This booking",
        blocks: [
          { id: "a", start: 9 * 60, end: 12 * 60, label: "Meeting room", tone: "draft" },
          { id: "b", start: 12 * 60, end: 13 * 60, label: "Lunch", tone: "draft" },
        ],
      },
      {
        id: "room",
        label: "Meeting room Vinga",
        blocks: [
          { id: "c", start: 8 * 60, end: 10 * 60, label: "#41 Saab", tone: "hard" },
          { id: "d", start: 9 * 60, end: 12 * 60, label: "Meeting room", tone: "clash" },
          { id: "e", start: 14 * 60, end: 16 * 60, label: "#44 Ericsson", tone: "soft" },
        ],
      },
    ],
  },
} satisfies Meta<typeof DaySnapshot>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { render: (args) => <DaySnapshot {...args} className="w-[40rem]" /> };

export const PastMidnight: Story = { ...Default, args: { endMinute: 26 * 60 } };
